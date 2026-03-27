// Configuração do NextAuth.js
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

// Extensão dos tipos do NextAuth para incluir campos customizados
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}

export const authOptions: NextAuthOptions = {
  // Estratégia JWT para sessões
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // Página de login customizada
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        // Validação básica dos campos
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-mail e senha são obrigatórios')
        }

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('E-mail ou senha incorretos')
        }

        // Verificar se o usuário está ativo
        if (!user.ativo) {
          throw new Error('Usuário desativado. Entre em contato com o administrador.')
        }

        // Verificar senha
        const senhaCorreta = await bcrypt.compare(credentials.password, user.senhaHash)

        if (!senhaCorreta) {
          throw new Error('E-mail ou senha incorretos')
        }

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    // Adicionar dados customizados ao JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    // Adicionar dados do JWT à sessão
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}
