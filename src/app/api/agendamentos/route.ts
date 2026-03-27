import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { enviarConfirmacaoAgendamento } from '@/lib/email'

const agendamentoSchema = z.object({
  clienteId: z.string().min(1),
  barbeiroId: z.string().min(1),
  dataHora: z.string().datetime(),
  servicoIds: z.array(z.string()).min(1, 'Selecione ao menos um serviço'),
  observacoes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const barbeiroId = searchParams.get('barbeiroId')
  const status = searchParams.get('status')

  const where: any = {}

  // Barbeiros só veem os próprios agendamentos
  if (session.user.role === 'BARBEIRO' && session.user.barbeiroId) {
    where.barbeiroId = session.user.barbeiroId
  } else if (barbeiroId) {
    where.barbeiroId = barbeiroId
  }

  if (dataInicio && dataFim) {
    where.dataHora = {
      gte: new Date(dataInicio),
      lte: new Date(dataFim),
    }
  }

  if (status) where.status = status

  const agendamentos = await prisma.agendamento.findMany({
    where,
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
      financeiro: true,
    },
    orderBy: { dataHora: 'asc' },
  })

  return NextResponse.json(agendamentos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = agendamentoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { clienteId, barbeiroId, dataHora, servicoIds, observacoes } = parsed.data

  // Busca serviços e calcula valor total
  const servicos = await prisma.servico.findMany({
    where: { id: { in: servicoIds }, ativo: true },
  })

  if (servicos.length !== servicoIds.length) {
    return NextResponse.json({ error: 'Um ou mais serviços inválidos' }, { status: 400 })
  }

  const valorTotal = servicos.reduce((sum, s) => sum + s.preco, 0)

  // Busca barbeiro para pegar comissão
  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id: barbeiroId },
    include: { user: true },
  })
  if (!barbeiro) {
    return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 })
  }

  const valorBarbeiro = (valorTotal * barbeiro.comissao) / 100
  const valorBarbearia = valorTotal - valorBarbeiro

  // Cria o agendamento com dados financeiros
  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId,
      barbeiroId,
      dataHora: new Date(dataHora),
      observacoes,
      servicos: {
        create: servicos.map((s) => ({
          servicoId: s.id,
          preco: s.preco,
        })),
      },
      financeiro: {
        create: {
          valorTotal,
          comissaoPct: barbeiro.comissao,
          valorBarbeiro,
          valorBarbearia,
        },
      },
    },
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
      financeiro: true,
    },
  })

  // Envia e-mail de confirmação (sem bloquear a resposta)
  if (agendamento.cliente.email) {
    enviarConfirmacaoAgendamento({
      clienteEmail: agendamento.cliente.email,
      clienteNome: agendamento.cliente.nome,
      barbeiro: agendamento.barbeiro.user.name,
      servicos: agendamento.servicos.map((s) => s.servico.nome),
      dataHora: agendamento.dataHora,
      valorTotal,
    }).catch(console.error)
  }

  return NextResponse.json(agendamento, { status: 201 })
}
