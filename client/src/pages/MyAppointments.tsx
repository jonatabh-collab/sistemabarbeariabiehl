import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getMyAppointments, updateAppointment } from '../services/api';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  no_show: { label: 'Não compareceu', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export default function MyAppointments() {
  const { client } = useClientAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const loadAppointments = () => {
    if (!client) return;
    setLoading(true);
    getMyAppointments(client.id)
      .then(r => setAppointments(r.data.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAppointments(); }, [client]);

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    try {
      setCancelling(id);
      await updateAppointment(id, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch {
      alert('Erro ao cancelar agendamento');
    } finally {
      setCancelling(null);
    }
  };

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <User className="w-14 h-14 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Acesso restrito</h2>
        <p className="text-gray-500 mb-6">Entre na sua conta para ver seus agendamentos.</p>
        <Link to="/login?redirect=/meus-agendamentos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700">
          Entrar
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a =>
    a.date >= today && a.status !== 'cancelled' && a.status !== 'completed'
  );
  const past = appointments.filter(a =>
    a.date < today || a.status === 'cancelled' || a.status === 'completed'
  );
  const displayed = filter === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Olá, {client.name}</p>
        </div>
        <button onClick={loadAppointments} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === 'upcoming' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Próximos ({upcoming.length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            filter === 'past' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico ({past.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum agendamento {filter === 'upcoming' ? 'futuro' : 'no histórico'}</p>
          {filter === 'upcoming' && (
            <Link to="/agendar"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 text-sm">
              Agendar agora
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed
            .sort((a, b) => a.date === b.date ? a.start_time.localeCompare(b.start_time) : a.date.localeCompare(b.date))
            .map((appt) => {
              const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
              const StatusIcon = cfg.icon;
              const dateFormatted = format(parseISO(appt.date), "EEEE, dd 'de' MMMM", { locale: ptBR });
              const canCancel = appt.status === 'scheduled' || appt.status === 'confirmed';

              return (
                <div key={appt.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Date & time */}
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 capitalize">{dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600">{appt.start_time} - {appt.end_time}</span>
                      </div>

                      {/* Service & professional */}
                      <div className="flex items-center gap-2 mb-1">
                        <Scissors className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">{appt.service_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600">{appt.professional_name}</span>
                      </div>

                      {/* Price */}
                      {appt.price && (
                        <p className="text-sm font-bold text-teal-700 mt-2">R$ {Number(appt.price).toFixed(2)}</p>
                      )}
                    </div>

                    {/* Status & actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancelling === appt.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {cancelling === appt.id ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* CTA */}
      {filter === 'upcoming' && upcoming.length > 0 && (
        <div className="mt-6 text-center">
          <Link to="/agendar"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 text-sm">
            + Novo agendamento
          </Link>
        </div>
      )}
    </div>
  );
}
