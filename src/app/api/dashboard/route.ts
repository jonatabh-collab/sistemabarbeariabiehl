import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const agora = new Date()
  const inicioDia = startOfDay(agora)
  const fimDia = endOfDay(agora)
  const inicioMes = startOfMonth(agora)
  const fimMes = endOfMonth(agora)

  const barbeiroFilter =
    session.user.role === 'BARBEIRO' && session.user.barbeiroId
      ? { barbeiroId: session.user.barbeiroId }
      : {}

  const [
    agendamentosHoje,
    agendamentosMes,
    totalClientes,
    agendamentosPendentes,
    financeiroHoje,
    financeiroMes,
  ] = await Promise.all([
    prisma.agendamento.count({
      where: { ...barbeiroFilter, dataHora: { gte: inicioDia, lte: fimDia } },
    }),
    prisma.agendamento.count({
      where: { ...barbeiroFilter, dataHora: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.cliente.count({ where: { ativo: true } }),
    prisma.agendamento.count({
      where: { ...barbeiroFilter, status: 'PENDENTE' },
    }),
    prisma.financeiro.aggregate({
      where: {
        agendamento: { ...barbeiroFilter, dataHora: { gte: inicioDia, lte: fimDia }, status: 'CONCLUIDO' },
      },
      _sum: { valorTotal: true, valorBarbearia: true },
    }),
    prisma.financeiro.aggregate({
      where: {
        agendamento: { ...barbeiroFilter, dataHora: { gte: inicioMes, lte: fimMes }, status: 'CONCLUIDO' },
      },
      _sum: { valorTotal: true, valorBarbearia: true },
    }),
  ])

  // Próximos agendamentos do dia
  const proximosAgendamentos = await prisma.agendamento.findMany({
    where: {
      ...barbeiroFilter,
      dataHora: { gte: agora, lte: fimDia },
      status: { in: ['PENDENTE', 'CONFIRMADO'] },
    },
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
    },
    orderBy: { dataHora: 'asc' },
    take: 5,
  })

  return NextResponse.json({
    agendamentosHoje,
    agendamentosMes,
    totalClientes,
    agendamentosPendentes,
    receitaHoje: financeiroHoje._sum.valorTotal ?? 0,
    receitaBarbeariaHoje: financeiroHoje._sum.valorBarbearia ?? 0,
    receitaMes: financeiroMes._sum.valorTotal ?? 0,
    receitaBarbeariaMes: financeiroMes._sum.valorBarbearia ?? 0,
    proximosAgendamentos,
  })
}
