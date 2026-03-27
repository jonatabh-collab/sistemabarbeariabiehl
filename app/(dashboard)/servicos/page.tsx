'use client'
// Módulo de Serviços — cadastro e gerenciamento
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Scissors, Edit, Loader2, ToggleLeft, ToggleRight, Clock, DollarSign } from 'lucide-react'
import { formatarMoeda } from '@/lib/utils'

const servicoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  preco: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Preço inválido'),
  duracaoMinutos: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Duração inválida'),
})

type ServicoFormData = z.infer<typeof servicoSchema>

interface Servico {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  duracaoMinutos: number
  ativo: boolean
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoSchema),
  })

  const carregarServicos = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await fetch('/api/servicos')
      const data = await resp.json()
      setServicos(data.servicos || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { carregarServicos() }, [carregarServicos])

  const onSubmit = async (data: ServicoFormData) => {
    setSalvando(true)
    try {
      const url = editando ? `/api/servicos/${editando.id}` : '/api/servicos'
      const method = editando ? 'PUT' : 'POST'

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          preco: Number(data.preco),
          duracaoMinutos: Number(data.duracaoMinutos),
        }),
      })

      if (resp.ok) {
        setModalAberto(false)
        setEditando(null)
        reset()
        carregarServicos()
      } else {
        const err = await resp.json()
        alert(err.error || 'Erro ao salvar serviço')
      }
    } catch {
      alert('Erro ao salvar serviço')
    } finally {
      setSalvando(false)
    }
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await fetch(`/api/servicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ativo }),
      })
      carregarServicos()
    } catch {
      alert('Erro ao atualizar serviço')
    }
  }

  const abrirEditar = (servico: Servico) => {
    setEditando(servico)
    reset({
      nome: servico.nome,
      descricao: servico.descricao || '',
      preco: servico.preco.toString(),
      duracaoMinutos: servico.duracaoMinutos.toString(),
    })
    setModalAberto(true)
  }

  const ativos = servicos.filter(s => s.ativo)
  const inativos = servicos.filter(s => !s.ativo)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Serviços</h2>
          <p className="text-sm text-[#888]">{ativos.length} serviços ativos</p>
        </div>
        <button
          onClick={() => { setEditando(null); reset(); setModalAberto(true) }}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] text-[#1a1a1a] font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className={`bg-[#222] border rounded-xl p-5 ${
                servico.ativo ? 'border-[#333]' : 'border-[#2a2a2a] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-5 h-5 text-[#c9a84c]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#f5f0e8] text-sm">{servico.nome}</h3>
                    {servico.descricao && (
                      <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{servico.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirEditar(servico)}
                    className="p-1.5 hover:bg-[#333] rounded-lg text-[#555] hover:text-[#f5f0e8] transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleAtivo(servico.id, servico.ativo)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      servico.ativo
                        ? 'hover:bg-red-500/10 text-green-400 hover:text-red-400'
                        : 'hover:bg-green-500/10 text-[#555] hover:text-green-400'
                    }`}
                    title={servico.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {servico.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-1.5 text-[#c9a84c]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{formatarMoeda(servico.preco)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#777]">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{servico.duracaoMinutos} min</span>
                </div>
                {!servico.ativo && (
                  <span className="ml-auto text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                    Inativo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de serviço */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-[#333] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#333]">
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">
                {editando ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">Nome do serviço *</label>
                <input
                  {...register('nome')}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                  placeholder="Ex: Corte Masculino"
                />
                {errors.nome && <p className="mt-1 text-xs text-red-400">{errors.nome.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                  Descrição <span className="text-[#555]">(opcional)</span>
                </label>
                <textarea
                  {...register('descricao')}
                  rows={2}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c] resize-none"
                  placeholder="Descrição do serviço..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Preço (R$) *</label>
                  <input
                    {...register('preco')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="45.00"
                  />
                  {errors.preco && <p className="mt-1 text-xs text-red-400">{errors.preco.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#ccc] mb-1.5">Duração (min) *</label>
                  <input
                    {...register('duracaoMinutos')}
                    type="number"
                    min="5"
                    step="5"
                    className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                    placeholder="30"
                  />
                  {errors.duracaoMinutos && <p className="mt-1 text-xs text-red-400">{errors.duracaoMinutos.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); setEditando(null); reset() }}
                  className="flex-1 bg-[#333] hover:bg-[#444] text-[#f5f0e8] rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 text-[#1a1a1a] rounded-lg py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editando ? 'Salvar' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
