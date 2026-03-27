import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone inválido'),
  dataNascimento: z.string().optional().or(z.literal('')),
  observacoes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' as const } },
          { telefone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nome: 'asc' },
      include: { _count: { select: { agendamentos: true } } },
    }),
    prisma.cliente.count({ where }),
  ])

  return NextResponse.json({ clientes, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const parsed = clienteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const data = parsed.data
  const cliente = await prisma.cliente.create({
    data: {
      nome: data.nome,
      email: data.email || null,
      telefone: data.telefone,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      observacoes: data.observacoes || null,
    },
  })

  return NextResponse.json(cliente, { status: 201 })
}
