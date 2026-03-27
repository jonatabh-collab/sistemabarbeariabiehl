'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, XCircle, Clock, Play, CreditCard } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDateTime, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import type { Agendamento, StatusAgendamento } from '@/types'

interface Props {
  agendamento: Agendamento
  onClose: () => void
  onUpdate: () => void
}

const statusTransitions: Record<StatusAgendamento, { label: string; next: StatusAgendamento; icon: any; color: string }[]> = {
  PENDENTE: [
    { label: 'Confirmar', next: 'CONFIRMADO', icon: CheckCircle, color: 'bg-blue-500' },
    { label: 'Cancelar', next: 'CANCELADO', icon: XCircle, color: 'bg-red-500' },
  ],
  CONFIRMADO: [
    { label: 'Iniciar', next: 'EM_ANDAMENTO', icon: Play, color: 'bg-purple-500' },
    { label: 'Cancelar', next: 'CANCELADO', icon: XCircle, color: 'bg-red-500' },
  ],
  EM_ANDAMENTO: [
    { label: 'Concluir', next: 'CONCLUIDO', icon: CheckCircle, color: 'bg-green-500' },
  ],
  CONCLUIDO: [],
  CANCELADO: [],
}

export function AgendamentoDetalheModal({ agendamento, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState(agendamento.financeiro?.formaPagamento || '')

  const updateStatus = async (status: StatusAgendamento) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/agendamentos/${agendamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      toast.success(`Status: ${STATUS_LABELS[status]}`)
      onUpdate()
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const marcarPago = async () => {
    setLoading(true)
    try {
      await fetch(`/api/agendamentos/${agendamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pago: true, formaPagamento }),
      })
      toast.success('Pagamento registrado!')
      onUpdate()
    } catch {
      toast.error('Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const transicoes = statusTransitions[agendamento.status] || []
  const valorTotal = agendamento.servicos.reduce((s, srv) => s + srv.preco, 0)

  return (
    <Modal title="Detalhes do Agendamento" onClose={onClose}>
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[agendamento.status]}`}>
            {STATUS_LABELS[agendamento.status]}
          </span>
          <span className="text-sm text-gray-500">{formatDateTime(agendamento.dataHora)}</span>
        </div>

        {/* Cliente & Barbeiro */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Cliente</p>
            <p className="font-semibold text-gray-900">{agendamento.cliente.nome}</p>
            <p className="text-xs text-gray-500">{agendamento.cliente.telefone}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Barbeiro</p>
            <p className="font-semibold text-gray-900">{agendamento.barbeiro.user.name}</p>
            <p className="text-xs text-gray-500">Comissão: {agendamento.barbeiro.comissao}%</p>
          </div>
        </div>

        {/* Serviços */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Serviços</p>
          <div className="space-y-2">
            {agendamento.servicos.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.servico.nome}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(s.preco)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg text-green-700">{formatCurrency(valorTotal)}</span>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        {agendamento.financeiro && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Financeiro</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor barbeiro ({agendamento.financeiro.comissaoPct}%)</span>
              <span>{formatCurrency(agendamento.financeiro.valorBarbeiro)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor barbearia</span>
              <span>{formatCurrency(agendamento.financeiro.valorBarbearia)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1">
              <span className="font-medium">Pagamento</span>
              {agendamento.financeiro.pago ? (
                <span className="text-green-700 font-semibold">✓ Pago ({agendamento.financeiro.formaPagamento})</span>
              ) : (
                <span className="text-amber-600 font-semibold">Pendente</span>
              )}
            </div>

            {/* Registrar pagamento */}
            {!agendamento.financeiro.pago && agendamento.status === 'CONCLUIDO' && (
              <div className="pt-2 space-y-2">
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">— Forma de Pagamento —</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                </select>
                <button
                  onClick={marcarPago}
                  disabled={loading || !formaPagamento}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  Registrar Pagamento
                </button>
              </div>
            )}
          </div>
        )}

        {/* Observações */}
        {agendamento.observacoes && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium mb-1">Observações</p>
            <p className="text-sm text-amber-800">{agendamento.observacoes}</p>
          </div>
        )}

        {/* Ações de Status */}
        {transicoes.length > 0 && (
          <div className="flex gap-2 pt-2">
            {transicoes.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.next}
                  onClick={() => updateStatus(t.next)}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 ${t.color} hover:opacity-90 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60`}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {t.label}
                </button>
              )
            })}
          </div>
        )}

        <button onClick={onClose} className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          Fechar
        </button>
      </div>
    </Modal>
  )
}
