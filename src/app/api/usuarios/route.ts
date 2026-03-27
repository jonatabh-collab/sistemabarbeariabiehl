import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'BARBEIRO', 'RECEPCIONISTA']),
})

export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const usuarios = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true, barbeiro: { select: { id: true, comissao: true } } },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(usuarios)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === 'BARBEIRO'
        ? { barbeiro: { create: { comissao: 50, especialidades: [] } } }
        : {}),
    },
    include: { barbeiro: true },
  })

  const { password: _, ...userWithoutPassword } = user
  return NextResponse.json(userWithoutPassword, { status: 201 })
}
