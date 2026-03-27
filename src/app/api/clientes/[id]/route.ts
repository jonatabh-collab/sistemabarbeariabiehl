import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clienteSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefone: z.string().min(10).optional(),
  dataNascimento: z.string().optional().or(z.literal('')),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      agendamentos: {
        include: { servicos: { include: { servico: true } }, barbeiro: { include: { user: true } } },
        orderBy: { dataHora: 'desc' },
        take: 10,
      },
    },
  })

  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json(cliente)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = clienteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const data = parsed.data
  const cliente = await prisma.cliente.update({
    where: { id: params.id },
    data: {
      ...(data.nome && { nome: data.nome }),
      email: data.email || null,
      ...(data.telefone && { telefone: data.telefone }),
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      observacoes: data.observacoes || null,
      ...(data.ativo !== undefined && { ativo: data.ativo }),
    },
  })

  return NextResponse.json(cliente)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'BARBEIRO') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  await prisma.cliente.update({ where: { id: params.id }, data: { ativo: false } })
  return NextResponse.json({ success: true })
}
