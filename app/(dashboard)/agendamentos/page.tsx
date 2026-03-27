'use client'
// Módulo de Agendamentos — calendário e lista de agendamentos
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatarData, formatarHora, STATUS_AGENDAMENTO } from '@/lib/utils'
import { StatusAgendamento } from '@prisma/client'

// Schema de validação do agendamento
const agendamentoSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  barbeiroId: z.string().min(1, 'Selecione um barbeiro'),
  servicoId: z.string().min(1, 'Selecione um serviço'),
  dataHora: z.string().min(1, 'Selecione data e horário'),
  observacoes: z.string().optional(),
})

type AgendamentoFormData = z.infer<typeof agendamentoSchema>

// Tipos
interface Agendamento {
  id: string
  dataHora: string
  status: StatusAgendamento
  observacoes?: string
  cliente: { id: string; nome: string; telefone: string }
  barbeiro: { id: string; user: { nome: string } }
  servico: { id: string; nome: string; preco: number; duracaoMinutos: number }
}

interface SelectOption {
  id: string
  nome: string
}

interface BarbeiroOption {
  id: string
  user: { nome: string }
}

export default function AgendamentosPage() {
  const { data: session } = useSession()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clientes, setClientes] = useState<SelectOption[]>([])
  const [barbeiros, setBarbeiros] = useState<BarbeiroOption[]>([])
  const [servicos, setServicos] = useState<SelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Agendamento | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroData, setFiltroData] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
  })

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroData) params.append('data', filtroData)
      if (filtroStatus) params.append('status', filtroStatus)
      if (busca) params.append('busca', busca)

      const [agResp, cliResp, barResp, serResp] = await Promise.all([
        fetch(`/api/agendamentos?${params}`),
        fetch('/api/clientes?limit=100'),
        fetch('/api/barbeiros?ativo=true'),
        fetch('/api/servicos?ativo=true'),
      ])

      const [agData, cliData, barData, serData] = await Promise.all([
        agResp.json(),
        cliResp.json(),
        barResp.json(),
        serResp.json(),
      ])

      setAgendamentos(agData.agendamentos || [])
      setClientes(cliData.clientes || [])
      setBarbeiros(barData.barbeiros || [])
      setServicos(serData.servicos || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filtroData, filtroStatus, busca])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Salvar agendamento
  const onSubmit = async (data: AgendamentoFormData) => {
    setSalvando(true)
    try {
      const url = editando
        ? `/api/agendamentos/${editando.id}`
        : '/api/agendamentos'
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
        carregarDados()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar agendamento')
      }
    } catch {
      alert('Erro ao salvar agendamento')
    } finally {
      setSalvando(false)
    }
  }

  // Atualizar status
  const atualizarStatus = async (id: string, status: StatusAgendamento) => {
    try {
      await fetch(`/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      carregarDados()
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  // Abrir modal para novo agendamento
  const abrirNovo = () => {
    setEditando(null)
    reset()
    setModalAberto(true)
  }

  // Abrir modal para editar
  const abrirEditar = (ag: Agendamento) => {
    setEditando(ag)
    const dataLocal = new Date(ag.dataHora)
    const offset = dataLocal.getTimezoneOffset()
    const dataCorrigida = new Date(dataLocal.getTime() - offset * 60000)
    reset({
      clienteId: ag.cliente.id,
      barbeiroId: ag.barbeiro.id,
      servicoId: ag.servico.id,
      dataHora: dataCorrigida.toISOString().slice(0, 16),
      observacoes: ag.observacoes || '',
    })
    setModalAberto(true)
  }

  // Navegar entre dias
  const navegarDia = (direcao: number) => {
    const data = new Date(filtroData + 'T12:00:00')
    data.setDate(data.getDate() + direcao)
    setFiltroData(data.toISOString().split('T')[0])
  }

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'RECEPCIONISTA'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Agendamentos</h2>
          <p className="text-sm text-[#888]">{agendamentos.length} agendamentos encontrados</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Navegação de data */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navegarDia(-1)}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
            />
            <button
              onClick={() => navegarDia(1)}
              className="p-2 bg-[#333] hover:bg-[#444] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFiltroData(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 bg-[#c9a84c]/20 border border-[#c9a84c]/30 text-[#c9a84c] rounded-lg text-sm hover:bg-[#c9a84c]/30 transition-colors"
            >
              Hoje
            </button>
          </div>

          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
            />
          </div>

          {/* Filtro status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_AGENDAMENTO).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de agendamentos */}
      <div className="bg-[#222] border border-[#333] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-10 h-10 text-[#444] mb-3" />
            <p className="text-[#777]">Nenhum agendamento encontrado</p>
            <p className="text-sm text-[#555] mt-1">Crie um novo agendamento para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {agendamentos.map((ag) => {
              const statusInfo = STATUS_AGENDAMENTO[ag.status]
              return (
                <div
                  key={ag.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#2a2a2a] transition-colors"
                >
                  {/* Horário */}
                  <div className="flex items-center gap-3 min-w-0 sm:min-w-[120px]">
                    <div className="w-8 h-8 bg-[#c9a84c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-[#c9a84c]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#f5f0e8]">{formatarHora(ag.dataHora)}</p>
                      <p className="text-xs text-[#666]">{formatarData(ag.dataHora)}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-10 bg-[#333]" />

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f5f0e8] truncate">{ag.cliente.nome}</p>
                    <p className="text-xs text-[#777] truncate">
                      {ag.servico.nome} · {ag.barbeiro.user.nome} ·{' '}
                      <span className="text-[#c9a84c]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ag.servico.preco)}
                      </span>
                    </p>
                  </div>

                  {/* Status e ações */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>

                    {/* Botões de ação rápida */}
                    {ag.status === 'AGENDADO' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(ag.id, StatusAgendamento.CONCLUIDO)}
                          className="p-1.5 hover:bg-green-500/10 rounded-lg text-[#555] hover:text-green-400 transition-colors"
                          title="Marcar como concluído"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => atualizarStatus(ag.id, StatusAgendamento.FALTOU)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-[#555] hover:text-red-400 transition-colors"
                          title="Marcar como faltou"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => abrirEditar(ag)}
                      className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#f5f0e8] transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de agendamento */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">
                {editando ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Cliente</label>
                <select
                  {...register('clienteId')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {errors.clienteId && <p className="mt-1 text-xs text-red-400">{errors.clienteId.message}</p>}
              </div>

              {/* Barbeiro */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Barbeiro</label>
                <select
                  {...register('barbeiroId')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Selecione o barbeiro</option>
                  {barbeiros.map((b) => (
                    <option key={b.id} value={b.id}>{b.user.nome}</option>
                  ))}
                </select>
                {errors.barbeiroId && <p className="mt-1 text-xs text-red-400">{errors.barbeiroId.message}</p>}
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Serviço</label>
                <select
                  {...register('servicoId')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                >
                  <option value="">Selecione o serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
                {errors.servicoId && <p className="mt-1 text-xs text-red-400">{errors.servicoId.message}</p>}
              </div>

              {/* Data e Hora */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Data e Horário</label>
                <input
                  {...register('dataHora')}
                  type="datetime-local"
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                />
                {errors.dataHora && <p className="mt-1 text-xs text-red-400">{errors.dataHora.message}</p>}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                  Observações <span className="text-[#555]">(opcional)</span>
                </label>
                <textarea
                  {...register('observacoes')}
                  rows={3}
                  placeholder="Preferências, observações especiais..."
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none"
                />
              </div>

              {/* Botões */}
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
                  {editando ? 'Salvar Alterações' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
