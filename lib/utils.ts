// Utilitários gerais da aplicação
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combinar classes do Tailwind de forma inteligente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar valor monetário em reais
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

// Formatar data em português
export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

// Formatar data e hora em português
export function formatarDataHora(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

// Formatar hora
export function formatarHora(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

// Mapear status do agendamento para label e cor
export const STATUS_AGENDAMENTO = {
  AGENDADO: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  CONCLUIDO: { label: 'Concluído', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  FALTOU: { label: 'Faltou', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
} as const

// Dias da semana em português
export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Gerar horários disponíveis
export function gerarHorarios(inicio: string, fim: string, intervaloMinutos: number = 30): string[] {
  const horarios: string[] = []
  const [hInicio, mInicio] = inicio.split(':').map(Number)
  const [hFim, mFim] = fim.split(':').map(Number)

  let totalMinutosAtual = hInicio * 60 + mInicio
  const totalMinutosFim = hFim * 60 + mFim

  while (totalMinutosAtual < totalMinutosFim) {
    const h = Math.floor(totalMinutosAtual / 60).toString().padStart(2, '0')
    const m = (totalMinutosAtual % 60).toString().padStart(2, '0')
    horarios.push(`${h}:${m}`)
    totalMinutosAtual += intervaloMinutos
  }

  return horarios
}
