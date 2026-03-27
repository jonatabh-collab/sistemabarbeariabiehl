export type Role = 'ADMIN' | 'BARBEIRO' | 'RECEPCIONISTA'

export type StatusAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  ativo: boolean
  createdAt: string
  barbeiro?: Barbeiro | null
}

export interface Cliente {
  id: string
  nome: string
  email?: string | null
  telefone: string
  dataNascimento?: string | null
  observacoes?: string | null
  ativo: boolean
  createdAt: string
  _count?: { agendamentos: number }
}

export interface Barbeiro {
  id: string
  userId: string
  comissao: number
  especialidades: string[]
  ativo: boolean
  user: {
    id: string
    name: string
    email: string
  }
}

export interface Servico {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  duracao: number
  ativo: boolean
}

export interface AgendamentoServico {
  id: string
  servicoId: string
  preco: number
  servico: Servico
}

export interface Agendamento {
  id: string
  clienteId: string
  barbeiroId: string
  dataHora: string
  status: StatusAgendamento
  observacoes?: string | null
  lembreteEnviado: boolean
  createdAt: string
  cliente: Cliente
  barbeiro: Barbeiro
  servicos: AgendamentoServico[]
  financeiro?: Financeiro | null
}

export interface Financeiro {
  id: string
  agendamentoId: string
  valorTotal: number
  comissaoPct: number
  valorBarbeiro: number
  valorBarbearia: number
  formaPagamento?: string | null
  pago: boolean
  dataPagamento?: string | null
  observacoes?: string | null
}

export interface DashboardStats {
  totalAgendamentosHoje: number
  receitaHoje: number
  receitaMes: number
  totalClientes: number
  agendamentosPendentes: number
  taxaOcupacao: number
}
