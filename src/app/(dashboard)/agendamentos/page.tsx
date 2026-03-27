'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/pt-br'
import { Plus, List, CalendarDays, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { AgendamentoModal } from '@/components/agendamentos/AgendamentoModal'
import { AgendamentoDetalheModal } from '@/components/agendamentos/AgendamentoDetalheModal'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils'
import type { Agendamento } from '@/types'

moment.locale('pt-br')
const localizer = momentLocalizer(moment)

const STATUS_CALENDAR_COLORS: Record<string, string> = {
  PENDENTE: '#f59e0b',
  CONFIRMADO: '#3b82f6',
  EM_ANDAMENTO: '#8b5cf6',
  CONCLUIDO: '#10b981',
  CANCELADO: '#ef4444',
}

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [calendarView, setCalendarView] = useState<View>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true)
    try {
      const start = moment(currentDate).startOf('month').subtract(7, 'days').toISOString()
      const end = moment(currentDate).endOf('month').add(7, 'days').toISOString()
      const res = await fetch(`/api/agendamentos?dataInicio=${start}&dataFim=${end}`)
      const data = await res.json()
      setAgendamentos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => { fetchAgendamentos() }, [fetchAgendamentos])

  const calendarEvents = agendamentos.map((ag) => ({
    id: ag.id,
    title: `${ag.cliente.nome} — ${ag.servicos.map((s) => s.servico.nome).join(', ')}`,
    start: new Date(ag.dataHora),
    end: new Date(new Date(ag.dataHora).getTime() + ag.servicos.reduce((s, srv) => s + srv.servico.duracao, 30) * 60000),
    resource: ag,
  }))

  const eventStyleGetter = (event: any) => ({
    style: {
      backgroundColor: STATUS_CALENDAR_COLORS[event.resource.status] || '#6b7280',
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
    },
  })

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
          <p className="text-sm text-gray-500">{agendamentos.length} agendamento(s) no período</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAgendamentos}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              <CalendarDays size={15} /> Calendário
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              <List size={15} /> Lista
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1" style={{ minHeight: '560px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            view={calendarView}
            onView={setCalendarView}
            date={currentDate}
            onNavigate={setCurrentDate}
            style={{ height: '100%', minHeight: '520px' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event: any) => setSelectedAgendamento(event.resource)}
            onSelectSlot={(slot: any) => setShowModal(true)}
            selectable
            messages={{
              next: 'Próximo',
              previous: 'Anterior',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Agenda',
              noEventsInRange: 'Nenhum agendamento neste período',
            }}
          />
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarDays size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {agendamentos.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgendamento(ag)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(ag.dataHora).getDate()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ag.dataHora).toLocaleString('pt-BR', { month: 'short' })}
                    </p>
                  </div>
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_CALENDAR_COLORS[ag.status] }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{ag.cliente.nome}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {ag.servicos.map((s) => s.servico.nome).join(', ')} • {ag.barbeiro.user.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ag.status]}`}>
                      {STATUS_LABELS[ag.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AgendamentoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchAgendamentos(); }}
        />
      )}
      {selectedAgendamento && (
        <AgendamentoDetalheModal
          agendamento={selectedAgendamento}
          onClose={() => setSelectedAgendamento(null)}
          onUpdate={() => { setSelectedAgendamento(null); fetchAgendamentos(); }}
        />
      )}
    </div>
  )
}
