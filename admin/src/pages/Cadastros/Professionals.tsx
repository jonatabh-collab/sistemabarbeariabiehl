import { useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfessionals, createProfessional, updateProfessional, deleteProfessional } from '../../services/api';
import { X } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

function ProfModal({ prof, onClose }: { prof?: any; onClose: (saved?: boolean) => void }) {
  const isEditing = !!prof;
  const [name, setName] = useState(prof?.name || '');
  const [email, setEmail] = useState(prof?.email || '');
  const [phone, setPhone] = useState(prof?.phone || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(prof?.role || 'barber');
  const [color, setColor] = useState(prof?.color || '#10b981');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data: any = { name, email, phone, role, color };
      if (password) data.password = password;
      if (isEditing) {
        await updateProfessional(prof.id, data);
      } else {
        if (!password) { setError('Senha é obrigatória'); setLoading(false); return; }
        await createProfessional({ ...data, password });
      }
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Profissional' : 'Novo Profissional'}</h2>
          <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isEditing ? 'Nova Senha' : 'Senha *'}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={isEditing ? 'Deixe em branco para manter' : 'Senha'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="barber">Barbeiro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 text-sm disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Professionals() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => getProfessionals().then(r => r.data.professionals),
  });

  const professionals = data || [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Desativar "${name}"?`)) return;
    try {
      await deleteProfessional(id);
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  const handleModalClose = (saved?: boolean) => {
    setShowModal(false);
    setEditing(null);
    if (saved) queryClient.invalidateQueries({ queryKey: ['professionals'] });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-gray-500 text-sm mt-1">{professionals.length} profissionais</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Novo Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          professionals.map((prof: any) => (
            <div key={prof.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 ${!prof.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: prof.color }}
                  >
                    {prof.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{prof.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      prof.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {prof.role === 'admin' ? 'Admin' : 'Barbeiro'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(prof); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(prof.id, prof.name)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {prof.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{prof.email}</span>
                  </div>
                )}
                {prof.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5" />
                    {prof.phone}
                  </div>
                )}
              </div>
              {!prof.active && (
                <div className="mt-3 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500 text-center">Inativo</div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && <ProfModal prof={editing} onClose={handleModalClose} />}
    </div>
  );
}
