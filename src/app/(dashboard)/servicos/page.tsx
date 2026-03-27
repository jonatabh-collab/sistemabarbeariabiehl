'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Wrench, Clock, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { ServicoModal } from '@/components/servicos/ServicoModal'
import { formatCurrency } from '@/lib/utils'
import type { Servico } from '@/types'

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)

  const fetchServicos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/servicos?ativos=false')
      const data = await res.json()
      setServicos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchServicos() }, [fetchServicos])

  const toggleAtivo = async (servico: Servico) => {
    try {
      await fetch(`/api/servicos/${servico.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !servico.ativo }),
      })
      toast.success(servico.ativo ? 'Serviço desativado' : 'Serviço ativado')
      fetchServicos()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
          <p className="text-sm text-gray-500">{servicos.filter((s) => s.ativo).length} serviço(s) ativo(s)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Serviço</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Preço</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Duração</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicos.map((s) => (
                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${!s.ativo ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Wrench size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.nome}</p>
                        {s.descricao && <p className="text-xs text-gray-500 truncate max-w-xs">{s.descricao}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm font-semibold text-green-700">{formatCurrency(s.preco)}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} /> {s.duracao} min
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleAtivo(s)} className="flex items-center gap-1">
                      {s.ativo ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <ToggleRight size={14} /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <ToggleLeft size={14} /> Inativo
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setEditingServico(s); setShowModal(true) }}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ServicoModal
          servico={editingServico}
          onClose={() => { setShowModal(false); setEditingServico(null) }}
          onSuccess={() => { setShowModal(false); setEditingServico(null); fetchServicos() }}
        />
      )}
    </div>
  )
}
