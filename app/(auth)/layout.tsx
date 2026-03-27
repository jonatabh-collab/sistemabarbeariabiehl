// Layout das páginas de autenticação
import { Providers } from '../providers'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
    </Providers>
  )
}
