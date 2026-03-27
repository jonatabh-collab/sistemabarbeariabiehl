import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@barbeariabiehl.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@barbeariabiehl.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })
  console.log('✅ Admin criado:', admin.email)

  // Barbeiro 1
  const barbeiro1Password = await bcrypt.hash('barbeiro123', 12)
  const barbeiro1User = await prisma.user.upsert({
    where: { email: 'joao@barbeariabiehl.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'joao@barbeariabiehl.com',
      password: barbeiro1Password,
      role: Role.BARBEIRO,
    },
  })
  const barbeiro1 = await prisma.barbeiro.upsert({
    where: { userId: barbeiro1User.id },
    update: {},
    create: {
      userId: barbeiro1User.id,
      comissao: 50,
      especialidades: ['Corte clássico', 'Barba', 'Degradê'],
    },
  })
  console.log('✅ Barbeiro criado:', barbeiro1User.name)

  // Barbeiro 2
  const barbeiro2Password = await bcrypt.hash('barbeiro123', 12)
  const barbeiro2User = await prisma.user.upsert({
    where: { email: 'pedro@barbeariabiehl.com' },
    update: {},
    create: {
      name: 'Pedro Oliveira',
      email: 'pedro@barbeariabiehl.com',
      password: barbeiro2Password,
      role: Role.BARBEIRO,
    },
  })
  await prisma.barbeiro.upsert({
    where: { userId: barbeiro2User.id },
    update: {},
    create: {
      userId: barbeiro2User.id,
      comissao: 55,
      especialidades: ['Corte moderno', 'Pigmentação', 'Relaxamento'],
    },
  })
  console.log('✅ Barbeiro criado:', barbeiro2User.name)

  // Recepcionista
  const recepPassword = await bcrypt.hash('recep123', 12)
  const recep = await prisma.user.upsert({
    where: { email: 'recepcao@barbeariabiehl.com' },
    update: {},
    create: {
      name: 'Ana Recepção',
      email: 'recepcao@barbeariabiehl.com',
      password: recepPassword,
      role: Role.RECEPCIONISTA,
    },
  })
  console.log('✅ Recepcionista criada:', recep.email)

  // Serviços
  const servicos = [
    { nome: 'Corte Simples', descricao: 'Corte de cabelo tradicional', preco: 35, duracao: 30 },
    { nome: 'Corte + Barba', descricao: 'Corte de cabelo e barba completa', preco: 60, duracao: 60 },
    { nome: 'Barba', descricao: 'Aparar e fazer a barba', preco: 30, duracao: 30 },
    { nome: 'Degradê', descricao: 'Corte degradê moderno', preco: 45, duracao: 45 },
    { nome: 'Pigmentação', descricao: 'Pigmentação de cabelo ou barba', preco: 80, duracao: 60 },
    { nome: 'Hidratação', descricao: 'Hidratação capilar completa', preco: 50, duracao: 45 },
    { nome: 'Sobrancelha', descricao: 'Design de sobrancelha masculina', preco: 20, duracao: 15 },
    { nome: 'Pacote VIP', descricao: 'Corte + Barba + Sobrancelha + Hidratação', preco: 150, duracao: 120 },
  ]

  for (const servico of servicos) {
    await prisma.servico.upsert({
      where: { nome: servico.nome } as any,
      update: {},
      create: servico,
    })
  }
  console.log('✅ Serviços criados:', servicos.length)

  // Clientes de exemplo
  const clientes = [
    { nome: 'Carlos Souza', email: 'carlos@email.com', telefone: '(51) 99999-1111', dataNascimento: new Date('1990-05-15') },
    { nome: 'Marcelo Lima', email: 'marcelo@email.com', telefone: '(51) 99999-2222', dataNascimento: new Date('1985-08-22') },
    { nome: 'Ricardo Santos', email: 'ricardo@email.com', telefone: '(51) 99999-3333', dataNascimento: new Date('1995-03-10') },
    { nome: 'Fernando Costa', telefone: '(51) 99999-4444' },
    { nome: 'Rodrigo Alves', email: 'rodrigo@email.com', telefone: '(51) 99999-5555', dataNascimento: new Date('1988-12-01') },
  ]

  for (const cliente of clientes) {
    const existing = await prisma.cliente.findFirst({ where: { telefone: cliente.telefone } })
    if (!existing) {
      await prisma.cliente.create({ data: cliente })
    }
  }
  console.log('✅ Clientes criados:', clientes.length)

  console.log('\n🎉 Seed concluído com sucesso!\n')
  console.log('═══════════════════════════════════════')
  console.log('CREDENCIAIS DE ACESSO:')
  console.log('Admin:          admin@barbeariabiehl.com   / admin123')
  console.log('Barbeiro:       joao@barbeariabiehl.com    / barbeiro123')
  console.log('Recepcionista:  recepcao@barbeariabiehl.com / recep123')
  console.log('═══════════════════════════════════════\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
