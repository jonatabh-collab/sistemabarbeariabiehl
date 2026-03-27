// API de Usuários — GET e POST (somente Admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'
import { Role } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const criarUsuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  role: z.nativeEnum(Role),
})

// GET /api/admin/usuarios — Listar usuários
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      ativo: true,
      createdAt: true,
    },
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json({ usuarios })
}

// POST /api/admin/usuarios — Criar usuário
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const dados = criarUsuarioSchema.parse(body)

    // Verificar e-mail duplicado
    const existente = await prisma.user.findUnique({
      where: { email: dados.email },
    })

    if (existente) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
    }

    const senhaHash = await bcrypt.hash(dados.senha, 12)

    const usuario = await prisma.user.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash,
        role: dados.role,
        ativo: true,
      },
      select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    })

    // Se for barbeiro, criar perfil de barbeiro automaticamente
    if (dados.role === Role.BARBEIRO) {
      await prisma.barbeiro.create({
        data: {
          userId: usuario.id,
          especialidades: [],
          comissaoPercent: 40,
          horarios: {},
          ativo: true,
        },
      })
    }

    return NextResponse.json({ usuario }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
