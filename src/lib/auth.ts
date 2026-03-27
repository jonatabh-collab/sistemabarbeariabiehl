import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-mail e senha são obrigatórios')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { barbeiro: true },
        })

        if (!user) {
          throw new Error('Credenciais inválidas')
        }

        if (!user.ativo) {
          throw new Error('Usuário inativo. Contate o administrador.')
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.password)
        if (!passwordValid) {
          throw new Error('Credenciais inválidas')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          barbeiroId: user.barbeiro?.id ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.barbeiroId = (user as any).barbeiroId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.barbeiroId = token.barbeiroId as string | null
      }
      return session
    },
  },
}
