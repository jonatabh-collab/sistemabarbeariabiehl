# Guia de Deploy — Barbearia Biehl

> **Para quem é este guia?** Para você que não é desenvolvedor e quer colocar o sistema online!
> Siga os passos na ordem. Se tiver dúvidas, cada etapa tem explicações simples.

---

## O que você vai precisar

- Uma conta no GitHub (gratuita) — onde fica o código
- Uma conta na Vercel (gratuita) — onde o sistema vai rodar online
- Uma conta no Supabase (gratuita) — onde ficam os dados
- Uma conta no Resend (gratuita) — para envio de e-mails

---

## Passo 1 — Subir o código para o GitHub

O GitHub é como um "Google Drive para código". Vamos enviar o sistema para lá.

### 1.1 Criar conta no GitHub
1. Acesse **https://github.com**
2. Clique em **"Sign up"** e crie sua conta

### 1.2 Criar um repositório
1. Após fazer login, clique no **"+"** no canto superior direito
2. Selecione **"New repository"**
3. Nome do repositório: `sistema-barbearia-biehl`
4. Deixe como **"Private"** (privado)
5. Clique em **"Create repository"**

### 1.3 Enviar o código
O Claude Code vai fornecer os comandos necessários. Em geral serão:

```bash
git init
git add .
git commit -m "Sistema completo de gestão"
git remote add origin https://github.com/SEU_USUARIO/sistema-barbearia-biehl.git
git push -u origin main
```

---

## Passo 2 — Configurar o Banco de Dados (Supabase)

O Supabase é onde os dados dos clientes, agendamentos, etc., ficam armazenados.

1. Acesse **https://supabase.com** e clique em **"Start for free"**
2. Crie conta com GitHub ou e-mail
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: barbearia-biehl
   - **Database Password**: crie uma senha forte (anote ela!)
   - **Region**: South America (São Paulo)
5. Aguarde ~2 minutos enquanto cria o banco
6. Vá em **Settings > Database**
7. Na seção **"Connection string"**, copie a **URI** (começa com `postgresql://`)
8. Substitua `[YOUR-PASSWORD]` pela senha que você criou

---

## Passo 3 — Configurar o E-mail (Resend)

1. Acesse **https://resend.com** e crie sua conta
2. Vá em **"API Keys"** e clique em **"Create API Key"**
3. Dê um nome (ex: "Barbearia Biehl") e clique em **"Add"**
4. **COPIE a chave** (começa com `re_...`) — ela só aparece uma vez!

---

## Passo 4 — Publicar na Vercel

A Vercel é onde o sistema vai funcionar na internet, 24 horas por dia.

### 4.1 Criar conta na Vercel
1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** — isso conecta automaticamente!

### 4.2 Importar o projeto
1. No painel da Vercel, clique em **"Add New..."** → **"Project"**
2. Encontre o repositório `sistema-barbearia-biehl` e clique em **"Import"**

### 4.3 Configurar as variáveis de ambiente
Antes de clicar em Deploy, você precisa configurar as senhas e chaves.
Clique em **"Environment Variables"** e adicione uma por uma:

| Nome | Valor | Como obter |
|------|-------|------------|
| `DATABASE_URL` | `postgresql://postgres:...` | Do Supabase (Passo 2) |
| `NEXTAUTH_SECRET` | Uma chave aleatória forte | Veja abaixo |
| `NEXTAUTH_URL` | `https://seu-projeto.vercel.app` | URL do seu site na Vercel |
| `RESEND_API_KEY` | `re_...` | Do Resend (Passo 3) |
| `EMAIL_FROM` | `noreply@resend.dev` | Padrão para plano gratuito |
| `CRON_SECRET` | Uma chave aleatória | Veja abaixo |

**Para gerar chaves aleatórias** (`NEXTAUTH_SECRET` e `CRON_SECRET`):
- Acesse **https://generate-secret.vercel.app/32**
- Copie o valor gerado

### 4.4 Fazer o deploy
1. Clique em **"Deploy"**
2. Aguarde alguns minutos
3. Quando aparecer "Congratulations!", seu site está no ar! 🎉

---

## Passo 5 — Configurar o Banco de Dados (Migrations)

Agora precisamos criar as tabelas no banco de dados.

### 5.1 Instalar Vercel CLI
No terminal do seu computador:
```bash
npm install -g vercel
vercel login
```

### 5.2 Rodar as migrations
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 5.3 Criar o primeiro usuário Admin
```bash
npm run db:seed
```

---

## Passo 6 — Primeiro acesso

1. Acesse a URL do seu site (ex: `https://barbearia-biehl.vercel.app`)
2. Faça login com:
   - **E-mail**: `admin@barbearia.com`
   - **Senha**: `Admin@123`
3. **IMPORTANTE**: Vá em Configurações e troque a senha imediatamente!

---

## Passo 7 — Configurar o sistema

Após fazer login:
1. Vá em **Configurações** e preencha os dados da barbearia
2. Vá em **Barbeiros** e cadastre os barbeiros
3. Vá em **Serviços** e ajuste os serviços e preços
4. Vá em **Usuários** e crie logins para a equipe

---

## Atualizar o sistema

Quando houver atualizações do sistema:
1. O Claude Code vai gerar os novos arquivos
2. Você sobe para o GitHub com `git push`
3. A Vercel atualiza automaticamente! ✨

---

## Precisa de ajuda?

Se algo não funcionar, verifique:
- Se as variáveis de ambiente estão corretas na Vercel
- Se a string de conexão do banco de dados está correta
- Os logs de erro em: Vercel → seu projeto → "Deployments" → clique no deploy → "Functions"

---

*Sistema desenvolvido para a Barbearia Biehl | Next.js 14 + PostgreSQL + Vercel*
