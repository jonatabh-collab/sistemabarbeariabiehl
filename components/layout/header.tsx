'use client'
// Header do dashboard
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useSession } from 'next-auth/react'

// Mapear rotas para títulos de página
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/agendamentos': 'Agendamentos',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/servicos': 'Serviços',
  '/dashboard/barbeiros': 'Barbeiros',
  '/dashboard/financeiro': 'Financeiro',
  '/dashboard/admin/usuarios': 'Gerenciar Usuários',
  '/dashboard/admin/configuracoes': 'Configurações do Sistema',
  '/dashboard/admin/backup': 'Backup e Restore',
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const pageTitle = PAGE_TITLES[pathname] || 'Barbearia Biehl'

  // Saudação baseada no horário
  const hora = new Date().getHours()
  let saudacao = 'Boa noite'
  if (hora >= 5 && hora < 12) saudacao = 'Bom dia'
  else if (hora >= 12 && hora < 18) saudacao = 'Boa tarde'

  return (
    <header className="h-16 bg-[#1e1e1e] border-b border-[#333] px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Título da página */}
      <div className="flex items-center gap-3 ml-12 md:ml-0">
        <div>
          <h1 className="text-lg font-serif font-semibold text-[#f5f0e8]">{pageTitle}</h1>
        </div>
      </div>

      {/* Lado direito: saudação + notificações */}
      <div className="flex items-center gap-3">
        {/* Saudação (apenas desktop) */}
        <p className="hidden md:block text-sm text-[#888]">
          {saudacao},{' '}
          <span className="text-[#c9a84c] font-medium">
            {session?.user?.name?.split(' ')[0]}
          </span>
        </p>

        {/* Divider */}
        <div className="hidden md:block w-px h-5 bg-[#333]" />

        {/* Data de hoje */}
        <span className="hidden md:block text-xs text-[#555]">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </header>
  )
}
