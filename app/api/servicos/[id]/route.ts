// API de Serviços — PUT por ID
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'
import { z } from 'zod'

const atualizarServicoSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  preco: z.number().positive().optional(),
  duracaoMinutos: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = atualizarServicoSchema.parse(body)

    const servico = await prisma.servico.update({
      where: { id: params.id },
      data: dados,
    })

    return NextResponse.json({ servico })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
