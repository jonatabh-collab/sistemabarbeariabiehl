'use client'
// Sidebar de navegação do dashboard
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  UserCircle,
  DollarSign,
  Settings,
  Shield,
  Database,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/permissions'
import { Role } from '@prisma/client'

// Itens de navegação do menu
const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.BARBEIRO, Role.RECEPCIONISTA],
  },
  {
    href: '/dashboard/agendamentos',
    label: 'Agendamentos',
    icon: Calendar,
    roles: [Role.ADMIN, Role.BARBEIRO, Role.RECEPCIONISTA],
  },
  {
    href: '/dashboard/clientes',
    label: 'Clientes',
    icon: Users,
    roles: [Role.ADMIN, Role.BARBEIRO, Role.RECEPCIONISTA],
  },
  {
    href: '/dashboard/servicos',
    label: 'Serviços',
    icon: Scissors,
    roles: [Role.ADMIN, Role.BARBEIRO, Role.RECEPCIONISTA],
  },
  {
    href: '/dashboard/barbeiros',
    label: 'Barbeiros',
    icon: UserCircle,
    roles: [Role.ADMIN, Role.RECEPCIONISTA],
  },
  {
    href: '/dashboard/financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    roles: [Role.ADMIN], // Somente admin
  },
]

// Itens do menu administrativo
const adminItems = [
  {
    href: '/dashboard/admin/usuarios',
    label: 'Usuários',
    icon: Shield,
    roles: [Role.ADMIN],
  },
  {
    href: '/dashboard/admin/configuracoes',
    label: 'Configurações',
    icon: Settings,
    roles: [Role.ADMIN],
  },
  {
    href: '/dashboard/admin/backup',
    label: 'Backup',
    icon: Database,
    roles: [Role.ADMIN],
  },
]

// Logo SVG embutido
function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="20" r="5" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <circle cx="12" cy="36" r="5" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <line x1="16" y1="17" x2="38" y2="8" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="39" x2="38" y2="48" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="25" x2="12" y2="31" stroke="#c9a84c" strokeWidth="2" />
      <rect x="36" y="22" width="18" height="14" rx="3" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <line x1="36" y1="29" x2="54" y2="29" stroke="#c9a84c" strokeWidth="1.5" />
      <rect x="50" y="24" width="6" height="3" rx="1" fill="#c9a84c" fillOpacity="0.5" />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const userRole = session?.user?.role as Role

  // Filtrar itens que o usuário tem acesso
  const menuVisiveis = menuItems.filter(item => item.roles.includes(userRole))
  const adminVisiveis = adminItems.filter(item => item.roles.includes(userRole))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo e nome */}
      <div className="px-4 py-5 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <div>
            <h2 className="text-sm font-serif font-bold text-[#c9a84c] leading-tight">
              Barbearia Biehl
            </h2>
            <p className="text-xs text-[#666]">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuVisiveis.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-[#c9a84c]/15 text-[#c9a84c] font-medium border border-[#c9a84c]/20'
                      : 'text-[#aaa] hover:text-[#f5f0e8] hover:bg-[#333]'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#c9a84c]' : '')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Seção Admin */}
        {adminVisiveis.length > 0 && (
          <div className="mt-6">
            <p className="px-3 text-xs font-semibold text-[#555] uppercase tracking-wider mb-2">
              Administração
            </p>
            <ul className="space-y-1">
              {adminVisiveis.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                        isActive
                          ? 'bg-[#c9a84c]/15 text-[#c9a84c] font-medium border border-[#c9a84c]/20'
                          : 'text-[#aaa] hover:text-[#f5f0e8] hover:bg-[#333]'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isActive ? 'text-[#c9a84c]' : '')} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Usuário logado e logout */}
      <div className="px-3 py-4 border-t border-[#333]">
        {session?.user && (
          <div className="mb-3 px-3 py-2 bg-[#222] rounded-lg">
            <p className="text-sm font-medium text-[#f5f0e8] truncate">{session.user.name}</p>
            <p className="text-xs text-[#c9a84c]">
              {ROLE_LABELS[userRole] || userRole}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Botão para abrir menu mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#222] border border-[#333] rounded-lg p-2 text-[#c9a84c]"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 w-64 bg-[#1e1e1e] border-r border-[#333] transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0 bg-[#1e1e1e] border-r border-[#333] flex-col">
        <SidebarContent />
      </aside>
    </>
  )
}
