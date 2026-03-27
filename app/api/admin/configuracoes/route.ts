// API de Configurações do Sistema — GET e PUT (somente Admin)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'

// GET /api/admin/configuracoes — Buscar todas as configurações
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const configs = await prisma.configuracao.findMany()

  // Converter para objeto chave-valor
  const configuracoes = configs.reduce((acc, config) => {
    acc[config.chave] = config.valor
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json({ configuracoes })
}

// PUT /api/admin/configuracoes — Salvar/atualizar configurações
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { configuracoes } = body as { configuracoes: Record<string, string> }

    if (!configuracoes || typeof configuracoes !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Salvar cada configuração via upsert
    const promises = Object.entries(configuracoes).map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { chave },
        update: { valor: String(valor) },
        create: { chave, valor: String(valor) },
      })
    )

    await Promise.all(promises)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
