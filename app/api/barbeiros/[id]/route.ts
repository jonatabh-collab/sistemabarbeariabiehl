// API de Barbeiros — PUT por ID
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const atualizarBarbeiroSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(8).optional().or(z.literal('')),
  especialidades: z.array(z.string()).optional(),
  comissaoPercent: z.number().min(0).max(100).optional(),
  horarios: z.record(z.union([
    z.null(),
    z.object({ inicio: z.string(), fim: z.string() }),
  ])).optional(),
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
    const dados = atualizarBarbeiroSchema.parse(body)

    // Buscar barbeiro
    const barbeiro = await prisma.barbeiro.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!barbeiro) {
      return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 })
    }

    // Atualizar em transação
    await prisma.$transaction(async (tx) => {
      // Atualizar dados do usuário
      const userUpdate: Record<string, unknown> = {}
      if (dados.nome) userUpdate.nome = dados.nome
      if (dados.email) userUpdate.email = dados.email
      if (dados.ativo !== undefined) userUpdate.ativo = dados.ativo
      if (dados.senha) {
        userUpdate.senhaHash = await bcrypt.hash(dados.senha, 12)
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: barbeiro.userId },
          data: userUpdate,
        })
      }

      // Atualizar perfil de barbeiro
      const barbeiroUpdate: Record<string, unknown> = {}
      if (dados.especialidades !== undefined) barbeiroUpdate.especialidades = dados.especialidades
      if (dados.comissaoPercent !== undefined) barbeiroUpdate.comissaoPercent = dados.comissaoPercent
      if (dados.horarios !== undefined) barbeiroUpdate.horarios = dados.horarios
      if (dados.ativo !== undefined) barbeiroUpdate.ativo = dados.ativo

      if (Object.keys(barbeiroUpdate).length > 0) {
        await tx.barbeiro.update({
          where: { id: params.id },
          data: barbeiroUpdate,
        })
      }
    })

    const barbeiroAtualizado = await prisma.barbeiro.findUnique({
      where: { id: params.id },
      include: { user: { select: { nome: true, email: true } } },
    })

    return NextResponse.json({ barbeiro: barbeiroAtualizado })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
