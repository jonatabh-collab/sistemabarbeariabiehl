'use client'
// Página de login da Barbearia Biehl
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Scissors } from 'lucide-react'

// Schema de validação do formulário de login
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

// Logo SVG da barbearia (tesoura + navalha)
function LogoBarbearia() {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Tesoura */}
      <circle cx="12" cy="20" r="5" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <circle cx="12" cy="36" r="5" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <line x1="16" y1="17" x2="38" y2="8" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="39" x2="38" y2="48" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="25" x2="12" y2="31" stroke="#c9a84c" strokeWidth="2" />
      {/* Navalha */}
      <rect x="36" y="22" width="18" height="14" rx="3" stroke="#c9a84c" strokeWidth="2" fill="none" />
      <line x1="36" y1="29" x2="54" y2="29" stroke="#c9a84c" strokeWidth="1.5" />
      <rect x="50" y="24" width="6" height="3" rx="1" fill="#c9a84c" fillOpacity="0.5" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.')
        return
      }

      // Redirecionar para o dashboard após login bem-sucedido
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#c9a84c]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#c9a84c]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card de login */}
        <div className="bg-[#222222] border border-[#333] rounded-2xl p-8 shadow-2xl">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <LogoBarbearia />
            <h1 className="mt-4 text-3xl font-serif font-bold text-[#c9a84c]">
              Barbearia Biehl
            </h1>
            <p className="mt-1 text-sm text-[#888]">
              Sistema de Gestão
            </p>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Campo e-mail */}
            <div>
              <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Campo senha */}
            <div>
              <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] transition-colors"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Botão de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1a1a] font-semibold rounded-lg py-3 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Rodapé */}
          <p className="mt-6 text-center text-xs text-[#555]">
            Barbearia Biehl © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
