// API de Import de Backup — restaura dados a partir de arquivo JSON
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/permissions'

interface BackupData {
  versao: string
  timestamp: string
  dados: {
    clientes: unknown[]
    barbeiros: unknown[]
    servicos: unknown[]
    agendamentos: unknown[]
    receitas: unknown[]
    despesas: unknown[]
    configuracoes: unknown[]
    feriados: unknown[]
  }
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json() as BackupData

    // Validar estrutura básica do backup
    if (!body?.versao || !body?.dados) {
      return NextResponse.json(
        { error: 'Arquivo de backup inválido. Verifique se o arquivo está correto.' },
        { status: 400 }
      )
    }

    const { dados } = body

    // Verificar campos obrigatórios
    const camposNecessarios = ['clientes', 'servicos', 'agendamentos']
    for (const campo of camposNecessarios) {
      if (!Array.isArray(dados[campo as keyof typeof dados])) {
        return NextResponse.json(
          { error: `Backup inválido: campo "${campo}" ausente ou inválido` },
          { status: 400 }
        )
      }
    }

    // Executar restore em transação
    await prisma.$transaction(async (tx) => {
      // Limpar dados atuais (preservando o usuário admin atual)
      await tx.receita.deleteMany()
      await tx.agendamento.deleteMany()
      await tx.folga.deleteMany()
      await tx.barbeiro.deleteMany()
      await tx.cliente.deleteMany()
      await tx.servico.deleteMany()
      await tx.despesa.deleteMany()
      await tx.configuracao.deleteMany()
      await tx.feriado.deleteMany()
      // Deletar usuários EXCETO o admin atual
      await tx.user.deleteMany({
        where: { id: { not: session!.user.id } },
      })

      // Restaurar clientes
      if (dados.clientes?.length > 0) {
        for (const cliente of dados.clientes as Array<Record<string, unknown>>) {
          await tx.cliente.create({
            data: {
              id: String(cliente.id),
              nome: String(cliente.nome),
              telefone: String(cliente.telefone),
              email: cliente.email ? String(cliente.email) : null,
              dataNascimento: cliente.dataNascimento ? new Date(String(cliente.dataNascimento)) : null,
              observacoes: cliente.observacoes ? String(cliente.observacoes) : null,
              barbeiroFavorito: cliente.barbeiroFavorito ? String(cliente.barbeiroFavorito) : null,
              produtosUsados: cliente.produtosUsados ? String(cliente.produtosUsados) : null,
            },
          })
        }
      }

      // Restaurar serviços
      if (dados.servicos?.length > 0) {
        for (const servico of dados.servicos as Array<Record<string, unknown>>) {
          await tx.servico.create({
            data: {
              id: String(servico.id),
              nome: String(servico.nome),
              descricao: servico.descricao ? String(servico.descricao) : null,
              preco: Number(servico.preco),
              duracaoMinutos: Number(servico.duracaoMinutos),
              ativo: Boolean(servico.ativo),
            },
          })
        }
      }

      // Restaurar configurações
      if (dados.configuracoes?.length > 0) {
        for (const config of dados.configuracoes as Array<Record<string, unknown>>) {
          await tx.configuracao.create({
            data: {
              id: String(config.id),
              chave: String(config.chave),
              valor: String(config.valor),
            },
          })
        }
      }

      // Restaurar despesas
      if (dados.despesas?.length > 0) {
        for (const despesa of dados.despesas as Array<Record<string, unknown>>) {
          await tx.despesa.create({
            data: {
              id: String(despesa.id),
              descricao: String(despesa.descricao),
              valor: Number(despesa.valor),
              categoria: String(despesa.categoria || 'Geral'),
              data: new Date(String(despesa.data)),
            },
          })
        }
      }

      // Restaurar feriados
      if (dados.feriados?.length > 0) {
        for (const feriado of dados.feriados as Array<Record<string, unknown>>) {
          await tx.feriado.create({
            data: {
              id: String(feriado.id),
              descricao: String(feriado.descricao),
              data: new Date(String(feriado.data)),
            },
          })
        }
      }
    }, { timeout: 30000 })

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao importar backup:', error)
    return NextResponse.json(
      { error: 'Erro ao importar backup. Verifique o arquivo e tente novamente.' },
      { status: 500 }
    )
  }
}
