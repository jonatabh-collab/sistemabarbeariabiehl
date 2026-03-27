'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Wrench,
  DollarSign,
  Database,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BARBEIRO', 'RECEPCIONISTA'] },
  { href: '/agendamentos', label: 'Agendamentos', icon: Calendar, roles: ['ADMIN', 'BARBEIRO', 'RECEPCIONISTA'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN', 'BARBEIRO', 'RECEPCIONISTA'] },
  { href: '/barbeiros', label: 'Barbeiros', icon: UserCheck, roles: ['ADMIN', 'RECEPCIONISTA'] },
  { href: '/servicos', label: 'Serviços', icon: Wrench, roles: ['ADMIN', 'RECEPCIONISTA'] },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign, roles: ['ADMIN', 'BARBEIRO'] },
  { href: '/backup', label: 'Backup', icon: Database, roles: ['ADMIN'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['ADMIN'] },
]

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Scissors size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">
            {process.env.NEXT_PUBLIC_NOME_BARBEARIA || 'Barbearia Biehl'}
          </p>
          <p className="text-gray-400 text-xs">Gestão</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Role badge */}
      <div className="px-4 py-3 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-center">
          <p className="text-gray-400 text-xs">
            {role === 'ADMIN' && '👑 Administrador'}
            {role === 'BARBEIRO' && '✂️ Barbeiro'}
            {role === 'RECEPCIONISTA' && '📋 Recepcionista'}
          </p>
        </div>
      </div>
    </aside>
  )
}
