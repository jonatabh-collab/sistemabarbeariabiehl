'use client'

import { useState, useEffect, useCallback } from 'react'
import { DollarSign, TrendingUp, Users, CreditCard, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface FinanceiroStats {
  totalReceita: number
  totalBarbeiros: number
  totalBarbearia: number
  totalPago: number
  totalPendente: number
}

interface PorBarbeiro {
  nome: string
  totalReceita: number
  comissao: number
  agendamentos: number
}

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [stats, setStats] = useState<FinanceiroStats | null>(null)
  const [financeiros, setFinanceiros] = useState<any[]>([])
  const [porBarbeiro, setPorBarbeiro] = useState<PorBarbeiro[]>([])

  const fetchDados = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/financeiro?periodo=${periodo}`)
      const data = await res.json()
      setStats(data.stats)
      setFinanceiros(data.financeiros || [])
      setPorBarbeiro(data.porBarbeiro || [])
    } catch {
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { fetchDados() }, [fetchDados])

  const marcarPago = async (financeiroId: string, agendamentoId: string) => {
    try {
      await fetch(`/api/agendamentos/${agendamentoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago: true }),
      })
      toast.success('Marcado como pago!')
      fetchDados()
    } catch {
      toast.error('Erro ao marcar como pago')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financeiro</h2>
          <p className="text-sm text-gray-500">Controle de receitas e comissões</p>
        </div>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="hoje">Hoje</option>
          <option value="mes">Este mês</option>
          <option value="mes_passado">Mês passado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Receita Total', value: formatCurrency(stats?.totalReceita ?? 0), icon: DollarSign, color: 'bg-green-500' },
              { label: 'Barbearia', value: formatCurrency(stats?.totalBarbearia ?? 0), icon: TrendingUp, color: 'bg-blue-500' },
              { label: 'Comissões', value: formatCurrency(stats?.totalBarbeiros ?? 0), icon: Users, color: 'bg-purple-500' },
              { label: 'A Receber', value: formatCurrency(stats?.totalPendente ?? 0), icon: Clock, color: 'bg-amber-500' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${card.color} w-9 h-9 rounded-xl flex items-center justify-center`}>
                    <card.icon size={16} className="text-white" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Por Barbeiro */}
          {porBarbeiro.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Comissões por Barbeiro</h3>
              <div className="space-y-3">
                {porBarbeiro.map((b) => (
                  <div key={b.nome} className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 font-bold text-sm">{b.nome.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">{b.nome}</p>
                        <p className="text-sm font-semibold text-purple-700">{formatCurrency(b.comissao)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{b.agendamentos} atendimento(s)</span>
                        <span>Receita: {formatCurrency(b.totalReceita)}</span>
                      </div>
                      <div className="mt-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${stats?.totalReceita ? (b.totalReceita / stats.totalReceita) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lançamentos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Lançamentos ({financeiros.length})</h3>
            </div>
            {financeiros.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <DollarSign size={40} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhum lançamento no período</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {financeiros.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.pago ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{f.agendamento.cliente.nome}</p>
                      <p className="text-xs text-gray-500">
                        {f.agendamento.barbeiro.user.name} •{' '}
                        {formatDateTime(f.agendamento.dataHora)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900">{formatCurrency(f.valorTotal)}</p>
                      <p className="text-xs text-gray-500">Comissão: {formatCurrency(f.valorBarbeiro)}</p>
                    </div>
                    {!f.pago && (
                      <button
                        onClick={() => marcarPago(f.id, f.agendamentoId)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <CheckCircle size={12} /> Pagar
                      </button>
                    )}
                    {f.pago && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">✓ Pago</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
