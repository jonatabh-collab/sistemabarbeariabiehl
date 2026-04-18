# Como usar o Bot de Vendas — O Barbeiro Engenheiro
> Guia completo para quem não é programador. Siga cada etapa na ordem.

---

## O que você vai precisar

- Computador com Windows, Mac ou Linux
- Celular com WhatsApp (o número que vai usar como bot)
- Chave da API do Claude (Anthropic) — você já criou em console.anthropic.com
- Internet

---

## ETAPA 1 — Instalar o Node.js (só faz uma vez)

O Node.js é o programa que faz o bot funcionar.

1. Acesse **https://nodejs.org**
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Baixe e instale normalmente (clique em "Avançar" em tudo)
4. Para confirmar que instalou certo:
   - Abra o **Prompt de Comando** (Windows: pressione `Win + R`, digite `cmd`, Enter)
   - Digite: `node --version`
   - Se aparecer um número (ex: `v20.11.0`), está instalado ✅

---

## ETAPA 2 — Baixar os arquivos do bot

1. Acesse o repositório no GitHub:
   `https://github.com/jonatabh-collab/sistemabarbeariabiehl`
2. Clique no botão verde **"Code"** → **"Download ZIP"**
3. Extraia o ZIP em alguma pasta, por exemplo: `Documentos/bot-livro/`
4. Dentro do ZIP, copie a pasta **`livro/bot`** para o seu `Documentos`

Ao final, você deve ter uma pasta assim:
```
Documentos/
  bot/
    index.js
    package.json
    conhecimento.txt
    .env.example
```

---

## ETAPA 3 — Preencher o arquivo de conhecimento

1. Abra a pasta `bot`
2. Abra o arquivo `conhecimento.txt` com o Bloco de Notas
3. Preencha todos os campos marcados com `[PREENCHER]`:
   - Número de páginas do livro
   - Cidade onde você mora
   - Preço do livro
   - Links da Amazon e Clube dos Autores
   - Seu número de WhatsApp
   - Seu Instagram e TikTok
   - Depoimentos de leitores (se tiver)
4. Salve o arquivo (**Ctrl + S**)

---

## ETAPA 4 — Configurar a chave da API do Claude

1. Dentro da pasta `bot`, veja o arquivo `.env.example`
2. **Copie** esse arquivo e **renomeie a cópia** para `.env` (sem o `.example`)
   - Para fazer isso: clique com botão direito → Copiar → Colar → Renomear para `.env`
3. Abra o arquivo `.env` com o Bloco de Notas
4. Substitua `sk-ant-COLE_SUA_CHAVE_AQUI` pela sua chave real do Claude
   - Sua chave começa com `sk-ant-api03-...`
   - Você encontra em: **https://console.anthropic.com/** → API Keys
5. Salve o arquivo

O arquivo `.env` deve ficar assim:
```
ANTHROPIC_API_KEY=sk-ant-api03-SuaChaveRealAqui...
```

---

## ETAPA 5 — Instalar as dependências do bot

1. Abra o **Prompt de Comando** (Win + R → `cmd` → Enter)
2. Navegue até a pasta do bot com o comando:
   ```
   cd Documentos\bot
   ```
   (Se salvou em outro lugar, ajuste o caminho)
3. Digite o comando abaixo e pressione Enter:
   ```
   npm install
   ```
4. Aguarde — vai baixar os programas necessários (pode demorar 1-2 minutos)
5. Quando aparecer o cursor piscando novamente, está pronto ✅

---

## ETAPA 6 — Ligar o bot e escanear o QR Code

1. No Prompt de Comando (ainda na pasta `bot`), digite:
   ```
   node index.js
   ```
2. Aguarde alguns segundos — vai aparecer um **QR Code** no terminal (quadradinho de pontos)
3. No celular, abra o **WhatsApp** do número que vai usar como bot
4. Vá em **Configurações** (⚙️) → **Aparelhos conectados** → **Conectar um aparelho**
5. Escaneie o QR Code com o celular
6. Aguarde — quando aparecer `✅ Bot conectado ao WhatsApp e pronto para atender!`, está funcionando

---

## ETAPA 7 — Testar o bot

1. Pelo celular de outra pessoa (ou pelo seu número pessoal), envie uma mensagem para o número do bot
2. Aguarde a resposta automática
3. Se responder, está tudo funcionando! 🎉

---

## Como manter o bot ligado

O bot funciona enquanto o Prompt de Comando estiver aberto.
Se fechar o Prompt, o bot para.

**Para manter o bot ligado 24h:**
- Deixe o computador ligado com o Prompt aberto, **ou**
- Futuramente, migre para um servidor na nuvem (posso ajudar com isso depois)

**Para religar o bot depois de fechar:**
1. Abra o Prompt de Comando
2. Navegue até a pasta: `cd Documentos\bot`
3. Digite: `node index.js`
4. Não precisa escanear o QR Code de novo — o login fica salvo

---

## Problemas comuns

**"node não é reconhecido como comando"**
→ O Node.js não foi instalado corretamente. Repita a Etapa 1.

**"Cannot find module"**
→ Você pulou a Etapa 5. Rode `npm install` na pasta do bot.

**O QR Code expirou antes de escanear**
→ O QR Code dura cerca de 30 segundos. Pare o bot (Ctrl+C), rode `node index.js` de novo e escaneie rápido.

**O bot parou de responder**
→ Verifique se o Prompt de Comando ainda está aberto. Se fechou, abra novamente e rode `node index.js`.

**"Error: ANTHROPIC_API_KEY"**
→ O arquivo `.env` não foi criado ou a chave está errada. Revise a Etapa 4.

---

## Como atualizar o arquivo de conhecimento

Se quiser mudar algo no `conhecimento.txt` (adicionar depoimentos, mudar preço, etc.):
1. Abra o `conhecimento.txt` e faça as alterações
2. Salve o arquivo
3. Pare o bot (Ctrl+C no Prompt de Comando)
4. Ligue o bot novamente (`node index.js`)
5. As mudanças já entram em vigor automaticamente
