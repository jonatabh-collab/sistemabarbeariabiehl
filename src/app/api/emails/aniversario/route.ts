import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarParabensAniversario } from '@/lib/email'

// Roda diariamente via cron para buscar aniversariantes do dia
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  const hoje = new Date()
  const dia = hoje.getDate()
  const mes = hoje.getMonth() + 1

  // Busca clientes com aniversário hoje
  const clientes = await prisma.cliente.findMany({
    where: {
      dataNascimento: { not: null },
      email: { not: null },
      ativo: true,
    },
  })

  const aniversariantes = clientes.filter((c) => {
    if (!c.dataNascimento) return false
    const nasc = new Date(c.dataNascimento)
    return nasc.getDate() === dia && nasc.getMonth() + 1 === mes
  })

  let enviados = 0
  let erros = 0

  for (const cliente of aniversariantes) {
    if (!cliente.email) continue
    try {
      await enviarParabensAniversario({
        clienteEmail: cliente.email,
        clienteNome: cliente.nome,
      })
      enviados++
    } catch (error) {
      console.error(`Erro ao enviar parabéns para ${cliente.email}:`, error)
      erros++
    }
  }

  return NextResponse.json({ aniversariantes: aniversariantes.length, enviados, erros })
}
