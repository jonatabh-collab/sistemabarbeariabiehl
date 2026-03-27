'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { Servico } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  descricao: z.string().optional(),
  preco: z.number().positive('Preço deve ser positivo'),
  duracao: z.number().int().positive('Duração em minutos'),
})

type FormData = z.infer<typeof schema>

interface Props {
  servico?: Servico | null
  onClose: () => void
  onSuccess: () => void
}

export function ServicoModal({ servico, onClose, onSuccess }: Props) {
  const isEdit = !!servico

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: servico?.nome || '',
      descricao: servico?.descricao || '',
      preco: servico?.preco || 0,
      duracao: servico?.duracao || 30,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const url = isEdit ? `/api/servicos/${servico.id}` : '/api/servicos'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar serviço')
      }

      toast.success(isEdit ? 'Serviço atualizado!' : 'Serviço criado!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar Serviço' : 'Novo Serviço'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Nome *</label>
          <input
            {...register('nome')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Ex: Corte + Barba"
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
          <textarea
            {...register('descricao')}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder="Descrição do serviço (opcional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Preço (R$) *</label>
            <input
              {...register('preco', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="0,00"
            />
            {errors.preco && <p className="text-red-500 text-xs mt-1">{errors.preco.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duração (min) *</label>
            <input
              {...register('duracao', { valueAsNumber: true })}
              type="number"
              min="5"
              step="5"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="30"
            />
            {errors.duracao && <p className="text-red-500 text-xs mt-1">{errors.duracao.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar Serviço'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
