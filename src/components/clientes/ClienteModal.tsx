'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { Cliente } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().min(10, 'Telefone inválido'),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  cliente?: Cliente | null
  onClose: () => void
  onSuccess: () => void
}

export function ClienteModal({ cliente, onClose, onSuccess }: Props) {
  const isEdit = !!cliente

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: cliente?.nome || '',
      email: cliente?.email || '',
      telefone: cliente?.telefone || '',
      dataNascimento: cliente?.dataNascimento ? cliente.dataNascimento.split('T')[0] : '',
      observacoes: cliente?.observacoes || '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEdit ? `/api/clientes/${cliente.id}` : '/api/clientes'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar cliente')
      }

      toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente criado!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar Cliente' : 'Novo Cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Nome *</label>
          <input
            {...register('nome')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Nome completo"
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Telefone *</label>
            <input
              {...register('telefone')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="(51) 99999-9999"
            />
            {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Data de Nascimento</label>
            <input
              {...register('dataNascimento')}
              type="date"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">E-mail</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="cliente@email.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Observações</label>
          <textarea
            {...register('observacoes')}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder="Preferências, alergias, etc."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
