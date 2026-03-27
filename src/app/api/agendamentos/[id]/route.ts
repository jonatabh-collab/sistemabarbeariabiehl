import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
  observacoes: z.string().optional(),
  formaPagamento: z.string().optional(),
  pago: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const agendamento = await prisma.agendamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
      financeiro: true,
    },
  })

  if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
  return NextResponse.json(agendamento)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { status, observacoes, formaPagamento, pago } = parsed.data

  const agendamento = await prisma.agendamento.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(observacoes !== undefined && { observacoes }),
      ...(formaPagamento !== undefined || pago !== undefined
        ? {
            financeiro: {
              update: {
                ...(formaPagamento !== undefined && { formaPagamento }),
                ...(pago !== undefined && {
                  pago,
                  dataPagamento: pago ? new Date() : null,
                }),
              },
            },
          }
        : {}),
    },
    include: {
      cliente: true,
      barbeiro: { include: { user: true } },
      servicos: { include: { servico: true } },
      financeiro: true,
    },
  })

  return NextResponse.json(agendamento)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'BARBEIRO') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.agendamento.update({
    where: { id: params.id },
    data: { status: 'CANCELADO' },
  })

  return NextResponse.json({ success: true })
}
