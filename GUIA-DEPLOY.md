# 🚀 Guia de Deploy — Barbearia Biehl

**Para quem nunca publicou um site antes — leitura simples, passo a passo.**

> Tempo estimado: 30–60 minutos
> Custo: **R$ 0,00** (tudo no plano gratuito)

---

## 📋 O que você vai criar

| Serviço | Para quê serve | Custo |
|---------|---------------|-------|
| **Supabase** | Banco de dados (onde ficam os dados) | Gratuito |
| **Resend** | Envio de e-mails automáticos | Gratuito (3.000/mês) |
| **Vercel** | Hospedagem do site | Gratuito |

---

## PASSO 1 — Criar conta no Supabase (banco de dados)

**O Supabase guarda todos os dados: clientes, agendamentos, barbeiros, etc.**

1. Acesse: **supabase.com** e clique em **"Start your project"**
2. Crie uma conta com **Google** ou **e-mail**
3. Clique em **"New project"**
4. Preencha:
   - **Name:** `barbearia-biehl` (ou qualquer nome)
   - **Database Password:** Crie uma senha forte e **ANOTE ela** (você vai precisar!)
   - **Region:** **South America (São Paulo)** ← importante para velocidade no Brasil
5. Clique em **"Create new project"** e aguarde ~2 minutos

### Pegando as URLs do banco de dados

1. No painel do Supabase, clique em ⚙️ **Project Settings** (canto esquerdo inferior)
2. Clique em **Database** no menu lateral
3. Role a página até **Connection string**
4. Selecione a aba **"Transaction"** e copie a URL — essa será sua `DATABASE_URL`
5. Selecione a aba **"Session"** e copie a URL — essa será sua `DIRECT_URL`

> 💡 As URLs serão parecidas com:
> `postgresql://postgres.xxxx:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
>
> **Substitua `[YOUR-PASSWORD]` pela senha que você criou!**

---

## PASSO 2 — Criar conta no Resend (e-mails)

**O Resend envia os e-mails de confirmação, lembrete e aniversário.**

1. Acesse: **resend.com** e clique em **"Sign Up"**
2. Crie uma conta com **GitHub** ou **e-mail**
3. No painel, clique em **"API Keys"** no menu lateral
4. Clique em **"Create API Key"**
5. Dê um nome (ex: `barbearia-biehl`) e clique em **"Add"**
6. **COPIE a chave** que aparecer (começa com `re_`) — ela só aparece uma vez!

### Verificar seu domínio de e-mail (opcional, mas recomendado)

Por padrão, você pode enviar e-mails usando `@resend.dev` (funciona para testes). Para usar seu próprio domínio (`@suabarbearia.com`):

1. No Resend, vá em **"Domains"** > **"Add Domain"**
2. Siga as instruções para adicionar registros DNS no seu provedor de domínio
3. Aguarde verificação (pode levar algumas horas)

Se não tiver domínio próprio, use o padrão do Resend por enquanto:
- `EMAIL_FROM="Barbearia Biehl <onboarding@resend.dev>"`

---

## PASSO 3 — Publicar no GitHub

**O Vercel vai buscar o código diretamente do GitHub.**

1. Crie uma conta em **github.com** (se não tiver)
2. Clique em **"New repository"**
3. Nome: `barbearia-biehl`
4. Deixe como **Public** e clique em **"Create repository"**
5. Siga as instruções que o GitHub mostrar para enviar o código

---

## PASSO 4 — Deploy no Vercel

**O Vercel pega o código do GitHub e publica automaticamente.**

1. Acesse: **vercel.com** e clique em **"Sign Up"**
2. Conecte com sua conta do **GitHub**
3. Clique em **"New Project"**
4. Encontre o repositório `barbearia-biehl` e clique em **"Import"**
5. Na página de configuração, **NÃO clique em Deploy ainda!**

### Configurar as variáveis de ambiente

Na seção **"Environment Variables"**, adicione uma por uma:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | Cole a URL "Transaction" do Supabase |
| `DIRECT_URL` | Cole a URL "Session" do Supabase |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` (você vai saber depois do 1º deploy) |
| `NEXTAUTH_SECRET` | Gere com: `openssl rand -base64 32` (veja abaixo) |
| `RESEND_API_KEY` | Cole a chave do Resend (começa com `re_`) |
| `EMAIL_FROM` | `Barbearia Biehl <onboarding@resend.dev>` |
| `NEXT_PUBLIC_NOME_BARBEARIA` | `Barbearia Biehl` |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` |

### Gerar o NEXTAUTH_SECRET

Você precisa de uma chave secreta aleatória. Use um destes métodos:

**Opção 1 (online):** Acesse `generate-secret.vercel.app` e copie o valor gerado.

**Opção 2 (terminal Mac/Linux):**
```bash
openssl rand -base64 32
```

**Opção 3 (manual):** Crie uma string aleatória de 32 caracteres misturando letras e números.

6. Após adicionar todas as variáveis, clique em **"Deploy"**
7. Aguarde ~3 minutos para o build terminar

---

## PASSO 5 — Criar as tabelas no banco de dados

**Agora vamos criar as tabelas onde os dados serão guardados.**

1. No painel do Vercel, após o deploy, vá em **"Functions"** ou use o **Vercel CLI**
2. **Método mais fácil:** No terminal do seu computador, execute:

```bash
# Instale as dependências
npm install

# Crie as tabelas no banco
npx prisma db push

# Popule com dados iniciais (barbeiros, serviços de exemplo)
npm run db:seed
```

> Se não tiver Node.js instalado, baixe em: **nodejs.org** → versão LTS

3. Após o seed, você verá as credenciais de acesso iniciais:
   - **Admin:** admin@barbeariabiehl.com / admin123
   - **Barbeiro:** joao@barbeariabiehl.com / barbeiro123
   - **Recepcionista:** recepcao@barbeariabiehl.com / recep123

---

## PASSO 6 — Atualizar a URL do sistema

Após o primeiro deploy, o Vercel dará uma URL como `barbearia-biehl-xyz.vercel.app`.

1. Copie essa URL
2. No Vercel, vá em **Settings** > **Environment Variables**
3. Atualize `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` com essa URL
4. Vá em **Deployments** e clique em **"Redeploy"** no deploy mais recente

---

## ✅ Sistema no ar!

Acesse sua URL do Vercel e faça login com as credenciais criadas no seed.

**Primeiro acesso — o que fazer:**

1. Faça login como Admin
2. Vá em **Configurações** e altere a senha dos usuários
3. Vá em **Barbeiros** e atualize os dados (nome, e-mail real, comissão)
4. Vá em **Serviços** e ajuste os serviços para a sua barbearia
5. Comece a cadastrar clientes e fazer agendamentos!

---

## 🔄 Atualizando o sistema

Toda vez que você alterar o código e enviar para o GitHub, o Vercel vai publicar automaticamente a nova versão em ~2 minutos.

---

## ❓ Problemas comuns

### "Error: Invalid database URL"
- Verifique se substituiu `[YOUR-PASSWORD]` pela senha real na DATABASE_URL
- Confira se não há espaços extras na URL

### "Error: NEXTAUTH_SECRET is required"
- Adicione a variável NEXTAUTH_SECRET no Vercel
- Faça um redeploy após adicionar

### E-mails não estão chegando
- Verifique se a RESEND_API_KEY está correta
- Certifique-se que o e-mail do cliente está cadastrado
- No plano gratuito do Resend, só é possível enviar para e-mails verificados durante os testes

### O calendário não carrega
- Verifique o console do navegador (F12 > Console)
- Verifique se o banco de dados está conectado

---

## 📞 Suporte

Dificuldades? Verifique:
- **Logs do Vercel:** seu-projeto.vercel.app > Deployments > seu deploy > Logs
- **Banco de dados:** supabase.com > seu projeto > Table Editor (veja se as tabelas foram criadas)

---

## 🔐 Segurança — Após o deploy

1. **Troque TODAS as senhas padrão** (admin123, barbeiro123, recep123)
2. **Nunca compartilhe** o arquivo `.env.local` ou as variáveis do Vercel
3. **Faça backup semanal** pelo painel Admin > Backup

---

*Barbearia Biehl — Sistema de Gestão v2.0*
