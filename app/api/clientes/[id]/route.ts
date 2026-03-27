// API de Clientes — GET, PUT por ID
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'
import { z } from 'zod'

const atualizarClienteSchema = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
  barbeiroFavorito: z.string().optional(),
  produtosUsados: z.string().optional(),
})

// GET /api/clientes/[id] — Buscar cliente com histórico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      agendamentos: {
        include: {
          servico: { select: { nome: true, preco: true } },
          barbeiro: { include: { user: { select: { nome: true } } } },
        },
        orderBy: { dataHora: 'desc' },
        take: 20,
      },
    },
  })

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  return NextResponse.json(cliente)
}

// PUT /api/clientes/[id] — Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const dados = atualizarClienteSchema.parse(body)

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.telefone && { telefone: dados.telefone }),
        email: dados.email || null,
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
        ...(dados.observacoes !== undefined && { observacoes: dados.observacoes }),
        ...(dados.barbeiroFavorito !== undefined && { barbeiroFavorito: dados.barbeiroFavorito }),
        ...(dados.produtosUsados !== undefined && { produtosUsados: dados.produtosUsados }),
      },
    })

    return NextResponse.json({ cliente })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
