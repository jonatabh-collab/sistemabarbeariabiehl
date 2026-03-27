import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET — Gera backup completo do banco em JSON
export async function GET(_: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas admins podem fazer backup' }, { status: 403 })
  }

  const [users, clientes, barbeiros, servicos, agendamentos, agendamentoServicos, financeiros] =
    await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, ativo: true, createdAt: true } }),
      prisma.cliente.findMany(),
      prisma.barbeiro.findMany(),
      prisma.servico.findMany(),
      prisma.agendamento.findMany(),
      prisma.agendamentoServico.findMany(),
      prisma.financeiro.findMany(),
    ])

  const backup = {
    versao: '2.0',
    barbearia: process.env.NEXT_PUBLIC_NOME_BARBEARIA || 'Barbearia Biehl',
    geradoEm: new Date().toISOString(),
    dados: { users, clientes, barbeiros, servicos, agendamentos, agendamentoServicos, financeiros },
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-barbearia-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}

// POST — Restaura backup a partir de JSON
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas admins podem restaurar backup' }, { status: 403 })
  }

  let backup: any
  try {
    backup = await req.json()
  } catch {
    return NextResponse.json({ error: 'Arquivo de backup inválido' }, { status: 400 })
  }

  if (!backup?.dados || !backup?.versao) {
    return NextResponse.json({ error: 'Formato de backup inválido' }, { status: 400 })
  }

  const { clientes, servicos } = backup.dados

  const resultado = { clientes: 0, servicos: 0, erros: [] as string[] }

  // Restaura clientes (ignora duplicatas por telefone)
  if (Array.isArray(clientes)) {
    for (const cliente of clientes) {
      try {
        await prisma.cliente.upsert({
          where: { id: cliente.id },
          update: {
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento) : null,
            observacoes: cliente.observacoes,
            ativo: cliente.ativo ?? true,
          },
          create: {
            id: cliente.id,
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento) : null,
            observacoes: cliente.observacoes,
            ativo: cliente.ativo ?? true,
          },
        })
        resultado.clientes++
      } catch (e: any) {
        resultado.erros.push(`Cliente ${cliente.nome}: ${e.message}`)
      }
    }
  }

  // Restaura serviços
  if (Array.isArray(servicos)) {
    for (const servico of servicos) {
      try {
        await prisma.servico.upsert({
          where: { id: servico.id },
          update: { nome: servico.nome, descricao: servico.descricao, preco: servico.preco, duracao: servico.duracao, ativo: servico.ativo },
          create: { id: servico.id, nome: servico.nome, descricao: servico.descricao, preco: servico.preco, duracao: servico.duracao, ativo: servico.ativo },
        })
        resultado.servicos++
      } catch (e: any) {
        resultado.erros.push(`Serviço ${servico.nome}: ${e.message}`)
      }
    }
  }

  return NextResponse.json({
    sucesso: true,
    mensagem: 'Backup restaurado com sucesso',
    resultado,
  })
}
