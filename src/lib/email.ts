import { Resend } from 'resend'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'Barbearia Biehl <noreply@barbeariabiehl.com>'
const BARBEARIA = process.env.NEXT_PUBLIC_NOME_BARBEARIA || 'Barbearia Biehl'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── Templates ────────────────────────────────────────────

function baseTemplate(titulo: string, conteudo: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#1a1a2e;padding:32px;text-align:center;">
      <h1 style="color:#f59e0b;margin:0;font-size:28px;font-weight:bold;">✂️ ${BARBEARIA}</h1>
      <p style="color:#9ca3af;margin:8px 0 0;font-size:14px;">Sistema de Gestão</p>
    </div>
    <!-- Content -->
    <div style="padding:32px;">
      ${conteudo}
    </div>
    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#6b7280;font-size:12px;margin:0;">${BARBEARIA} • Todos os direitos reservados</p>
      <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">Este e-mail foi enviado automaticamente. Não responda a este endereço.</p>
    </div>
  </div>
</body>
</html>`
}

// ─── Confirmação de Agendamento ────────────────────────────

export async function enviarConfirmacaoAgendamento(params: {
  clienteEmail: string
  clienteNome: string
  barbeiro: string
  servicos: string[]
  dataHora: Date
  valorTotal: number
}) {
  const dataFormatada = format(params.dataHora, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
  const servicosLista = params.servicos.map(s => `<li style="padding:4px 0;color:#374151;">${s}</li>`).join('')

  const conteudo = `
    <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:8px;">Agendamento Confirmado! ✅</h2>
    <p style="color:#6b7280;margin-bottom:24px;">Olá, <strong>${params.clienteNome}</strong>! Seu agendamento foi realizado com sucesso.</p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px;border-left:4px solid #f59e0b;">
      <h3 style="color:#1a1a2e;margin:0 0 16px;font-size:16px;">📋 Detalhes do Agendamento</h3>
      <p style="margin:8px 0;color:#374151;"><strong>📅 Data e Hora:</strong> ${dataFormatada}</p>
      <p style="margin:8px 0;color:#374151;"><strong>✂️ Barbeiro:</strong> ${params.barbeiro}</p>
      <p style="margin:8px 0;color:#374151;"><strong>🛎️ Serviços:</strong></p>
      <ul style="margin:4px 0 8px 16px;padding:0;">${servicosLista}</ul>
      <p style="margin:8px 0;color:#374151;"><strong>💰 Valor Total: R$ ${params.valorTotal.toFixed(2).replace('.', ',')}</strong></p>
    </div>

    <div style="background:#fef3c7;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:#92400e;margin:0;font-size:14px;">⚠️ <strong>Lembrete:</strong> Caso precise cancelar ou remarcar, entre em contato com antecedência mínima de 2 horas.</p>
    </div>

    <p style="color:#6b7280;font-size:14px;">Até logo! A equipe ${BARBEARIA} está ansiosa para te receber. 💈</p>
  `

  return resend.emails.send({
    from: FROM,
    to: params.clienteEmail,
    subject: `✅ Agendamento confirmado — ${BARBEARIA}`,
    html: baseTemplate('Agendamento Confirmado', conteudo),
  })
}

// ─── Lembrete 24h ────────────────────────────────────────

export async function enviarLembrete24h(params: {
  clienteEmail: string
  clienteNome: string
  barbeiro: string
  servicos: string[]
  dataHora: Date
}) {
  const dataFormatada = format(params.dataHora, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
  const servicosTexto = params.servicos.join(', ')

  const conteudo = `
    <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:8px;">Lembrete de Agendamento ⏰</h2>
    <p style="color:#6b7280;margin-bottom:24px;">Olá, <strong>${params.clienteNome}</strong>! Não se esqueça do seu agendamento amanhã.</p>

    <div style="background:#f9fafb;border-radius:8px;padding:20px;margin-bottom:20px;border-left:4px solid #f59e0b;">
      <h3 style="color:#1a1a2e;margin:0 0 16px;font-size:16px;">📋 Seu Agendamento</h3>
      <p style="margin:8px 0;color:#374151;"><strong>📅 Quando:</strong> ${dataFormatada}</p>
      <p style="margin:8px 0;color:#374151;"><strong>✂️ Barbeiro:</strong> ${params.barbeiro}</p>
      <p style="margin:8px 0;color:#374151;"><strong>🛎️ Serviço(s):</strong> ${servicosTexto}</p>
    </div>

    <p style="color:#6b7280;font-size:14px;">Te esperamos! 💈</p>
  `

  return resend.emails.send({
    from: FROM,
    to: params.clienteEmail,
    subject: `⏰ Lembrete: seu agendamento é amanhã — ${BARBEARIA}`,
    html: baseTemplate('Lembrete de Agendamento', conteudo),
  })
}

// ─── Parabéns de Aniversário ──────────────────────────────

export async function enviarParabensAniversario(params: {
  clienteEmail: string
  clienteNome: string
}) {
  const conteudo = `
    <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:8px;">Feliz Aniversário! 🎂</h2>
    <p style="color:#6b7280;margin-bottom:24px;">Olá, <strong>${params.clienteNome}</strong>!</p>

    <p style="color:#374151;font-size:16px;line-height:1.6;">
      Toda a equipe da <strong>${BARBEARIA}</strong> deseja um feliz aniversário repleto de alegria, saúde e sucesso! 🎉
    </p>

    <div style="background:#fef3c7;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#92400e;font-size:18px;font-weight:bold;margin:0;">🎁 Presente de Aniversário!</p>
      <p style="color:#b45309;margin:8px 0 0;font-size:14px;">
        Venha nos visitar no seu mês de aniversário e ganhe <strong>10% de desconto</strong> em qualquer serviço!
      </p>
    </div>

    <p style="color:#6b7280;font-size:14px;">Com carinho, toda a equipe ${BARBEARIA}. 💈</p>
  `

  return resend.emails.send({
    from: FROM,
    to: params.clienteEmail,
    subject: `🎂 Feliz Aniversário, ${params.clienteNome}! — ${BARBEARIA}`,
    html: baseTemplate('Feliz Aniversário!', conteudo),
  })
}
