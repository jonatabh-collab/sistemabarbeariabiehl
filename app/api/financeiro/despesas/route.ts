// API de Despesas — POST
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

const criarDespesaSchema = z.object({
  descricao: z.string().min(2),
  valor: z.number().positive(),
  categoria: z.string().optional(),
  data: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarDespesaSchema.parse(body)

    const despesa = await prisma.despesa.create({
      data: {
        descricao: dados.descricao,
        valor: dados.valor,
        categoria: dados.categoria || 'Geral',
        data: new Date(dados.data),
      },
    })

    return NextResponse.json({ despesa }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
