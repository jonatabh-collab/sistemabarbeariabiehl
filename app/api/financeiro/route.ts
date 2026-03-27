// API Financeiro — GET (relatório) — somente Admin
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'

// GET /api/financeiro — Buscar receitas, despesas e resumo
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const inicio = searchParams.get('inicio')
  const fim = searchParams.get('fim')
  const tipo = searchParams.get('tipo')

  const dataInicio = inicio ? new Date(inicio + 'T00:00:00') : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const dataFim = fim ? new Date(fim + 'T23:59:59') : new Date()

  // Relatório de comissões por barbeiro
  if (tipo === 'comissoes') {
    const mes = searchParams.get('mes')
    const [ano, mesNum] = (mes || new Date().toISOString().slice(0, 7)).split('-').map(Number)
    const inicioMes = new Date(ano, mesNum - 1, 1)
    const fimMes = new Date(ano, mesNum, 0, 23, 59, 59)

    const receitas = await prisma.receita.findMany({
      where: { data: { gte: inicioMes, lte: fimMes } },
      include: {
        agendamento: {
          include: {
            barbeiro: { include: { user: { select: { nome: true } } } },
          },
        },
      },
    })

    // Agrupar por barbeiro
    const comissoesPorBarbeiro = new Map<string, {
      barbeiroId: string
      nomeBarbeiro: string
      totalAtendimentos: number
      receitaTotal: number
      comissaoTotal: number
    }>()

    for (const receita of receitas) {
      const barbeiroId = receita.agendamento.barbeiro.id
      const nomeBarbeiro = receita.agendamento.barbeiro.user.nome

      if (!comissoesPorBarbeiro.has(barbeiroId)) {
        comissoesPorBarbeiro.set(barbeiroId, {
          barbeiroId,
          nomeBarbeiro,
          totalAtendimentos: 0,
          receitaTotal: 0,
          comissaoTotal: 0,
        })
      }

      const entry = comissoesPorBarbeiro.get(barbeiroId)!
      entry.totalAtendimentos += 1
      entry.receitaTotal += receita.valor
      entry.comissaoTotal += receita.comissaoBarbeiro
    }

    return NextResponse.json({ comissoes: Array.from(comissoesPorBarbeiro.values()) })
  }

  // Buscar receitas e despesas do período
  const [receitas, despesas] = await Promise.all([
    prisma.receita.findMany({
      where: { data: { gte: dataInicio, lte: dataFim } },
      include: {
        agendamento: {
          include: {
            cliente: { select: { nome: true } },
            servico: { select: { nome: true } },
            barbeiro: { include: { user: { select: { nome: true } } } },
          },
        },
      },
      orderBy: { data: 'desc' },
    }),
    prisma.despesa.findMany({
      where: { data: { gte: dataInicio, lte: dataFim } },
      orderBy: { data: 'desc' },
    }),
  ])

  // Calcular resumo
  const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0)
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)
  const totalComissoes = receitas.reduce((sum, r) => sum + r.comissaoBarbeiro, 0)
  const lucro = totalReceitas - totalDespesas

  return NextResponse.json({
    receitas,
    despesas,
    resumo: { totalReceitas, totalDespesas, lucro, totalComissoes },
  })
}
