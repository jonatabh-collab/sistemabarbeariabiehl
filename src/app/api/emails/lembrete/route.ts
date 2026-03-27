import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarLembrete24h } from '@/lib/email'
import { addHours, startOfHour, endOfHour } from 'date-fns'

// Endpoint para enviar lembretes manualmente (também chamado pelo cron)
export async function POST(req: NextRequest) {
  // Permite tanto chamadas autenticadas quanto via cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  // Busca agendamentos para as próximas 24-25 horas com e-mail
  const inicio = addHours(new Date(), 23)
  const fim = addHours(new Date(), 25)

  const agendamentos = await prisma.agendamento.findMany({
    where: {
      dataHora: { gte: inicio, lte: fim },
      status: { in: ['PENDENTE', 'CONFIRMADO'] },
      lembreteEnviado: false,
      cliente: { email: { not: null } },
    },
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
    },
  })

  let enviados = 0
  let erros = 0

  for (const agendamento of agendamentos) {
    if (!agendamento.cliente.email) continue

    try {
      await enviarLembrete24h({
        clienteEmail: agendamento.cliente.email,
        clienteNome: agendamento.cliente.nome,
        barbeiro: agendamento.barbeiro.user.name,
        servicos: agendamento.servicos.map((s) => s.servico.nome),
        dataHora: agendamento.dataHora,
      })

      await prisma.agendamento.update({
        where: { id: agendamento.id },
        data: { lembreteEnviado: true },
      })

      enviados++
    } catch (error) {
      console.error(`Erro ao enviar lembrete para ${agendamento.cliente.email}:`, error)
      erros++
    }
  }

  return NextResponse.json({ enviados, erros, total: agendamentos.length })
}
