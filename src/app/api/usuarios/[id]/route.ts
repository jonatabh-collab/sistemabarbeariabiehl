import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  ativo: z.boolean().optional(),
  role: z.enum(['ADMIN', 'BARBEIRO', 'RECEPCIONISTA']).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Permite editar o próprio perfil ou admin editar qualquer um
  if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { name, password, ativo, role } = parsed.data

  const updateData: any = {}
  if (name) updateData.name = name
  if (password) updateData.password = await bcrypt.hash(password, 12)
  if (ativo !== undefined && session.user.role === 'ADMIN') updateData.ativo = ativo
  if (role && session.user.role === 'ADMIN') updateData.role = role

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, ativo: true },
  })

  return NextResponse.json(user)
}
