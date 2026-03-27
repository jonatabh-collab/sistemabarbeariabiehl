// API de Serviços — GET e POST
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

const criarServicoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  duracaoMinutos: z.number().int().positive(),
})

// GET /api/servicos — Listar serviços
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const ativo = searchParams.get('ativo')

  const where: Record<string, unknown> = {}
  if (ativo === 'true') where.ativo = true
  if (ativo === 'false') where.ativo = false

  const servicos = await prisma.servico.findMany({
    where,
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json({ servicos })
}

// POST /api/servicos — Criar serviço (somente admin)
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarServicoSchema.parse(body)

    const servico = await prisma.servico.create({
      data: { ...dados, ativo: true },
    })

    return NextResponse.json({ servico }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
