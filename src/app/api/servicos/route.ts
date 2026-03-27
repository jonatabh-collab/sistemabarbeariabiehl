import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const servicoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  duracao: z.number().int().positive(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const apenasAtivos = searchParams.get('ativos') !== 'false'

  const servicos = await prisma.servico.findMany({
    where: apenasAtivos ? { ativo: true } : {},
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json(servicos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role === 'BARBEIRO') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = servicoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const servico = await prisma.servico.create({ data: parsed.data })
  return NextResponse.json(servico, { status: 201 })
}
