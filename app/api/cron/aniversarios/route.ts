// Cron Job — Enviar e-mails de feliz aniversário
// Executado diariamente às 8h (configurado em vercel.json)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarAniversario } from '@/lib/resend'

export async function GET(request: NextRequest) {
  // Verificar autenticação do cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hoje = new Date()
    const dia = hoje.getDate()
    const mes = hoje.getMonth() + 1 // 1-12

    // Buscar clientes que fazem aniversário hoje e têm e-mail
    const clientes = await prisma.cliente.findMany({
      where: {
        email: { not: null },
        dataNascimento: { not: null },
      },
    })

    // Filtrar clientes aniversariantes de hoje
    // (PostgreSQL não tem função nativa fácil para isso, fazemos no JS)
    const aniversariantes = clientes.filter((c) => {
      if (!c.dataNascimento) return false
      const nascimento = new Date(c.dataNascimento)
      return nascimento.getDate() === dia && nascimento.getMonth() + 1 === mes
    })

    // Buscar nome da barbearia
    const configNome = await prisma.configuracao.findUnique({
      where: { chave: 'nome_barbearia' },
    })
    const nomeBarbearia = configNome?.valor || 'Barbearia Biehl'

    let enviados = 0
    let erros = 0

    // Enviar e-mails de aniversário
    for (const cliente of aniversariantes) {
      if (!cliente.email) continue

      const resultado = await enviarAniversario({
        nomeCliente: cliente.nome,
        emailCliente: cliente.email,
        nomeBarbearia,
      })

      if (resultado.success) {
        enviados++
      } else {
        erros++
      }
    }

    console.log(`Aniversários: ${enviados} enviados, ${erros} erros`)

    return NextResponse.json({
      success: true,
      aniversariantes: aniversariantes.length,
      enviados,
      erros,
    })
  } catch (error) {
    console.error('Erro no cron de aniversários:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
