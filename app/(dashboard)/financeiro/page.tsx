'use client'
// Módulo Financeiro — somente Admin
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Plus,
  Loader2,
} from 'lucide-react'
import { formatarMoeda, formatarData } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const despesaSchema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória'),
  valor: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Valor inválido'),
  categoria: z.string().optional(),
  data: z.string().min(1, 'Data obrigatória'),
})

type DespesaFormData = z.infer<typeof despesaSchema>

interface Receita {
  id: string
  valor: number
  data: string
  agendamento: {
    cliente: { nome: string }
    servico: { nome: string }
    barbeiro: { user: { nome: string } }
  }
}

interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria: string
  data: string
}

interface ResumoFinanceiro {
  totalReceitas: number
  totalDespesas: number
  lucro: number
  totalComissoes: number
}

export default function FinanceiroPage() {
  const { data: session } = useSession()
  const [periodoInicio, setPeriodoInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [periodoFim, setPeriodoFim] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalReceitas: 0,
    totalDespesas: 0,
    lucro: 0,
    totalComissoes: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [aba, setAba] = useState<'receitas' | 'despesas'>('receitas')
  const [modalDespesa, setModalDespesa] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: { data: new Date().toISOString().split('T')[0] },
  })

  // Redirecionar se não for admin
  if (session && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ inicio: periodoInicio, fim: periodoFim })
      const resp = await fetch(`/api/financeiro?${params}`)
      const data = await resp.json()

      setReceitas(data.receitas || [])
      setDespesas(data.despesas || [])
      setResumo(data.resumo || { totalReceitas: 0, totalDespesas: 0, lucro: 0, totalComissoes: 0 })
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error)
    } finally {
      setIsLoading(false)
    }
  }, [periodoInicio, periodoFim])

  useEffect(() => { carregarDados() }, [carregarDados])

  const salvarDespesa = async (data: DespesaFormData) => {
    setSalvando(true)
    try {
      const resp = await fetch('/api/financeiro/despesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, valor: Number(data.valor) }),
      })

      if (resp.ok) {
        setModalDespesa(false)
        reset({ data: new Date().toISOString().split('T')[0] })
        carregarDados()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar despesa')
      }
    } catch {
      alert('Erro ao salvar despesa')
    } finally {
      setSalvando(false)
    }
  }

  // Exportar CSV
  const exportarCSV = () => {
    const linhas = [
      ['Tipo', 'Descrição', 'Valor', 'Data'],
      ...receitas.map(r => [
        'Receita',
        `${r.agendamento.servico.nome} - ${r.agendamento.cliente.nome}`,
        r.valor.toFixed(2),
        formatarData(r.data),
      ]),
      ...despesas.map(d => [
        'Despesa',
        `${d.descricao} (${d.categoria})`,
        (-d.valor).toFixed(2),
        formatarData(d.data),
      ]),
    ]

    const csv = linhas.map(l => l.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-${periodoInicio}-${periodoFim}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Financeiro</h2>
          <p className="text-sm text-[#888]">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-[#f5f0e8] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => setModalDespesa(true)}
            className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Filtro de período */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <Calendar className="w-4 h-4 text-[#c9a84c]" />
        <span className="text-sm text-[#777]">Período:</span>
        <input
          type="date"
          value={periodoInicio}
          onChange={(e) => setPeriodoInicio(e.target.value)}
          className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
        />
        <span className="text-[#555] text-sm">até</span>
        <input
          type="date"
          value={periodoFim}
          onChange={(e) => setPeriodoFim(e.target.value)}
          className="bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c9a84c]"
        />
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Receitas', value: resumo.totalReceitas, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Despesas', value: resumo.totalDespesas, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Lucro Líquido', value: resumo.lucro, icon: DollarSign, color: 'text-[#c9a84c]', bg: 'bg-[#c9a84c]/10' },
          { label: 'Comissões Pagas', value: resumo.totalComissoes, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="bg-[#222] border border-[#333] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#777] uppercase tracking-wider">{item.label}</p>
                  <p className="text-xl font-bold text-[#f5f0e8] mt-1">{formatarMoeda(item.value)}</p>
                </div>
                <div className={`${item.bg} p-3 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Abas */}
      <div className="bg-[#222] border border-[#333] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#333]">
          {(['receitas', 'despesas'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                aba === tab
                  ? 'text-[#c9a84c] border-b-2 border-[#c9a84c] bg-[#c9a84c]/5'
                  : 'text-[#777] hover:text-[#f5f0e8]'
              }`}
            >
              {tab === 'receitas' ? `Receitas (${receitas.length})` : `Despesas (${despesas.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
          </div>
        ) : aba === 'receitas' ? (
          <div className="divide-y divide-[#2a2a2a]">
            {receitas.length === 0 ? (
              <p className="text-center text-sm text-[#555] py-12">Nenhuma receita no período</p>
            ) : (
              receitas.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">
                      {r.agendamento.servico.nome}
                    </p>
                    <p className="text-xs text-[#666]">
                      {r.agendamento.cliente.nome} · {r.agendamento.barbeiro.user.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{formatarMoeda(r.valor)}</p>
                    <p className="text-xs text-[#555]">{formatarData(r.data)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {despesas.length === 0 ? (
              <p className="text-center text-sm text-[#555] py-12">Nenhuma despesa no período</p>
            ) : (
              despesas.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">{d.descricao}</p>
                    <p className="text-xs text-[#666]">{d.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-400">-{formatarMoeda(d.valor)}</p>
                    <p className="text-xs text-[#555]">{formatarData(d.data)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal nova despesa */}
      {modalDespesa && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">Nova Despesa</h3>
            </div>

            <form onSubmit={handleSubmit(salvarDespesa)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Descrição *</label>
                <input
                  {...register('descricao')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="Ex: Aluguel, produtos..."
                />
                {errors.descricao && <p className="mt-1 text-xs text-red-400">{errors.descricao.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Valor (R$) *</label>
                  <input
                    {...register('valor')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="0.00"
                  />
                  {errors.valor && <p className="mt-1 text-xs text-red-400">{errors.valor.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Data *</label>
                  <input
                    {...register('data')}
                    type="date"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  />
                  {errors.data && <p className="mt-1 text-xs text-red-400">{errors.data.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                  Categoria <span className="text-[#555]">(opcional)</span>
                </label>
                <input
                  {...register('categoria')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="Ex: Aluguel, Produtos, Manutenção..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalDespesa(false); reset({ data: new Date().toISOString().split('T')[0] }) }}
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
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
