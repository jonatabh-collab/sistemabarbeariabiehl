import { useState } from 'react';
import { Plus, Edit2, Scissors, Clock, DollarSign } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getServices, createService, updateService, deleteService } from '../../services/api';
import { X } from 'lucide-react';

function ServiceModal({ service, onClose }: { service?: any; onClose: (saved?: boolean) => void }) {
  const isEditing = !!service;
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [duration, setDuration] = useState(service?.duration || 30);
  const [price, setPrice] = useState(service?.price || '');
  const [category, setCategory] = useState(service?.category || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await updateService(service.id, { name, description, duration: Number(duration), price: Number(price), category });
      } else {
        await createService({ name, description, duration: Number(duration), price: Number(price), category });
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
          <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Serviço' : 'Novo Serviço'}</h2>
          <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ex: Corte de cabelo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Descrição do serviço..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min) *</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} required min={5} step={5}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} required step="0.01" min={0}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Cabelo" />
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

export default function Services() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices().then(r => r.data.services),
  });

  const services = data || [];
  const categories = [...new Set(services.map((s: any) => s.category).filter(Boolean))];

  const handleToggleActive = async (service: any) => {
    try {
      await updateService(service.id, { active: !service.active });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  const handleModalClose = (saved?: boolean) => {
    setShowModal(false);
    setEditing(null);
    if (saved) queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-500 text-sm mt-1">{services.filter((s: any) => s.active).length} serviços ativos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {(categories.length > 0 ? categories : ['Sem categoria']).map(cat => {
            const catServices = services.filter((s: any) => (s.category || 'Sem categoria') === cat);
            if (catServices.length === 0) return null;
            return (
              <div key={cat as string}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat as string}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catServices.map((svc: any) => (
                    <div
                      key={svc.id}
                      className={`bg-white rounded-2xl border border-gray-200 p-4 shadow-sm ${!svc.active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                            <Scissors className="w-4.5 h-4.5 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm">{svc.name}</h3>
                            {svc.description && <p className="text-xs text-gray-400 truncate max-w-32">{svc.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditing(svc); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(svc)}
                            className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                              svc.active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                            }`}
                          >
                            {svc.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{svc.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>R$ {svc.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <ServiceModal service={editing} onClose={handleModalClose} />}
    </div>
  );
}
