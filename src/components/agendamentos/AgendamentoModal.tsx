'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import type { Barbeiro, Servico, Cliente } from '@/types'

const schema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  barbeiroId: z.string().min(1, 'Selecione um barbeiro'),
  dataHora: z.string().min(1, 'Data e hora obrigatórias'),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export function AgendamentoModal({ onClose, onSuccess }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [selectedServicos, setSelectedServicos] = useState<string[]>([])
  const [searchCliente, setSearchCliente] = useState('')
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataHora: new Date().toISOString().slice(0, 16),
    },
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/barbeiros?ativos=true').then((r) => r.json()),
      fetch('/api/servicos?ativos=true').then((r) => r.json()),
    ]).then(([b, s]) => {
      setBarbeiros(Array.isArray(b) ? b : [])
      setServicos(Array.isArray(s) ? s : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCliente.length >= 2) {
        fetch(`/api/clientes?search=${encodeURIComponent(searchCliente)}&limit=10`)
          .then((r) => r.json())
          .then((d) => setClientes(d.clientes || []))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchCliente])

  const toggleServico = (id: string) => {
    setSelectedServicos((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const totalSelecionado = servicos
    .filter((s) => selectedServicos.includes(s.id))
    .reduce((sum, s) => sum + s.preco, 0)

  const onSubmit = async (data: FormData) => {
    if (selectedServicos.length === 0) {
      toast.error('Selecione ao menos um serviço')
      return
    }

    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dataHora: new Date(data.dataHora).toISOString(),
          servicoIds: selectedServicos,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar agendamento')
      }

      toast.success('Agendamento criado! E-mail de confirmação enviado.')
      onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return null

  return (
    <Modal title="Novo Agendamento" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Cliente */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Cliente *</label>
          <input
            value={searchCliente}
            onChange={(e) => setSearchCliente(e.target.value)}
            placeholder="Digite o nome do cliente..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
          />
          {clientes.length > 0 && searchCliente.length >= 2 && (
            <select
              {...register('clienteId')}
              size={Math.min(clientes.length + 1, 5)}
              className="w-full border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">— Selecione um cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} — {c.telefone}
                </option>
              ))}
            </select>
          )}
          {errors.clienteId && <p className="text-red-500 text-xs mt-1">{errors.clienteId.message}</p>}
        </div>

        {/* Barbeiro + Data */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Barbeiro *</label>
            <select
              {...register('barbeiroId')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">— Selecione —</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.user.name}
                </option>
              ))}
            </select>
            {errors.barbeiroId && <p className="text-red-500 text-xs mt-1">{errors.barbeiroId.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Data e Hora *</label>
            <input
              {...register('dataHora')}
              type="datetime-local"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {errors.dataHora && <p className="text-red-500 text-xs mt-1">{errors.dataHora.message}</p>}
          </div>
        </div>

        {/* Serviços */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Serviços * {selectedServicos.length > 0 && <span className="text-amber-600 font-semibold">(Total: {formatCurrency(totalSelecionado)})</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {servicos.map((s) => {
              const selected = selectedServicos.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServico(s.id)}
                  className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all text-sm ${
                    selected
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded mt-0.5 flex-shrink-0 ${selected ? 'bg-amber-500' : 'bg-gray-200'}`} />
                  <div>
                    <p className="font-medium">{s.nome}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(s.preco)} • {s.duracao}min</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Observações</label>
          <textarea
            {...register('observacoes')}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder="Observações especiais..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Agendar
          </button>
        </div>
      </form>
    </Modal>
  )
}
