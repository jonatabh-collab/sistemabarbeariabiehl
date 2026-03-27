'use client'

import { useEffect, useState } from 'react'
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Scissors,
} from 'lucide-react'
import { formatCurrency, formatDateTime, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'

interface DashboardData {
  agendamentosHoje: number
  agendamentosMes: number
  totalClientes: number
  agendamentosPendentes: number
  receitaHoje: number
  receitaMes: number
  proximosAgendamentos: any[]
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Visão geral da barbearia hoje</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Agendamentos Hoje"
          value={data?.agendamentosHoje ?? 0}
          sub={`${data?.agendamentosMes ?? 0} no mês`}
          color="bg-blue-500"
        />
        <StatCard
          icon={DollarSign}
          label="Receita Hoje"
          value={formatCurrency(data?.receitaHoje ?? 0)}
          sub={`${formatCurrency(data?.receitaMes ?? 0)} no mês`}
          color="bg-green-500"
        />
        <StatCard
          icon={Users}
          label="Total de Clientes"
          value={data?.totalClientes ?? 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Pendentes"
          value={data?.agendamentosPendentes ?? 0}
          sub="aguardando confirmação"
          color="bg-amber-500"
        />
      </div>

      {/* Próximos Agendamentos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-amber-500" />
          <h3 className="font-semibold text-gray-900">Próximos Agendamentos do Dia</h3>
        </div>

        {data?.proximosAgendamentos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-2 text-green-400" />
            <p>Nenhum agendamento pendente para hoje</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.proximosAgendamentos.map((ag: any) => (
              <div
                key={ag.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Scissors size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{ag.cliente.nome}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {ag.servicos.map((s: any) => s.servico.nome).join(', ')} •{' '}
                    {ag.barbeiro.user.name}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ag.status]}`}>
                    {STATUS_LABELS[ag.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
