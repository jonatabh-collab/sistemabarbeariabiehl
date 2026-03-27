import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'mes' // hoje, mes, mes_passado, personalizado
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const barbeiroId = searchParams.get('barbeiroId')

  let inicio: Date
  let fim: Date
  const agora = new Date()

  switch (periodo) {
    case 'hoje':
      inicio = startOfDay(agora)
      fim = endOfDay(agora)
      break
    case 'mes_passado':
      inicio = startOfMonth(subMonths(agora, 1))
      fim = endOfMonth(subMonths(agora, 1))
      break
    case 'personalizado':
      inicio = dataInicio ? new Date(dataInicio) : startOfMonth(agora)
      fim = dataFim ? new Date(dataFim) : endOfMonth(agora)
      break
    default: // mes
      inicio = startOfMonth(agora)
      fim = endOfMonth(agora)
  }

  const where: any = {
    agendamento: {
      dataHora: { gte: inicio, lte: fim },
      status: { in: ['CONCLUIDO', 'EM_ANDAMENTO'] },
      ...(barbeiroId ? { barbeiroId } : {}),
      ...(session.user.role === 'BARBEIRO' && session.user.barbeiroId
        ? { barbeiroId: session.user.barbeiroId }
        : {}),
    },
  }

  const financeiros = await prisma.financeiro.findMany({
    where,
    include: {
      agendamento: {
        include: {
          cliente: true,
          barbeiro: { include: { user: true } },
          servicos: { include: { servico: true } },
        },
      },
    },
    orderBy: { agendamento: { dataHora: 'desc' } },
  })

  // Estatísticas
  const totalReceita = financeiros.reduce((s, f) => s + f.valorTotal, 0)
  const totalBarbeiros = financeiros.reduce((s, f) => s + f.valorBarbeiro, 0)
  const totalBarbearia = financeiros.reduce((s, f) => s + f.valorBarbearia, 0)
  const totalPago = financeiros.filter((f) => f.pago).reduce((s, f) => s + f.valorTotal, 0)
  const totalPendente = financeiros.filter((f) => !f.pago).reduce((s, f) => s + f.valorTotal, 0)

  // Agrupamento por barbeiro
  const porBarbeiro = financeiros.reduce(
    (acc, f) => {
      const nome = f.agendamento.barbeiro.user.name
      if (!acc[nome]) acc[nome] = { nome, totalReceita: 0, comissao: 0, agendamentos: 0 }
      acc[nome].totalReceita += f.valorTotal
      acc[nome].comissao += f.valorBarbeiro
      acc[nome].agendamentos += 1
      return acc
    },
    {} as Record<string, { nome: string; totalReceita: number; comissao: number; agendamentos: number }>,
  )

  return NextResponse.json({
    financeiros,
    stats: { totalReceita, totalBarbeiros, totalBarbearia, totalPago, totalPendente },
    porBarbeiro: Object.values(porBarbeiro),
    periodo: { inicio, fim },
  })
}
