import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  comissao: z.number().min(0).max(100).optional(),
  especialidades: z.array(z.string()).optional(),
  ativo: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const barbeiro = await prisma.barbeiro.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      agendamentos: {
        include: { cliente: true, servicos: { include: { servico: true } } },
        orderBy: { dataHora: 'desc' },
        take: 10,
      },
    },
  })

  if (!barbeiro) return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 })
  return NextResponse.json(barbeiro)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { nome, comissao, especialidades, ativo } = parsed.data

  const barbeiro = await prisma.barbeiro.update({
    where: { id: params.id },
    data: {
      ...(comissao !== undefined && { comissao }),
      ...(especialidades && { especialidades }),
      ...(ativo !== undefined && { ativo }),
      ...(nome && { user: { update: { name: nome } } }),
    },
    include: { user: true },
  })

  return NextResponse.json(barbeiro)
}
