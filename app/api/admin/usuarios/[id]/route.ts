// API de Usuários — PUT por ID (somente Admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'
import { Role } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(8).optional().or(z.literal('')),
  role: z.nativeEnum(Role).optional(),
  ativo: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = atualizarUsuarioSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (dados.nome) updateData.nome = dados.nome
    if (dados.email) updateData.email = dados.email
    if (dados.role) updateData.role = dados.role
    if (dados.ativo !== undefined) updateData.ativo = dados.ativo
    if (dados.senha) {
      updateData.senhaHash = await bcrypt.hash(dados.senha, 12)
    }

    const usuario = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    })

    return NextResponse.json({ usuario })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
