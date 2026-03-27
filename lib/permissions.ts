// Sistema de permissões baseado em roles
// ADMIN > BARBEIRO > RECEPCIONISTA

import { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'

// Hierarquia de permissões
export const PERMISSIONS = {
  // Acesso total ao sistema
  ADMIN: [Role.ADMIN],
  // Pode gerenciar agendamentos, clientes, serviços e ver próprias comissões
  BARBEIRO: [Role.ADMIN, Role.BARBEIRO],
  // Pode gerenciar agendamentos e clientes (sem financeiro e admin)
  RECEPCIONISTA: [Role.ADMIN, Role.BARBEIRO, Role.RECEPCIONISTA],
} as const

// Verifica se o usuário tem a permissão necessária
export function temPermissao(userRole: Role, rolesPermitidas: Role[]): boolean {
  return rolesPermitidas.includes(userRole)
}

// Middleware helper para rotas de API - verifica autenticação
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Não autenticado. Faça login para continuar.' },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

// Middleware helper para rotas que requerem role específica
export async function requireRole(rolesPermitidas: Role[]) {
  const { error, session } = await requireAuth()

  if (error || !session) {
    return { error, session: null }
  }

  if (!temPermissao(session.user.role, rolesPermitidas)) {
    return {
      error: NextResponse.json(
        { error: 'Acesso negado. Você não tem permissão para esta ação.' },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}

// Verifica se é admin
export async function requireAdmin() {
  return requireRole([Role.ADMIN])
}

// Labels amigáveis para os roles
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  BARBEIRO: 'Barbeiro',
  RECEPCIONISTA: 'Recepcionista',
}

// Cores para badges de role
export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  BARBEIRO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  RECEPCIONISTA: 'bg-green-500/20 text-green-400 border-green-500/30',
}
