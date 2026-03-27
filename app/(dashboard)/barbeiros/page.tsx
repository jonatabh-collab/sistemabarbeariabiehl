'use client'
// Módulo de Barbeiros — cadastro, horários e relatório de comissões
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  UserCircle,
  Edit,
  Loader2,
  Clock,
  Percent,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from 'lucide-react'
import { DIAS_SEMANA, formatarMoeda } from '@/lib/utils'

const barbeiroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional().or(z.literal('')),
  especialidades: z.string().optional(),
  comissaoPercent: z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100, 'Percentual inválido'),
})

type BarbeiroFormData = z.infer<typeof barbeiroSchema>

// Horário padrão de trabalho
type HorarioDia = { inicio: string; fim: string } | null

interface HorariosSemana {
  [key: string]: HorarioDia
}

interface Barbeiro {
  id: string
  userId: string
  foto?: string | null
  especialidades: string[]
  comissaoPercent: number
  horarios: HorariosSemana
  ativo: boolean
  user: { nome: string; email: string }
}

interface Comissao {
  barbeiroId: string
  nomeBarbeiro: string
  totalAtendimentos: number
  receitaTotal: number
  comissaoTotal: number
}

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Barbeiro | null>(null)
  const [horarios, setHorarios] = useState<HorariosSemana>({})
  const [salvando, setSalvando] = useState(false)
  const [comissoes, setComissoes] = useState<Comissao[]>([])
  const [mesComissao, setMesComissao] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BarbeiroFormData>({
    resolver: zodResolver(barbeiroSchema),
  })

  const carregarBarbeiros = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await fetch('/api/barbeiros')
      const data = await resp.json()
      setBarbeiros(data.barbeiros || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const carregarComissoes = useCallback(async () => {
    try {
      const resp = await fetch(`/api/financeiro?tipo=comissoes&mes=${mesComissao}`)
      const data = await resp.json()
      setComissoes(data.comissoes || [])
    } catch (error) {
      console.error('Erro ao carregar comissões:', error)
    }
  }, [mesComissao])

  useEffect(() => {
    carregarBarbeiros()
    carregarComissoes()
  }, [carregarBarbeiros, carregarComissoes])

  const onSubmit = async (data: BarbeiroFormData) => {
    setSalvando(true)
    try {
      const url = editando ? `/api/barbeiros/${editando.id}` : '/api/barbeiros'
      const method = editando ? 'PUT' : 'POST'

      const especialidadesArr = data.especialidades
        ? data.especialidades.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.nome,
          email: data.email,
          ...(data.senha ? { senha: data.senha } : {}),
          especialidades: especialidadesArr,
          comissaoPercent: Number(data.comissaoPercent),
          horarios,
        }),
      })

      if (resp.ok) {
        setModalAberto(false)
        setEditando(null)
        reset()
        carregarBarbeiros()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar barbeiro')
      }
    } catch {
      alert('Erro ao salvar barbeiro')
    } finally {
      setSalvando(false)
    }
  }

  const abrirEditar = (barbeiro: Barbeiro) => {
    setEditando(barbeiro)
    setHorarios(barbeiro.horarios as HorariosSemana || {})
    reset({
      nome: barbeiro.user.nome,
      email: barbeiro.user.email,
      senha: '',
      especialidades: barbeiro.especialidades.join(', '),
      comissaoPercent: barbeiro.comissaoPercent.toString(),
    })
    setModalAberto(true)
  }

  const abrirNovo = () => {
    setEditando(null)
    // Horário padrão: segunda a sexta 9h-18h, sábado 9h-16h, domingo folga
    setHorarios({
      '0': null,
      '1': { inicio: '09:00', fim: '18:00' },
      '2': { inicio: '09:00', fim: '18:00' },
      '3': { inicio: '09:00', fim: '18:00' },
      '4': { inicio: '09:00', fim: '18:00' },
      '5': { inicio: '09:00', fim: '18:00' },
      '6': { inicio: '09:00', fim: '16:00' },
    })
    reset()
    setModalAberto(true)
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/barbeiros/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      carregarBarbeiros()
    } catch {
      alert('Erro ao atualizar barbeiro')
    }
  }

  const toggleDiaTrabalhado = (dia: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: prev[dia] ? null : { inicio: '09:00', fim: '18:00' },
    }))
  }

  const atualizarHorarioDia = (dia: string, campo: 'inicio' | 'fim', valor: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: { ...(prev[dia] || { inicio: '09:00', fim: '18:00' }), [campo]: valor },
    }))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Barbeiros</h2>
          <p className="text-sm text-[#888]">{barbeiros.filter(b => b.ativo).length} barbeiros ativos</p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Barbeiro
        </button>
      </div>

      {/* Cards dos barbeiros */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {barbeiros.map((barbeiro) => (
            <div
              key={barbeiro.id}
              className={`bg-[#222] border rounded-xl p-5 ${
                barbeiro.ativo ? 'border-[#333]' : 'border-[#2a2a2a] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#c9a84c]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#c9a84c] font-bold text-lg">
                      {barbeiro.user.nome.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f5f0e8]">{barbeiro.user.nome}</h3>
                    <p className="text-xs text-[#666]">{barbeiro.user.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirEditar(barbeiro)}
                    className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#f5f0e8] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAtivo(barbeiro.id, barbeiro.ativo)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      barbeiro.ativo
                        ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-[#555] hover:text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {barbeiro.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Especialidades */}
              {barbeiro.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {barbeiro.especialidades.map((esp) => (
                    <span key={esp} className="text-xs bg-[#2a2a2a] border border-[#333] text-[#aaa] px-2 py-0.5 rounded-full">
                      {esp}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-1.5 text-[#c9a84c]">
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{barbeiro.comissaoPercent}% comissão</span>
                </div>
                {!barbeiro.ativo && (
                  <span className="ml-auto text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                    Inativo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relatório de Comissões */}
      <div className="bg-[#222] border border-[#333] rounded-xl">
        <div className="p-5 border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif font-semibold text-[#f5f0e8] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#c9a84c]" />
            Relatório de Comissões
          </h3>
          <input
            type="month"
            value={mesComissao}
            onChange={(e) => setMesComissao(e.target.value)}
            className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
          />
        </div>

        {comissoes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#666]">Nenhum atendimento no período selecionado</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {comissoes.map((c) => (
              <div key={c.barbeiroId} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#f5f0e8]">{c.nomeBarbeiro}</p>
                  <p className="text-xs text-[#666]">{c.totalAtendimentos} atendimentos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#c9a84c]">{formatarMoeda(c.comissaoTotal)}</p>
                  <p className="text-xs text-[#666]">de {formatarMoeda(c.receitaTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de barbeiro */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">
                {editando ? 'Editar Barbeiro' : 'Novo Barbeiro'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                    {editando ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                  </label>
                  <input
                    {...register('senha')}
                    type="password"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="••••••••"
                  />
                  {errors.senha && <p className="mt-1 text-xs text-red-400">{errors.senha.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Comissão (%)</label>
                  <input
                    {...register('comissaoPercent')}
                    type="number"
                    min="0"
                    max="100"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="40"
                  />
                  {errors.comissaoPercent && <p className="mt-1 text-xs text-red-400">{errors.comissaoPercent.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Especialidades <span className="text-[#555]">(separadas por vírgula)</span>
                  </label>
                  <input
                    {...register('especialidades')}
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="Corte, Barba, Degradê"
                  />
                </div>
              </div>

              {/* Horários de trabalho */}
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c9a84c]" />
                  Horários de Trabalho
                </label>
                <div className="space-y-2">
                  {Array.from({ length: 7 }, (_, i) => i).map((dia) => {
                    const horarioDia = horarios[dia.toString()]
                    const trabalha = !!horarioDia

                    return (
                      <div key={dia} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDiaTrabalhado(dia.toString())}
                          className={`w-20 text-xs py-1 rounded-lg border transition-colors ${
                            trabalha
                              ? 'bg-[#c9a84c]/20 border-[#c9a84c]/40 text-[#c9a84c]'
                              : 'bg-[#1a1a1a] border-[#333] text-[#555]'
                          }`}
                        >
                          {DIAS_SEMANA[dia]}
                        </button>

                        {trabalha && horarioDia ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={horarioDia.inicio}
                              onChange={(e) => atualizarHorarioDia(dia.toString(), 'inicio', e.target.value)}
                              className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#c9a84c]"
                            />
                            <span className="text-[#555] text-xs">até</span>
                            <input
                              type="time"
                              value={horarioDia.fim}
                              onChange={(e) => atualizarHorarioDia(dia.toString(), 'fim', e.target.value)}
                              className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#c9a84c]"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-[#444]">Folga</span>
                        )}
                      </div>
                    )
                  })}
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
                  {editando ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
