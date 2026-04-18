require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

// ── Carrega o arquivo de conhecimento ──────────────────────────────────────
const conhecimento = fs.readFileSync('./conhecimento.txt', 'utf8');

// ── Cliente Claude ─────────────────────────────────────────────────────────
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Memória das conversas (número → histórico de mensagens) ───────────────
const conversas = new Map();

// ── Prompt base do agente ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o assistente de vendas do livro "O Barbeiro Engenheiro" de Jonata Biehl.
Fale de forma calorosa, próxima e autêntica — como o próprio Jonata falaria com um amigo.

━━━━━━━━━━ CONHECIMENTO COMPLETO ━━━━━━━━━━
${conhecimento}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS IMPORTANTES:
1. Mensagens curtas: máximo 3 parágrafos por resposta
2. Nunca seja agressivo ou insistente
3. Use emojis com moderação (1 a 2 por mensagem)
4. Responda SOMENTE com base no conhecimento acima
5. Quando o cliente demonstrar interesse em comprar, envie os links de compra
6. Se fizerem uma pergunta que você não sabe responder, diga:
   "Essa é boa! Deixa eu chamar o Jonata para te responder melhor 😊"
7. Nunca invente informações sobre o livro

FLUXO DE CONVERSA SUGERIDO:
- 1ª mensagem recebida → Saudação calorosa + pergunta sobre como conheceu o livro
- Cliente com dúvidas → Responda com base no conhecimento
- Cliente interessado → Apresente os benefícios principais
- Cliente pronto para comprar → Envie os links e diga onde está disponível
- Objeção de preço → Use os argumentos de valor do conhecimento`;

// ── Função principal: chama o Claude com o histórico da conversa ──────────
async function responder(numero, mensagemUsuario) {
  // Pega ou cria o histórico da conversa
  if (!conversas.has(numero)) {
    conversas.set(numero, []);
  }
  const historico = conversas.get(numero);

  // Adiciona mensagem do usuário ao histórico
  historico.push({ role: 'user', content: mensagemUsuario });

  // Limita o histórico a 20 mensagens para não gastar tokens demais
  if (historico.length > 20) {
    historico.splice(0, 2);
  }

  try {
    const resposta = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: historico,
    });

    const textoResposta = resposta.content[0].text;

    // Adiciona resposta do assistente ao histórico
    historico.push({ role: 'assistant', content: textoResposta });

    return textoResposta;
  } catch (erro) {
    console.error('Erro ao chamar Claude:', erro.message);
    return 'Desculpe, tive um probleminha aqui. Pode repetir sua mensagem? 😊';
  }
}

// ── Cliente WhatsApp ───────────────────────────────────────────────────────
const whatsapp = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-livro' }),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Mostra o QR code no terminal para fazer login
whatsapp.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR code abaixo com o WhatsApp:\n');
  qrcode.generate(qr, { small: true });
});

whatsapp.on('ready', () => {
  console.log('\n✅ Bot conectado ao WhatsApp e pronto para atender!\n');
  console.log('Aguardando mensagens...');
  console.log('(Pressione Ctrl+C para parar)\n');
});

whatsapp.on('auth_failure', () => {
  console.error('❌ Falha na autenticação. Delete a pasta .wwebjs_auth e tente novamente.');
});

// ── Recebe e responde mensagens ────────────────────────────────────────────
whatsapp.on('message', async (msg) => {
  // Ignora mensagens de grupos, status e do próprio bot
  if (msg.from === 'status@broadcast') return;
  if (msg.isGroupMsg) return;
  if (msg.fromMe) return;

  const numero = msg.from;
  const texto = msg.body.trim();

  // Ignora mensagens vazias
  if (!texto) return;

  console.log(`\n📩 Mensagem de ${numero}: ${texto}`);

  // Mostra "digitando..." enquanto processa
  const chat = await msg.getChat();
  await chat.sendStateTyping();

  // Gera a resposta com Claude
  const resposta = await responder(numero, texto);

  // Pequena pausa para parecer mais natural (1 a 3 segundos)
  const pausa = 1000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, pausa));

  // Envia a resposta
  await msg.reply(resposta);
  console.log(`✉️  Respondido: ${resposta.substring(0, 80)}...`);
});

// ── Inicia o bot ──────────────────────────────────────────────────────────
console.log('🚀 Iniciando bot O Barbeiro Engenheiro...');
whatsapp.initialize();
