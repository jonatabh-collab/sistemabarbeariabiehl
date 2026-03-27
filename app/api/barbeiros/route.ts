// API de Barbeiros — GET e POST
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/permissions'
import { Role } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const criarBarbeiroSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  especialidades: z.array(z.string()).optional(),
  comissaoPercent: z.number().min(0).max(100).optional(),
  horarios: z.record(z.union([
    z.null(),
    z.object({ inicio: z.string(), fim: z.string() }),
  ])).optional(),
})

// GET /api/barbeiros — Listar barbeiros
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const ativo = searchParams.get('ativo')

  const where: Record<string, unknown> = {}
  if (ativo === 'true') where.ativo = true

  const barbeiros = await prisma.barbeiro.findMany({
    where,
    include: {
      user: { select: { id: true, nome: true, email: true, ativo: true } },
    },
    orderBy: { user: { nome: 'asc' } },
  })

  return NextResponse.json({ barbeiros })
}

// POST /api/barbeiros — Criar barbeiro (cria usuário + perfil)
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarBarbeiroSchema.parse(body)

    // Verificar se e-mail já existe
    const emailExistente = await prisma.user.findUnique({
      where: { email: dados.email },
    })

    if (emailExistente) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado no sistema' },
        { status: 400 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(dados.senha, 12)

    // Criar usuário e perfil de barbeiro em transação
    const barbeiro = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash,
          role: Role.BARBEIRO,
          ativo: true,
        },
      })

      return tx.barbeiro.create({
        data: {
          userId: user.id,
          especialidades: dados.especialidades || [],
          comissaoPercent: dados.comissaoPercent ?? 40,
          horarios: dados.horarios || {},
          ativo: true,
        },
        include: {
          user: { select: { id: true, nome: true, email: true } },
        },
      })
    })

    return NextResponse.json({ barbeiro }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao criar barbeiro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
