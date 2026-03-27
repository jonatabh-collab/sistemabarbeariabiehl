// Configuração e funções de envio de e-mail via Resend
import { Resend } from 'resend'

// Inicializar cliente Resend com a API key do ambiente
const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@resend.dev'

// Interface para os dados de e-mail
interface EmailConfirmacaoData {
  nomeCliente: string
  nomeBarbeiro: string
  nomeServico: string
  dataHora: Date
  nomeEmail: string
  emailCliente: string
}

interface EmailLembreteData {
  nomeCliente: string
  nomeBarbeiro: string
  nomeServico: string
  dataHora: Date
  emailCliente: string
}

interface EmailAniversarioData {
  nomeCliente: string
  emailCliente: string
  nomeBarbearia: string
}

// Formatar data e hora em português
function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(data)
}

// Enviar e-mail de confirmação de agendamento
export async function enviarConfirmacaoAgendamento(dados: EmailConfirmacaoData) {
  try {
    const dataFormatada = formatarDataHora(dados.dataHora)

    await resend.emails.send({
      from: EMAIL_FROM,
      to: dados.emailCliente,
      subject: `✅ Agendamento confirmado - ${dados.nomeServico}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f0e8; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #c9a84c; }
            .logo { color: #c9a84c; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .content { padding: 40px 30px; }
            h1 { color: #c9a84c; font-family: Georgia, serif; font-size: 28px; margin: 0 0 10px; }
            p { color: #f5f0e8; line-height: 1.6; }
            .info-box { background: #2d2d2d; border-left: 3px solid #c9a84c; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .info-item { display: flex; gap: 10px; margin: 8px 0; }
            .info-label { color: #c9a84c; font-weight: bold; min-width: 100px; }
            .info-value { color: #f5f0e8; }
            .footer { background: #111; padding: 20px 30px; text-align: center; }
            .footer p { color: #888; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✂ BARBEARIA BIEHL</div>
            </div>
            <div class="content">
              <h1>Agendamento Confirmado!</h1>
              <p>Olá, <strong style="color:#c9a84c">${dados.nomeCliente}</strong>! Seu agendamento foi confirmado com sucesso.</p>

              <div class="info-box">
                <div class="info-item">
                  <span class="info-label">Serviço:</span>
                  <span class="info-value">${dados.nomeServico}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Barbeiro:</span>
                  <span class="info-value">${dados.nomeBarbeiro}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data e hora:</span>
                  <span class="info-value">${dataFormatada}</span>
                </div>
              </div>

              <p>Por favor, chegue com <strong>5 minutos de antecedência</strong>. Em caso de imprevisto, nos avise com antecedência.</p>
              <p>Aguardamos você! 🪒</p>
            </div>
            <div class="footer">
              <p>Barbearia Biehl © ${new Date().getFullYear()} — E-mail automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar e-mail de confirmação:', error)
    return { success: false, error }
  }
}

// Enviar e-mail de lembrete (24h antes)
export async function enviarLembreteAgendamento(dados: EmailLembreteData) {
  try {
    const dataFormatada = formatarDataHora(dados.dataHora)

    await resend.emails.send({
      from: EMAIL_FROM,
      to: dados.emailCliente,
      subject: `🔔 Lembrete: seu agendamento é amanhã!`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f0e8; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
            .header { padding: 40px 30px; text-align: center; border-bottom: 2px solid #c9a84c; }
            .logo { color: #c9a84c; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .content { padding: 40px 30px; }
            h1 { color: #c9a84c; font-size: 28px; margin: 0 0 10px; }
            p { color: #f5f0e8; line-height: 1.6; }
            .info-box { background: #2d2d2d; border-left: 3px solid #c9a84c; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .footer { background: #111; padding: 20px 30px; text-align: center; }
            .footer p { color: #888; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✂ BARBEARIA BIEHL</div>
            </div>
            <div class="content">
              <h1>Lembrete de Agendamento</h1>
              <p>Olá, <strong style="color:#c9a84c">${dados.nomeCliente}</strong>! Lembramos que você tem um agendamento marcado para <strong>amanhã</strong>.</p>

              <div class="info-box">
                <p style="color:#c9a84c;margin:0 0 10px;font-weight:bold">Detalhes do agendamento:</p>
                <p style="margin:4px 0;color:#f5f0e8">📋 Serviço: ${dados.nomeServico}</p>
                <p style="margin:4px 0;color:#f5f0e8">💈 Barbeiro: ${dados.nomeBarbeiro}</p>
                <p style="margin:4px 0;color:#f5f0e8">📅 Data: ${dataFormatada}</p>
              </div>

              <p>Te esperamos! Não esqueça de chegar com alguns minutinhos de antecedência. 😊</p>
            </div>
            <div class="footer">
              <p>Barbearia Biehl © ${new Date().getFullYear()} — E-mail automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error)
    return { success: false, error }
  }
}

// Enviar e-mail de feliz aniversário
export async function enviarAniversario(dados: EmailAniversarioData) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: dados.emailCliente,
      subject: `🎂 Feliz Aniversário, ${dados.nomeCliente}!`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f0e8; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
            .header { padding: 40px 30px; text-align: center; border-bottom: 2px solid #c9a84c; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); }
            .logo { color: #c9a84c; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .content { padding: 40px 30px; text-align: center; }
            h1 { color: #c9a84c; font-size: 32px; margin: 0 0 20px; }
            p { color: #f5f0e8; line-height: 1.6; font-size: 16px; }
            .emoji { font-size: 48px; margin: 20px 0; }
            .footer { background: #111; padding: 20px 30px; text-align: center; }
            .footer p { color: #888; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✂ BARBEARIA BIEHL</div>
            </div>
            <div class="content">
              <div class="emoji">🎂</div>
              <h1>Feliz Aniversário!</h1>
              <p>Olá, <strong style="color:#c9a84c">${dados.nomeCliente}</strong>!</p>
              <p>Toda a equipe da <strong>${dados.nomeBarbearia}</strong> deseja um feliz aniversário cheio de realizações e momentos especiais!</p>
              <p>Que tal celebrar com um visual novo? Venha nos visitar e garanta seu desconto especial de aniversariante! 🎁</p>
              <p style="color:#c9a84c;font-style:italic">Com carinho, equipe Barbearia Biehl ✂</p>
            </div>
            <div class="footer">
              <p>Barbearia Biehl © ${new Date().getFullYear()} — E-mail automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar e-mail de aniversário:', error)
    return { success: false, error }
  }
}
