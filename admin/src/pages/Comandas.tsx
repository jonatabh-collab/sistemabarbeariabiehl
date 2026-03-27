import { useState } from 'react';
import { Plus, ShoppingBag, CheckCircle, XCircle, Search, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrder, closeOrder, getProfessionals, getClients, getServices } from '../services/api';
import { X, Trash2 } from 'lucide-react';

function NewOrderModal({ onClose }: { onClose: (saved?: boolean) => void }) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [professionalId, setProfessionalId] = useState('');
  const [items, setItems] = useState<any[]>([]);
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

  const addItem = (service: any) => {
    const existing = items.find(i => i.service_id === service.id);
    if (existing) {
      setItems(items.map(i => i.service_id === service.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { service_id: service.id, product_name: service.name, price: service.price, quantity: 1 }]);
    }
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) { setError('Selecione um profissional'); return; }
    if (items.length === 0) { setError('Adicione ao menos um item'); return; }

    setLoading(true);
    setError('');
    try {
      await createOrder({ client_id: selectedClient?.id, professional_id: professionalId, items });
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Nova Comanda</h2>
          <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional *</label>
            <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} required
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Selecione...</option>
              {professionals.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setShowClientList(true); setSelectedClient(null); }}
                onFocus={() => setShowClientList(true)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Buscar cliente..." />
            </div>
            {showClientList && clients.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                {clients.map((c: any) => (
                  <button key={c.id} type="button"
                    onClick={() => { setSelectedClient(c); setClientSearch(c.name); setShowClientList(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm">{c.name} - {c.phone}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Serviços</label>
            <div className="grid grid-cols-2 gap-2">
              {services.filter((s: any) => s.active).map((svc: any) => (
                <button key={svc.id} type="button" onClick={() => addItem(svc)}
                  className="text-left px-3 py-2 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors">
                  <p className="text-sm font-medium text-gray-700">{svc.name}</p>
                  <p className="text-xs text-teal-600">R$ {svc.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">Itens da Comanda</p>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{item.product_name}</p>
                    <p className="text-xs text-gray-400">R$ {item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-teal-50 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="text-lg font-bold text-teal-700">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 text-sm disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar Comanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Comandas() {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => getOrders({ status: statusFilter }).then(r => r.data.orders),
    refetchInterval: 30000,
  });

  const orders = data || [];

  const handleClose = async (orderId: string) => {
    const method = prompt('Forma de pagamento? (cash/card/pix/transfer)') || 'cash';
    try {
      await closeOrder(orderId, { payment_method: method });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro');
    }
  };

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Dinheiro', card: 'Cartão', pix: 'Pix', transfer: 'Transferência'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comandas</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} comanda{orders.length !== 1 ? 's' : ''} {statusFilter === 'open' ? 'abertas' : 'fechadas'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {[{ value: 'open', label: 'Abertas' }, { value: 'closed', label: 'Fechadas' }].map(s => (
              <button key={s.value} onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === s.value ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
                }`}>{s.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
            <Plus className="w-4 h-4" />
            Nova Comanda
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma comanda {statusFilter === 'open' ? 'aberta' : 'fechada'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order: any) => (
            <div key={order.id} className={`bg-white rounded-2xl border ${
              order.status === 'open' ? 'border-teal-200' : 'border-gray-200'
            } shadow-sm p-5`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                  </div>
                  {order.client_name && (
                    <p className="font-semibold text-gray-800">{order.client_name}</p>
                  )}
                  <p className="text-sm text-gray-500">{order.professional_name}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  order.status === 'open' ? 'bg-teal-100 text-teal-700' :
                  order.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                }`}>
                  {order.status === 'open' ? (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Aberta</span>
                  ) : order.status === 'closed' ? (
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Fechada</span>
                  ) : 'Cancelada'}
                </span>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mb-3 space-y-1">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.quantity}x {item.product_name || 'Item'}</span>
                      <span className="text-gray-700 font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xl font-bold text-gray-800">R$ {order.total.toFixed(2)}</p>
                  {order.payment_method && (
                    <p className="text-xs text-gray-400">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
                  )}
                </div>
                {order.status === 'open' && (
                  <button onClick={() => handleClose(order.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700">
                    <CheckCircle className="w-4 h-4" />
                    Fechar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewOrderModal onClose={(saved) => {
          setShowModal(false);
          if (saved) queryClient.invalidateQueries({ queryKey: ['orders'] });
        }} />
      )}
    </div>
  );
}
