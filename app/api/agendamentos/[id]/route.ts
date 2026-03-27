// API de Agendamentos — GET, PUT e DELETE por ID
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/permissions'
import { StatusAgendamento } from '@prisma/client'
import { z } from 'zod'

const atualizarAgendamentoSchema = z.object({
  clienteId: z.string().optional(),
  barbeiroId: z.string().optional(),
  servicoId: z.string().optional(),
  dataHora: z.string().optional(),
  status: z.nativeEnum(StatusAgendamento).optional(),
  observacoes: z.string().optional(),
})

// PUT /api/agendamentos/[id] — Atualizar agendamento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const dados = atualizarAgendamentoSchema.parse(body)

    // Verificar se o agendamento existe
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: params.id },
      include: { barbeiro: true },
    })

    if (!agendamento) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    }

    // Barbeiro só pode atualizar status dos próprios agendamentos
    if (session!.user.role === 'BARBEIRO') {
      const barbeiro = await prisma.barbeiro.findUnique({
        where: { userId: session!.user.id },
      })
      if (barbeiro?.id !== agendamento.barbeiroId) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Processar data se fornecida
    const updateData: Record<string, unknown> = {}
    if (dados.status) updateData.status = dados.status
    if (dados.observacoes !== undefined) updateData.observacoes = dados.observacoes
    if (dados.clienteId) updateData.clienteId = dados.clienteId
    if (dados.barbeiroId) updateData.barbeiroId = dados.barbeiroId
    if (dados.servicoId) updateData.servicoId = dados.servicoId
    if (dados.dataHora) updateData.dataHora = new Date(dados.dataHora)

    // Se concluindo, criar registro de receita
    if (dados.status === StatusAgendamento.CONCLUIDO && agendamento.status !== StatusAgendamento.CONCLUIDO) {
      const servicoAtual = await prisma.servico.findUnique({
        where: { id: dados.servicoId || agendamento.servicoId },
      })
      const barbeiroAtual = await prisma.barbeiro.findUnique({
        where: { id: dados.barbeiroId || agendamento.barbeiroId },
      })

      if (servicoAtual && barbeiroAtual) {
        const comissao = (servicoAtual.preco * barbeiroAtual.comissaoPercent) / 100

        // Criar receita (upsert para evitar duplicação)
        await prisma.receita.upsert({
          where: { agendamentoId: agendamento.id },
          update: {},
          create: {
            agendamentoId: agendamento.id,
            valor: servicoAtual.preco,
            comissaoBarbeiro: comissao,
            data: new Date(),
          },
        })
      }
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ agendamento: agendamentoAtualizado })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/agendamentos/[id] — Cancelar agendamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth()
  if (error) return error

  // Apenas admin e recepcionista podem cancelar
  if (session!.user.role === 'BARBEIRO') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  await prisma.agendamento.update({
    where: { id: params.id },
    data: { status: StatusAgendamento.CANCELADO },
  })

  return NextResponse.json({ success: true })
}
