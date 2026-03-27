// API de Clientes — GET (listar) e POST (criar)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'
import { z } from 'zod'

const criarClienteSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
  barbeiroFavorito: z.string().optional(),
  produtosUsados: z.string().optional(),
})

// GET /api/clientes — Listar clientes
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const busca = searchParams.get('busca')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}

  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: 'insensitive' } },
      { telefone: { contains: busca } },
      { email: { contains: busca, mode: 'insensitive' } },
    ]
  }

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where,
      orderBy: { nome: 'asc' },
      take: limit,
    }),
    prisma.cliente.count({ where }),
  ])

  return NextResponse.json({ clientes, total })
}

// POST /api/clientes — Criar cliente
export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarClienteSchema.parse(body)

    const cliente = await prisma.cliente.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email || null,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
        observacoes: dados.observacoes || null,
        barbeiroFavorito: dados.barbeiroFavorito || null,
        produtosUsados: dados.produtosUsados || null,
      },
    })

    return NextResponse.json({ cliente }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
