'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Users, Phone, Mail, Calendar, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { ClienteModal } from '@/components/clientes/ClienteModal'
import { formatDate } from '@/lib/utils'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: '20' })
      const res = await fetch(`/api/clientes?${params}`)
      const data = await res.json()
      setClientes(data.clientes || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  useEffect(() => { setPage(1) }, [search])

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500">{total} cliente(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum cliente encontrado</p>
            {search && <p className="text-sm">Tente outro termo de busca</p>}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Telefone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Nascimento</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Agendamentos</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 font-semibold text-sm">
                            {c.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.nome}</p>
                          {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{c.telefone}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {c.dataNascimento ? formatDate(c.dataNascimento) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{c._count?.agendamentos ?? 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * 20 >= total}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ClienteModal
          cliente={editingCliente}
          onClose={handleCloseModal}
          onSuccess={() => { handleCloseModal(); fetchClientes(); }}
        />
      )}
    </div>
  )
}
