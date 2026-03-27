import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  duracao: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'BARBEIRO') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const servico = await prisma.servico.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(servico)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas admins podem excluir serviços' }, { status: 403 })
  }

  await prisma.servico.update({ where: { id: params.id }, data: { ativo: false } })
  return NextResponse.json({ success: true })
}
