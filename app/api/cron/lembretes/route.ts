// Cron Job — Enviar lembretes de agendamento 24h antes
// Executado diariamente às 9h (configurado em vercel.json)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarLembreteAgendamento } from '@/lib/resend'
import { StatusAgendamento } from '@prisma/client'

export async function GET(request: NextRequest) {
  // Verificar autenticação do cron (segurança)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)

    // Buscar agendamentos de amanhã com clientes que têm e-mail
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: StatusAgendamento.AGENDADO,
        dataHora: {
          gte: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), 0, 0, 0),
          lt: new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate() + 1, 0, 0, 0),
        },
        cliente: {
          email: { not: null },
        },
      },
      include: {
        cliente: true,
        barbeiro: { include: { user: { select: { nome: true } } } },
        servico: { select: { nome: true } },
      },
    })

    let enviados = 0
    let erros = 0

    // Enviar lembretes
    for (const ag of agendamentos) {
      if (!ag.cliente.email) continue

      const resultado = await enviarLembreteAgendamento({
        nomeCliente: ag.cliente.nome,
        nomeBarbeiro: ag.barbeiro.user.nome,
        nomeServico: ag.servico.nome,
        dataHora: ag.dataHora,
        emailCliente: ag.cliente.email,
      })

      if (resultado.success) {
        enviados++
      } else {
        erros++
      }
    }

    console.log(`Lembretes: ${enviados} enviados, ${erros} erros`)

    return NextResponse.json({
      success: true,
      total: agendamentos.length,
      enviados,
      erros,
    })
  } catch (error) {
    console.error('Erro no cron de lembretes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
