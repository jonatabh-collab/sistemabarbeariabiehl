import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const barbeiroSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  comissao: z.number().min(0).max(100).default(50),
  especialidades: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const apenasAtivos = searchParams.get('ativos') === 'true'

  const barbeiros = await prisma.barbeiro.findMany({
    where: apenasAtivos ? { ativo: true } : {},
    include: {
      user: { select: { id: true, name: true, email: true, ativo: true } },
      _count: { select: { agendamentos: true } },
    },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json(barbeiros)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas admins podem criar barbeiros' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = barbeiroSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { nome, email, password, comissao, especialidades } = parsed.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: nome,
      email,
      password: hashedPassword,
      role: 'BARBEIRO',
      barbeiro: {
        create: { comissao, especialidades },
      },
    },
    include: { barbeiro: true },
  })

  return NextResponse.json(user, { status: 201 })
}
