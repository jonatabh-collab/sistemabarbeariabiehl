// Dashboard principal — visão geral do sistema
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatarMoeda, STATUS_AGENDAMENTO, formatarHora } from '@/lib/utils'
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { StatusAgendamento } from '@prisma/client'

// Buscar dados do dashboard no servidor
async function getDashboardData(userId: string, role: string) {
  const hoje = new Date()
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  // Query base para agendamentos (barbeiro vê apenas os seus)
  const whereBase =
    role === 'BARBEIRO'
      ? { barbeiro: { userId } }
      : {}

  const [
    agendamentosHoje,
    agendamentosMes,
    totalClientes,
    receitaMes,
    proximosAgendamentos,
  ] = await Promise.all([
    // Agendamentos de hoje
    prisma.agendamento.count({
      where: {
        ...whereBase,
        dataHora: { gte: inicioDia, lt: fimDia },
        status: { not: StatusAgendamento.CANCELADO },
      },
    }),
    // Agendamentos do mês
    prisma.agendamento.count({
      where: {
        ...whereBase,
        dataHora: { gte: inicioMes },
        status: StatusAgendamento.CONCLUIDO,
      },
    }),
    // Total de clientes
    prisma.cliente.count(),
    // Receita do mês (somente admin)
    role === 'ADMIN'
      ? prisma.receita.aggregate({
          where: { data: { gte: inicioMes } },
          _sum: { valor: true },
        })
      : null,
    // Próximos agendamentos do dia
    prisma.agendamento.findMany({
      where: {
        ...whereBase,
        dataHora: { gte: new Date(), lt: fimDia },
        status: { in: [StatusAgendamento.AGENDADO, StatusAgendamento.EM_ANDAMENTO] },
      },
      include: {
        cliente: { select: { nome: true } },
        barbeiro: { include: { user: { select: { nome: true } } } },
        servico: { select: { nome: true, duracaoMinutos: true } },
      },
      orderBy: { dataHora: 'asc' },
      take: 5,
    }),
  ])

  return {
    agendamentosHoje,
    agendamentosMes,
    totalClientes,
    receitaMes: receitaMes?._sum?.valor ?? 0,
    proximosAgendamentos,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const data = await getDashboardData(session!.user.id, session!.user.role)

  const stats = [
    {
      label: 'Agendamentos Hoje',
      value: data.agendamentosHoje,
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Concluídos no Mês',
      value: data.agendamentosMes,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Total de Clientes',
      value: data.totalClientes,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    ...(session?.user.role === 'ADMIN'
      ? [
          {
            label: 'Receita do Mês',
            value: formatarMoeda(data.receitaMes),
            icon: DollarSign,
            color: 'text-[#c9a84c]',
            bg: 'bg-[#c9a84c]/10',
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">
          Visão Geral
        </h2>
        <p className="text-sm text-[#888] mt-1">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-[#222] border border-[#333] rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#777] font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-[#f5f0e8] mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Próximos agendamentos */}
      <div className="bg-[#222] border border-[#333] rounded-xl">
        <div className="p-5 border-b border-[#333]">
          <h3 className="font-serif font-semibold text-[#f5f0e8] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c9a84c]" />
            Próximos Agendamentos
          </h3>
        </div>

        <div className="divide-y divide-[#2a2a2a]">
          {data.proximosAgendamentos.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-[#555] mx-auto mb-2" />
              <p className="text-sm text-[#666]">Nenhum agendamento para hoje</p>
            </div>
          ) : (
            data.proximosAgendamentos.map((ag) => {
              const statusInfo = STATUS_AGENDAMENTO[ag.status]
              return (
                <div
                  key={ag.id}
                  className="p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Horário */}
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold text-[#c9a84c]">
                        {formatarHora(ag.dataHora)}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-[#333]" />

                    {/* Detalhes */}
                    <div>
                      <p className="text-sm font-medium text-[#f5f0e8]">
                        {ag.cliente.nome}
                      </p>
                      <p className="text-xs text-[#777]">
                        {ag.servico.nome} · {ag.barbeiro.user.nome}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
