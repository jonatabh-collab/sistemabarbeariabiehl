import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Mail, Star, ChevronDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getClients, deleteClient, getClientAppointments } from '../../services/api';
import ClientModal from '../../components/Modals/ClientModal';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientAppointments, setClientAppointments] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients({ search, limit: 100 }).then(r => r.data),
  });

  const clients = data?.clients || [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover cliente "${name}"?`)) return;
    try {
      await deleteClient(id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const handleExpand = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      return;
    }
    setExpandedClient(clientId);
    const res = await getClientAppointments(clientId);
    setClientAppointments(res.data.appointments);
  };

  const handleModalClose = (saved?: boolean) => {
    setShowModal(false);
    setEditingClient(null);
    if (saved) queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} clientes cadastrados</p>
        </div>
        <button
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          placeholder="Buscar por nome, telefone ou email..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Pontos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client: any) => (
                <>
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{client.name}</p>
                          {client.birthdate && <p className="text-xs text-gray-400">Nasc: {client.birthdate}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {client.phone}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-sm text-gray-600">{client.loyalty_points || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExpand(client.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-teal-600 transition-colors"
                          title="Ver histórico"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedClient === client.id ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => { setEditingClient(client); setShowModal(true); }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedClient === client.id && (
                    <tr key={`${client.id}-expanded`}>
                      <td colSpan={5} className="px-4 pb-3 bg-gray-50">
                        <div className="ml-12">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Histórico de Agendamentos</p>
                          {clientAppointments.length === 0 ? (
                            <p className="text-xs text-gray-400">Nenhum agendamento encontrado</p>
                          ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {clientAppointments.slice(0, 5).map((appt: any) => (
                                <div key={appt.id} className="flex items-center gap-3 text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                  <span className="text-gray-400">{appt.date}</span>
                                  <span>{appt.start_time}</span>
                                  <span className="font-medium">{appt.service_name}</span>
                                  <span className="text-gray-400">com {appt.professional_name}</span>
                                  <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
                                    appt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {appt.status === 'completed' ? 'Concluído' : appt.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ClientModal client={editingClient} onClose={handleModalClose} />
      )}
    </div>
  );
}
