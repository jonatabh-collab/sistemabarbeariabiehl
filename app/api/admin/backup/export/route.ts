// API de Export de Backup — gera arquivo JSON com todos os dados
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Buscar todos os dados do sistema
    const [
      clientes,
      barbeiros,
      servicos,
      agendamentos,
      receitas,
      despesas,
      configuracoes,
      feriados,
    ] = await Promise.all([
      prisma.cliente.findMany(),
      prisma.barbeiro.findMany({ include: { user: { select: { nome: true, email: true, role: true } } } }),
      prisma.servico.findMany(),
      prisma.agendamento.findMany(),
      prisma.receita.findMany(),
      prisma.despesa.findMany(),
      prisma.configuracao.findMany(),
      prisma.feriado.findMany(),
    ])

    const backup = {
      versao: '1.0',
      timestamp: new Date().toISOString(),
      dados: {
        clientes,
        barbeiros,
        servicos,
        agendamentos,
        receitas,
        despesas,
        configuracoes,
        feriados,
      },
    }

    // Retornar como arquivo JSON para download
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-barbearia-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 })
  }
}
