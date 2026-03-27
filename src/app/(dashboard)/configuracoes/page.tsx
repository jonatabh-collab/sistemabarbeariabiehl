'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Settings, User, Shield, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ROLE_LABELS } from '@/lib/utils'

export default function ConfiguracoesPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RECEPCIONISTA' })
  const [saving, setSaving] = useState(false)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário')
      toast.success('Usuário criado!')
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'RECEPCIONISTA' })
      fetchUsuarios()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      toast.success(ativo ? 'Usuário desativado' : 'Usuário ativado')
      fetchUsuarios()
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <p className="text-sm text-gray-500">Gerencie usuários do sistema</p>
      </div>

      {/* Usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">Usuários do Sistema</h3>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> Novo Usuário
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <h4 className="font-medium text-gray-800 text-sm">Criar Novo Usuário</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Nome</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">E-mail</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Senha</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Perfil</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="RECEPCIONISTA">Recepcionista</option>
                  <option value="BARBEIRO">Barbeiro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Criar Usuário
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center gap-4 py-3">
                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-sm">{u.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                  u.role === 'BARBEIRO' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ROLE_LABELS[u.role]}
                </span>
                <button
                  onClick={() => toggleAtivo(u.id, u.ativo)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    u.ativo
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {u.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
