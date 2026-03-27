// Layout raiz da aplicação
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Barbearia Biehl - Sistema de Gestão',
  description: 'Sistema completo de gestão para a Barbearia Biehl',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#1a1a1a] text-[#f5f0e8] antialiased">
        {children}
      </body>
    </html>
  )
}
