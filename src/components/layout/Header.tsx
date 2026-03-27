'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User, Bell } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/utils'

interface Props {
  user: { name: string; email: string; role: string }
}

export function Header({ user }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-sm text-gray-500">
          Bem-vindo, <span className="font-semibold text-gray-900">{user.name}</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Perfil */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
          <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
        </div>

        {/* Sair */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-sm"
          title="Sair"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
