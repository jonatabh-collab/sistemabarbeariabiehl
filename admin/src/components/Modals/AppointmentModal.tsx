import { useState, useEffect } from 'react';
import { X, Search, User, Clock, DollarSign, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getClients, getProfessionals, getServices, createAppointment, updateAppointment, deleteAppointment } from '../../services/api';

interface Props {
  appointment?: any;
  defaultDate?: string;
  defaultTime?: string;
  defaultProfId?: string;
  onClose: () => void;
}

export default function AppointmentModal({ appointment, defaultDate, defaultTime, defaultProfId, onClose }: Props) {
  const isEditing = !!appointment;

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [professionalId, setProfessionalId] = useState(appointment?.professional_id || defaultProfId || '');
  const [serviceId, setServiceId] = useState(appointment?.service_id || '');
  const [date, setDate] = useState(appointment?.date || defaultDate || '');
  const [startTime, setStartTime] = useState(appointment?.start_time || defaultTime || '');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [price, setPrice] = useState(appointment?.price || '');
  const [status, setStatus] = useState(appointment?.status || 'scheduled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: profData } = useQuery({ queryKey: ['professionals'], queryFn: () => getProfessionals().then(r => r.data.professionals) });
  const { data: servData } = useQuery({ queryKey: ['services'], queryFn: () => getServices().then(r => r.data.services) });
  const { data: clientData } = useQuery({
    queryKey: ['clients', clientSearch],
    queryFn: () => getClients({ search: clientSearch, limit: 10 }).then(r => r.data.clients),
    enabled: clientSearch.length > 0,
  });

  const professionals = profData || [];
  const services = servData || [];
  const clients = clientData || [];

  useEffect(() => {
    if (appointment) {
      setSelectedClient({ id: appointment.client_id, name: appointment.client_name, phone: appointment.client_phone });
      setClientSearch(appointment.client_name || '');
    }
  }, [appointment]);

  useEffect(() => {
    if (serviceId) {
      const svc = services.find((s: any) => s.id === serviceId);
      if (svc && !isEditing) setPrice(svc.price);
    }
  }, [serviceId, services]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient && !isEditing) { setError('Selecione um cliente'); return; }
    if (!professionalId) { setError('Selecione um profissional'); return; }
    if (!serviceId) { setError('Selecione um serviço'); return; }
    if (!date || !startTime) { setError('Data e horário são obrigatórios'); return; }

    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await updateAppointment(appointment.id, { status, notes, date, start_time: startTime, price: Number(price) });
      } else {
        await createAppointment({
          client_id: selectedClient.id,
          professional_id: professionalId,
          service_id: serviceId,
          date,
          start_time: startTime,
          notes,
          price: Number(price),
          source: 'admin',
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await deleteAppointment(appointment.id);
      onClose();
    } catch {
      setError('Erro ao cancelar');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateAppointment(appointment.id, { status: newStatus });
      onClose();
    } catch {
      setError('Erro ao atualizar status');
    }
  };

  const timeOptions = [];
  for (let h = 7; h < 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status quick actions (edit mode) */}
          {isEditing && (
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'confirmed', label: 'Confirmar', icon: CheckCircle, color: 'text-green-600 border-green-200 hover:bg-green-50' },
                { value: 'completed', label: 'Concluir', icon: CheckCircle, color: 'text-teal-600 border-teal-200 hover:bg-teal-50' },
                { value: 'no_show', label: 'Não veio', icon: AlertCircle, color: 'text-orange-600 border-orange-200 hover:bg-orange-50' },
                { value: 'cancelled', label: 'Cancelar', icon: XCircle, color: 'text-red-600 border-red-200 hover:bg-red-50' },
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleStatusChange(value)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Client */}
          {!isEditing ? (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientList(true); setSelectedClient(null); }}
                  onFocus={() => setShowClientList(true)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Buscar cliente por nome ou telefone..."
                />
              </div>
              {showClientList && clientSearch && clients.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {clients.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedClient(c); setClientSearch(c.name); setShowClientList(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedClient && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-xl border border-teal-200">
                  <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-teal-700">{selectedClient.name}</p>
                    <p className="text-xs text-teal-500">{selectedClient.phone}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{appointment.client_name}</p>
                <p className="text-sm text-gray-500">{appointment.client_phone}</p>
              </div>
            </div>
          )}

          {/* Professional + Service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
              {isEditing ? (
                <p className="text-sm text-gray-800 py-2">{appointment.professional_name}</p>
              ) : (
                <select
                  value={professionalId}
                  onChange={e => setProfessionalId(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {professionals.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
              {isEditing ? (
                <p className="text-sm text-gray-800 py-2">{appointment.service_name}</p>
              ) : (
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  required
                >
                  <option value="">Selecione...</option>
                  {services.filter((s: any) => s.active).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration}min)</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                required
              >
                <option value="">Selecione...</option>
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  step="0.01"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="no_show">Não compareceu</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                placeholder="Observações sobre o agendamento..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 text-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
