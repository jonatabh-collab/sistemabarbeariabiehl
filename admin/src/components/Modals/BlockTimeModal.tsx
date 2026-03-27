import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProfessionals, createBlockedTime } from '../../services/api';

interface Props {
  defaultDate?: string;
  onClose: () => void;
}

export default function BlockTimeModal({ defaultDate, onClose }: Props) {
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(defaultDate || '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('Agenda Bloqueada');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: profData } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => getProfessionals().then(r => r.data.professionals),
  });
  const professionals = profData || [];

  const timeOptions = [];
  for (let h = 7; h <= 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId || !date || !startTime || !endTime) {
      setError('Preencha todos os campos');
      return;
    }
    if (startTime >= endTime) {
      setError('Horário de início deve ser anterior ao fim');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createBlockedTime({ professional_id: professionalId, date, start_time: startTime, end_time: endTime, reason });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao bloquear horário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-700 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Bloquear Horário</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm bg-white"
              required
            >
              <option value="">Selecione...</option>
              {professionals.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <select
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm bg-white"
                required
              >
                <option value="">Início</option>
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm bg-white"
                required
              >
                <option value="">Fim</option>
                {timeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
              placeholder="Motivo do bloqueio"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 text-sm disabled:opacity-50">
              {loading ? 'Salvando...' : 'Bloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
