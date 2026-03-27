'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, X, Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { Barbeiro } from '@/types'

const createSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  comissao: z.number().min(0).max(100),
})

const editSchema = z.object({
  nome: z.string().min(2),
  comissao: z.number().min(0).max(100),
  ativo: z.boolean(),
})

interface Props {
  barbeiro?: Barbeiro | null
  onClose: () => void
  onSuccess: () => void
}

export function BarbeiroModal({ barbeiro, onClose, onSuccess }: Props) {
  const isEdit = !!barbeiro
  const [especialidades, setEspecialidades] = useState<string[]>(barbeiro?.especialidades || [])
  const [novaEsp, setNovaEsp] = useState('')

  const schema = isEdit ? editSchema : createSchema

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { nome: barbeiro.user.name, comissao: barbeiro.comissao, ativo: barbeiro.ativo }
      : { comissao: 50 },
  })

  const addEsp = () => {
    if (novaEsp.trim() && !especialidades.includes(novaEsp.trim())) {
      setEspecialidades([...especialidades, novaEsp.trim()])
      setNovaEsp('')
    }
  }

  const removeEsp = (esp: string) => {
    setEspecialidades(especialidades.filter((e) => e !== esp))
  }

  const onSubmit = async (data: any) => {
    try {
      const url = isEdit ? `/api/barbeiros/${barbeiro.id}` : '/api/barbeiros'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, especialidades }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao salvar')
      }

      toast.success(isEdit ? 'Barbeiro atualizado!' : 'Barbeiro criado!')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar Barbeiro' : 'Novo Barbeiro'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Nome *</label>
          <input
            {...register('nome')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {errors.nome && <p className="text-red-500 text-xs mt-1">{String(errors.nome.message)}</p>}
        </div>

        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">E-mail *</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{String(errors.email.message)}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Senha *</label>
              <input
                {...register('password')}
                type="password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Comissão (%) *</label>
            <input
              {...register('comissao', { valueAsNumber: true })}
              type="number"
              min={0}
              max={100}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
              <select
                {...register('ativo')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          )}
        </div>

        {/* Especialidades */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Especialidades</label>
          <div className="flex gap-2 mb-2">
            <input
              value={novaEsp}
              onChange={(e) => setNovaEsp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEsp())}
              placeholder="Ex: Degradê, Barba..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={addEsp}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {especialidades.map((esp) => (
              <span key={esp} className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                {esp}
                <button type="button" onClick={() => removeEsp(esp)} className="ml-1 hover:text-amber-900">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar Barbeiro'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
