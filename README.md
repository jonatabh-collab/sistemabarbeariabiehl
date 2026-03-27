# Sistema Barbearia Biehl

Sistema completo de gestão para barbearia com app de gestão (admin) e app do cliente.

## Estrutura

```
├── backend/     # API REST (Node.js + Express + SQLite)
├── admin/       # App de gestão (React + Tailwind)
└── client/      # App do cliente (React + Tailwind)
```

## Instalação

```bash
# Instalar todas as dependências
npm run install:all
```

## Executar

```bash
# Rodar os 3 apps simultaneamente
npm run dev

# Ou individualmente:
npm run backend   # API: http://localhost:3001
npm run admin     # Admin: http://localhost:5173
npm run client    # Cliente: http://localhost:5174
```

## Acesso

### App de Gestão (Admin)
- URL: http://localhost:5173
- Email: `admin@barbeariabiehl.com`
- Senha: `admin123`

### App do Cliente
- URL: http://localhost:5174
- Login com telefone (ex: `(51) 98765-0001` para clientes já cadastrados)

## Funcionalidades

### App Admin
- **Agenda**: calendário multi-profissionais (dia/semana), bloqueio de horários, encaixe, lista de espera
- **Clientes**: cadastro, busca, histórico de atendimentos
- **Profissionais**: cadastro com cor personalizada
- **Serviços**: preços, duração, categorias
- **Comandas**: abertura e fechamento de ordens de serviço
- **Financeiro**: receitas, despesas, formas de pagamento
- **Relatórios**: KPIs, breakdown por forma de pagamento
- **Configurações**: horários, aparência, notificações

### App Cliente
- **Home**: serviços, combos e pacotes em destaque
- **Agendamento**: fluxo completo (serviço → profissional → data/hora → confirmação)
- **Combos**: comprar combos de serviços com desconto
- **Pacotes**: comprar pacotes de sessões pré-pagas
- **Meus Agendamentos**: histórico e próximos, cancelamento online
