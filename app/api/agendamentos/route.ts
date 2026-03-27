// API de Agendamentos — GET (listar) e POST (criar)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'
import { z } from 'zod'
import { StatusAgendamento } from '@prisma/client'
import { enviarConfirmacaoAgendamento } from '@/lib/resend'

const criarAgendamentoSchema = z.object({
  clienteId: z.string().min(1),
  barbeiroId: z.string().min(1),
  servicoId: z.string().min(1),
  dataHora: z.string().min(1),
  observacoes: z.string().optional(),
})

// GET /api/agendamentos — Listar agendamentos com filtros
export async function GET(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const data = searchParams.get('data')
  const status = searchParams.get('status')
  const busca = searchParams.get('busca')

  // Construir filtros
  const where: Record<string, unknown> = {}

  // Barbeiro só vê os próprios agendamentos
  if (session!.user.role === 'BARBEIRO') {
    const barbeiro = await prisma.barbeiro.findUnique({
      where: { userId: session!.user.id },
    })
    if (barbeiro) {
      where.barbeiroId = barbeiro.id
    }
  }

  // Filtro por data
  if (data) {
    const inicio = new Date(data + 'T00:00:00')
    const fim = new Date(data + 'T23:59:59')
    where.dataHora = { gte: inicio, lte: fim }
  }

  // Filtro por status
  if (status && Object.values(StatusAgendamento).includes(status as StatusAgendamento)) {
    where.status = status as StatusAgendamento
  }

  // Filtro por busca (nome do cliente)
  if (busca) {
    where.cliente = { nome: { contains: busca, mode: 'insensitive' } }
  }

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, email: true } },
      barbeiro: { include: { user: { select: { nome: true } } } },
      servico: { select: { id: true, nome: true, preco: true, duracaoMinutos: true } },
    },
    orderBy: { dataHora: 'asc' },
  })

  return NextResponse.json({ agendamentos })
}

// POST /api/agendamentos — Criar novo agendamento
export async function POST(request: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarAgendamentoSchema.parse(body)

    // Verificar se não há conflito de horário para o barbeiro
    const servicoInfo = await prisma.servico.findUnique({
      where: { id: dados.servicoId },
    })

    if (!servicoInfo) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    }

    const dataHora = new Date(dados.dataHora)
    const dataHoraFim = new Date(dataHora.getTime() + servicoInfo.duracaoMinutos * 60000)

    // Verificar conflito de horário
    const conflito = await prisma.agendamento.findFirst({
      where: {
        barbeiroId: dados.barbeiroId,
        status: { in: [StatusAgendamento.AGENDADO, StatusAgendamento.EM_ANDAMENTO] },
        OR: [
          { dataHora: { gte: dataHora, lt: dataHoraFim } },
          {
            AND: [
              { dataHora: { lte: dataHora } },
              {
                dataHora: {
                  gte: new Date(dataHora.getTime() - servicoInfo.duracaoMinutos * 60000),
                },
              },
            ],
          },
        ],
      },
    })

    if (conflito) {
      return NextResponse.json(
        { error: 'Horário indisponível para este barbeiro' },
        { status: 409 }
      )
    }

    // Criar o agendamento
    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId: dados.clienteId,
        barbeiroId: dados.barbeiroId,
        servicoId: dados.servicoId,
        dataHora,
        observacoes: dados.observacoes,
        status: StatusAgendamento.AGENDADO,
      },
      include: {
        cliente: true,
        barbeiro: { include: { user: true } },
        servico: true,
      },
    })

    // Enviar e-mail de confirmação (se o cliente tiver e-mail)
    if (agendamento.cliente.email) {
      await enviarConfirmacaoAgendamento({
        nomeCliente: agendamento.cliente.nome,
        nomeBarbeiro: agendamento.barbeiro.user.nome,
        nomeServico: agendamento.servico.nome,
        dataHora: agendamento.dataHora,
        nomeEmail: agendamento.cliente.nome,
        emailCliente: agendamento.cliente.email,
      })
    }

    return NextResponse.json({ agendamento }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
