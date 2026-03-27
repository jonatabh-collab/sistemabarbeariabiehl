// Layout do dashboard — sidebar + header + área de conteúdo
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Providers } from '../providers'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar se o usuário está autenticado no servidor
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <Providers>
      <div className="flex h-screen bg-[#1a1a1a] overflow-hidden">
        {/* Sidebar lateral */}
        <Sidebar />

        {/* Área principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Conteúdo da página */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
