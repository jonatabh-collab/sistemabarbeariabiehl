'use client'
// Gerenciamento de Usuários — somente Admin
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Shield,
  Edit,
  Loader2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
} from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'
import { Role } from '@prisma/client'
import { formatarData } from '@/lib/utils'

const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional().or(z.literal('')),
  role: z.nativeEnum(Role),
})

type UsuarioFormData = z.infer<typeof usuarioSchema>

interface Usuario {
  id: string
  nome: string
  email: string
  role: Role
  ativo: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
  })

  const carregarUsuarios = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await fetch('/api/admin/usuarios')
      const data = await resp.json()
      setUsuarios(data.usuarios || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { carregarUsuarios() }, [carregarUsuarios])

  const onSubmit = async (data: UsuarioFormData) => {
    setSalvando(true)
    try {
      const url = editando ? `/api/admin/usuarios/${editando.id}` : '/api/admin/usuarios'
      const method = editando ? 'PUT' : 'POST'

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (resp.ok) {
        setModalAberto(false)
        setEditando(null)
        reset()
        carregarUsuarios()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar usuário')
      }
    } catch {
      alert('Erro ao salvar usuário')
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/admin/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      carregarUsuarios()
    } catch {
      alert('Erro ao atualizar usuário')
    }
  }

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario)
    reset({ nome: usuario.nome, email: usuario.email, senha: '', role: usuario.role })
    setModalAberto(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Usuários</h2>
          <p className="text-sm text-[#888]">Gerenciar acessos ao sistema</p>
        </div>
        <button
          onClick={() => { setEditando(null); reset({ role: Role.RECEPCIONISTA }); setModalAberto(true) }}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-[#222] border border-[#333] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#2a2a2a] transition-colors ${!usuario.ativo ? 'opacity-50' : ''}`}
              >
                <div className="w-9 h-9 bg-[#333] rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-[#c9a84c]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#f5f0e8]">{usuario.nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[usuario.role]}`}>
                      {ROLE_LABELS[usuario.role]}
                    </span>
                  </div>
                  <p className="text-xs text-[#666]">
                    {usuario.email} · Criado em {formatarData(usuario.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!usuario.ativo && (
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                      Desativado
                    </span>
                  )}
                  <button
                    onClick={() => abrirEditar(usuario)}
                    className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#f5f0e8] transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAtivo(usuario.id, usuario.ativo)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      usuario.ativo
                        ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-[#555] hover:text-green-400 hover:bg-green-500/10'
                    }`}
                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {usuario.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de usuário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Nome completo *</label>
                <input
                  {...register('nome')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="João Silva"
                />
                {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">E-mail *</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="joao@barbearia.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                  {editando ? 'Nova Senha' : 'Senha *'}{' '}
                  {editando && <span className="text-[#555]">(deixe vazio para manter)</span>}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input
                    {...register('senha')}
                    type="password"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Nível de Acesso *</label>
                <select
                  {...register('role')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value={Role.RECEPCIONISTA}>Recepcionista</option>
                  <option value={Role.BARBEIRO}>Barbeiro</option>
                  <option value={Role.ADMIN}>Administrador</option>
                </select>
                <p className="mt-1 text-xs text-[#555]">
                  Admin: acesso total · Barbeiro: agenda própria · Recepcionista: agendamentos
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); setEditando(null); reset() }}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-[#f5f0e8] rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 text-[#1a1a1a] rounded-lg py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editando ? 'Salvar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
