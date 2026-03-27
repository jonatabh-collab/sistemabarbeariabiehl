// Script de seed - Cria dados iniciais no banco de dados
// Execute com: npm run db:seed

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // ===================================
  // CRIAR USUÁRIO ADMIN INICIAL
  // ===================================
  const senhaHash = await bcrypt.hash('Admin@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbearia.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@barbearia.com',
      senhaHash,
      role: Role.ADMIN,
      ativo: true,
    },
  })

  console.log(`✅ Admin criado: ${admin.email}`)

  // ===================================
  // CRIAR BARBEIRO DE EXEMPLO
  // ===================================
  const senhaBarbeiro = await bcrypt.hash('Barbeiro@123', 12)

  const userBarbeiro = await prisma.user.upsert({
    where: { email: 'joao@barbearia.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'joao@barbearia.com',
      senhaHash: senhaBarbeiro,
      role: Role.BARBEIRO,
      ativo: true,
    },
  })

  // Criar perfil de barbeiro com horários de trabalho
  await prisma.barbeiro.upsert({
    where: { userId: userBarbeiro.id },
    update: {},
    create: {
      userId: userBarbeiro.id,
      especialidades: ['Corte Masculino', 'Barba', 'Degradê'],
      comissaoPercent: 40,
      // Horários: segunda a sábado, 9h às 18h (domingo folga)
      horarios: {
        '0': null, // domingo
        '1': { inicio: '09:00', fim: '18:00' }, // segunda
        '2': { inicio: '09:00', fim: '18:00' }, // terça
        '3': { inicio: '09:00', fim: '18:00' }, // quarta
        '4': { inicio: '09:00', fim: '18:00' }, // quinta
        '5': { inicio: '09:00', fim: '18:00' }, // sexta
        '6': { inicio: '09:00', fim: '16:00' }, // sábado
      },
      ativo: true,
    },
  })

  console.log(`✅ Barbeiro criado: ${userBarbeiro.email}`)

  // ===================================
  // CRIAR SERVIÇOS PADRÃO
  // ===================================
  const servicos = [
    { nome: 'Corte Masculino', descricao: 'Corte de cabelo masculino clássico ou moderno', preco: 45, duracaoMinutos: 30 },
    { nome: 'Barba', descricao: 'Modelagem e hidratação de barba', preco: 35, duracaoMinutos: 25 },
    { nome: 'Combo Corte + Barba', descricao: 'Corte de cabelo + barba completa', preco: 70, duracaoMinutos: 50 },
    { nome: 'Hidratação Capilar', descricao: 'Tratamento de hidratação profunda para os cabelos', preco: 55, duracaoMinutos: 40 },
    { nome: 'Pigmentação de Barba', descricao: 'Coloração e pigmentação para barba', preco: 50, duracaoMinutos: 35 },
    { nome: 'Sobrancelha', descricao: 'Design e modelagem de sobrancelha masculina', preco: 20, duracaoMinutos: 15 },
  ]

  for (const servico of servicos) {
    await prisma.servico.upsert({
      where: { id: servico.nome.toLowerCase().replace(/ /g, '_') },
      update: {},
      create: {
        id: servico.nome.toLowerCase().replace(/ /g, '_'),
        ...servico,
        ativo: true,
      },
    })
  }

  console.log(`✅ ${servicos.length} serviços criados`)

  // ===================================
  // CRIAR CONFIGURAÇÕES PADRÃO
  // ===================================
  const configuracoes = [
    { chave: 'nome_barbearia', valor: 'Barbearia Biehl' },
    { chave: 'telefone', valor: '(51) 99999-9999' },
    { chave: 'endereco', valor: 'Rua Principal, 123 - Centro' },
    { chave: 'horario_abertura', valor: '09:00' },
    { chave: 'horario_fechamento', valor: '18:00' },
    { chave: 'dias_funcionamento', valor: '1,2,3,4,5,6' }, // segunda a sábado
    { chave: 'intervalo_agendamento', valor: '30' }, // minutos entre agendamentos
  ]

  for (const config of configuracoes) {
    await prisma.configuracao.upsert({
      where: { chave: config.chave },
      update: {},
      create: config,
    })
  }

  console.log(`✅ ${configuracoes.length} configurações criadas`)

  // ===================================
  // CRIAR CLIENTE DE EXEMPLO
  // ===================================
  await prisma.cliente.upsert({
    where: { id: 'cliente_exemplo' },
    update: {},
    create: {
      id: 'cliente_exemplo',
      nome: 'Carlos Oliveira',
      email: 'carlos@exemplo.com',
      telefone: '(51) 98765-4321',
      observacoes: 'Cliente fiel desde a abertura. Prefere corte degradê.',
    },
  })

  console.log('✅ Cliente de exemplo criado')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 DADOS DE ACESSO:')
  console.log('   Admin:    admin@barbearia.com / Admin@123')
  console.log('   Barbeiro: joao@barbearia.com / Barbeiro@123')
  console.log('\n⚠️  IMPORTANTE: Troque as senhas após o primeiro acesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
