'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, UserCheck, Percent, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarbeiroModal } from '@/components/barbeiros/BarbeiroModal'
import type { Barbeiro } from '@/types'

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBarbeiro, setEditingBarbeiro] = useState<Barbeiro | null>(null)

  const fetchBarbeiros = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/barbeiros')
      const data = await res.json()
      setBarbeiros(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar barbeiros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBarbeiros() }, [fetchBarbeiros])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Barbeiros</h2>
          <p className="text-sm text-gray-500">{barbeiros.length} barbeiro(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Barbeiro
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : barbeiros.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
          <UserCheck size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Nenhum barbeiro cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {barbeiros.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-lg">
                      {b.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{b.user.name}</p>
                    <p className="text-sm text-gray-500">{b.user.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {b.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Percent size={14} className="text-amber-500" />
                <span className="text-sm text-gray-700">Comissão: <strong>{b.comissao}%</strong></span>
              </div>

              {b.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {b.especialidades.map((esp, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setEditingBarbeiro(b); setShowModal(true) }}
                className="w-full text-sm text-center py-2 border border-amber-200 text-amber-600 rounded-xl hover:bg-amber-50 transition-colors font-medium"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BarbeiroModal
          barbeiro={editingBarbeiro}
          onClose={() => { setShowModal(false); setEditingBarbeiro(null) }}
          onSuccess={() => { setShowModal(false); setEditingBarbeiro(null); fetchBarbeiros() }}
        />
      )}
    </div>
  )
}
