'use client'
// Módulo de Clientes — cadastro e histórico
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Edit,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Star,
} from 'lucide-react'
import { formatarData, formatarDataHora } from '@/lib/utils'
import { StatusAgendamento } from '@prisma/client'

// Schema de validação do cliente
const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
  barbeiroFavorito: z.string().optional(),
  produtosUsados: z.string().optional(),
})

type ClienteFormData = z.infer<typeof clienteSchema>

interface Agendamento {
  id: string
  dataHora: string
  status: StatusAgendamento
  servico: { nome: string; preco: number }
  barbeiro: { user: { nome: string } }
}

interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string | null
  dataNascimento?: string | null
  observacoes?: string | null
  barbeiroFavorito?: string | null
  produtosUsados?: string | null
  createdAt: string
  agendamentos?: Agendamento[]
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [total, setTotal] = useState(0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  })

  const carregarClientes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca) params.append('busca', busca)

      const resp = await fetch(`/api/clientes?${params}`)
      const data = await resp.json()
      setClientes(data.clientes || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [busca])

  useEffect(() => {
    carregarClientes()
  }, [carregarClientes])

  // Carregar histórico do cliente ao expandir
  const toggleHistorico = async (clienteId: string) => {
    if (clienteExpandido === clienteId) {
      setClienteExpandido(null)
      return
    }

    setClienteExpandido(clienteId)
    // Buscar histórico ao expandir
    try {
      const resp = await fetch(`/api/clientes/${clienteId}`)
      const data = await resp.json()
      setClientes(prev => prev.map(c =>
        c.id === clienteId ? { ...c, agendamentos: data.agendamentos } : c
      ))
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const onSubmit = async (data: ClienteFormData) => {
    setSalvando(true)
    try {
      const url = editando ? `/api/clientes/${editando.id}` : '/api/clientes'
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
        carregarClientes()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar cliente')
      }
    } catch {
      alert('Erro ao salvar cliente')
    } finally {
      setSalvando(false)
    }
  }

  const abrirNovo = () => {
    setEditando(null)
    reset()
    setModalAberto(true)
  }

  const abrirEditar = (cliente: Cliente) => {
    setEditando(cliente)
    reset({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || '',
      dataNascimento: cliente.dataNascimento
        ? new Date(cliente.dataNascimento).toISOString().split('T')[0]
        : '',
      observacoes: cliente.observacoes || '',
      barbeiroFavorito: cliente.barbeiroFavorito || '',
      produtosUsados: cliente.produtosUsados || '',
    })
    setModalAberto(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Clientes</h2>
          <p className="text-sm text-[#888]">{total} clientes cadastrados</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-[#222] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c]"
        />
      </div>

      {/* Lista de clientes */}
      <div className="bg-[#222] border border-[#333] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-[#444] mb-3" />
            <p className="text-[#777]">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {clientes.map((cliente) => (
              <div key={cliente.id}>
                {/* Linha principal do cliente */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#2a2a2a] transition-colors">
                  {/* Avatar inicial */}
                  <div className="w-10 h-10 bg-[#c9a84c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[#c9a84c] font-bold text-sm">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Dados */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f5f0e8]">{cliente.nome}</p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-[#777]">
                        <Phone className="w-3 h-3" />
                        {cliente.telefone}
                      </span>
                      {cliente.email && (
                        <span className="flex items-center gap-1 text-xs text-[#777]">
                          <Mail className="w-3 h-3" />
                          {cliente.email}
                        </span>
                      )}
                      {cliente.dataNascimento && (
                        <span className="flex items-center gap-1 text-xs text-[#777]">
                          <Calendar className="w-3 h-3" />
                          {formatarData(cliente.dataNascimento)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirEditar(cliente)}
                      className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#f5f0e8] transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleHistorico(cliente.id)}
                      className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#c9a84c] transition-colors"
                      title="Ver histórico"
                    >
                      {clienteExpandido === cliente.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Histórico expandido */}
                {clienteExpandido === cliente.id && (
                  <div className="bg-[#1e1e1e] border-t border-[#2a2a2a] p-4">
                    <p className="text-xs font-semibold text-[#777] uppercase tracking-wider mb-3">
                      Histórico de Visitas
                    </p>
                    {!cliente.agendamentos ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 text-[#c9a84c] animate-spin" />
                      </div>
                    ) : cliente.agendamentos.length === 0 ? (
                      <p className="text-sm text-[#555] text-center py-4">
                        Nenhum atendimento registrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cliente.agendamentos.slice(0, 5).map((ag) => (
                          <div key={ag.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-[#f5f0e8]">{ag.servico.nome}</span>
                              <span className="text-[#666] ml-2">· {ag.barbeiro.user.nome}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#c9a84c] text-xs">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ag.servico.preco)}
                              </span>
                              <p className="text-xs text-[#555]">{formatarDataHora(ag.dataHora)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {cliente.observacoes && (
                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                        <p className="text-xs text-[#777] flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {cliente.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de cliente */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">
                {editando ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Nome completo *</label>
                  <input
                    {...register('nome')}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="Ex: Carlos Oliveira"
                  />
                  {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome.message}</p>}
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Telefone *</label>
                  <input
                    {...register('telefone')}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="(51) 99999-9999"
                  />
                  {errors.telefone && <p className="mt-1 text-xs text-red-400">{errors.telefone.message}</p>}
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    E-mail <span className="text-[#555]">(opcional)</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                {/* Data de Nascimento */}
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Data de Nascimento <span className="text-[#555]">(opcional)</span>
                  </label>
                  <input
                    {...register('dataNascimento')}
                    type="date"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                {/* Barbeiro Favorito */}
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Barbeiro Favorito <span className="text-[#555]">(opcional)</span>
                  </label>
                  <input
                    {...register('barbeiroFavorito')}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="Nome do barbeiro preferido"
                  />
                </div>

                {/* Produtos Usados */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Produtos Usados <span className="text-[#555]">(opcional)</span>
                  </label>
                  <input
                    {...register('produtosUsados')}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="Pomada, óleo de barba, shampoo..."
                  />
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Observações <span className="text-[#555]">(opcional)</span>
                  </label>
                  <textarea
                    {...register('observacoes')}
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none"
                    placeholder="Preferências, alergias, observações..."
                  />
                </div>
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
                  {editando ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
