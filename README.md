# ✂ Sistema de Gestão — Barbearia Biehl

Sistema completo de gestão para barbearia construído com Next.js 14, PostgreSQL (Supabase) e hospedagem na Vercel.

## Stack Tecnológica

- **Framework**: Next.js 14 com App Router e TypeScript
- **Banco de dados**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Autenticação**: NextAuth.js (email + senha)
- **Estilização**: Tailwind CSS
- **E-mail**: Resend
- **Deploy**: Vercel

## Funcionalidades

### Agendamentos
- Criar, editar e cancelar agendamentos
- Filtro por data, status e cliente
- Status: Agendado, Em Andamento, Concluído, Cancelado, Faltou
- E-mail automático de confirmação para o cliente

### Clientes
- Cadastro completo com histórico de visitas
- Preferências (barbeiro favorito, produtos)
- E-mail de feliz aniversário automático

### Serviços
- Cadastro com nome, preço e duração
- Ativação/desativação

### Barbeiros
- Cadastro com especialidades e comissão (%)
- Horários de trabalho por dia da semana
- Relatório de atendimentos e comissões

### Financeiro (somente Admin)
- Receitas automáticas por agendamento
- Despesas com categorias
- Relatório por período
- Exportação CSV

### Administração
- Gerenciamento de usuários (3 níveis de acesso)
- Configurações do sistema
- Backup e restore via JSON

## Níveis de Acesso

| Nível | Acesso |
|-------|--------|
| Admin | Tudo, incluindo financeiro e configurações |
| Barbeiro | Agenda própria, clientes, serviços |
| Recepcionista | Agendamentos de todos, clientes |

## Rodando Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com seus dados

# 3. Criar tabelas no banco de dados
npx prisma migrate dev

# 4. Popular dados iniciais
npm run db:seed

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### Login inicial
- **E-mail**: admin@barbearia.com
- **Senha**: Admin@123

> Troque a senha após o primeiro acesso!

## Deploy

Consulte o arquivo **GUIA-DEPLOY.md** para instruções detalhadas de publicação online.

---

*Desenvolvido com Next.js 14 - Barbearia Biehl*
