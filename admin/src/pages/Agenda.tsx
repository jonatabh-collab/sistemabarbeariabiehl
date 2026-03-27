import { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock,
  Users, List, Package, Lock, RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppointments, getBlockedTimes, getProfessionals, getWaitingList } from '../services/api';
import AppointmentModal from '../components/Modals/AppointmentModal';
import BlockTimeModal from '../components/Modals/BlockTimeModal';
import MiniCalendar from '../components/Calendar/MiniCalendar';

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const SLOT_HEIGHT = 56; // px per 30min slot

function timeToSlotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h * 60 + m - 7 * 60) / 30;
}

function timeToPixels(time: string): number {
  return timeToSlotIndex(time) * SLOT_HEIGHT;
}

function durationToPixels(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  return (minutes / 30) * SLOT_HEIGHT - 2;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-400 text-blue-800',
  confirmed: 'bg-green-100 border-green-400 text-green-800',
  completed: 'bg-gray-100 border-gray-400 text-gray-700',
  cancelled: 'bg-red-100 border-red-400 text-red-700 opacity-50',
  no_show: 'bg-orange-100 border-orange-400 text-orange-700',
};

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date('2026-03-26'));
  const [view, setView] = useState<'day' | 'week'>('day');
  const [selectedProfIds, setSelectedProfIds] = useState<string[]>([]);
  const [showProfFilter, setShowProfFilter] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<any>(null);
  const [clickedTime, setClickedTime] = useState<{ time: string; profId: string } | null>(null);
  const [showRightPanel, setShowRightPanel] = useState<'appointments' | 'waiting' | null>('appointments');
  const queryClient = useQueryClient();
  const calendarRef = useRef<HTMLDivElement>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: profData } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => getProfessionals().then(r => r.data.professionals),
  });

  const professionals = profData || [];

  useEffect(() => {
    if (professionals.length > 0 && selectedProfIds.length === 0) {
      setSelectedProfIds(professionals.filter((p: any) => p.active).map((p: any) => p.id));
    }
  }, [professionals]);

  const { data: apptData, isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', dateStr, selectedProfIds],
    queryFn: () => getAppointments({ date: dateStr, 'professionals[]': selectedProfIds }).then(r => r.data.appointments),
    enabled: selectedProfIds.length > 0,
  });

  const { data: blockedData } = useQuery({
    queryKey: ['blocked-times', dateStr],
    queryFn: () => getBlockedTimes({ date: dateStr }).then(r => r.data.blocked_times),
  });

  const { data: waitingData } = useQuery({
    queryKey: ['waiting-list'],
    queryFn: () => getWaitingList({ status: 'waiting' }).then(r => r.data.waiting_list),
  });

  const appointments = apptData || [];
  const blockedTimes = blockedData || [];
  const waitingList = waitingData || [];

  const displayedProfessionals = professionals.filter((p: any) =>
    selectedProfIds.includes(p.id)
  );

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date('2026-03-26'));

  const handleSlotClick = (time: string, profId: string) => {
    setClickedTime({ time, profId });
    setEditingAppt(null);
    setShowApptModal(true);
  };

  const handleApptClick = (appt: any) => {
    setEditingAppt(appt);
    setClickedTime(null);
    setShowApptModal(true);
  };

  const handleModalClose = () => {
    setShowApptModal(false);
    setEditingAppt(null);
    setClickedTime(null);
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  const toggleProfessional = (id: string) => {
    setSelectedProfIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const formatDateHeader = () => {
    return format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={handlePrevDay} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg border border-teal-200"
            >
              Hoje
            </button>
            <button onClick={handleNextDay} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-800 capitalize truncate">{formatDateHeader()}</span>
          </div>

          {/* View Toggles */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {(['day', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  view === v ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v === 'day' ? 'Dia' : 'Semana'}
              </button>
            ))}
          </div>

          {/* Professional Filter */}
          <div className="relative">
            <button
              onClick={() => setShowProfFilter(!showProfFilter)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {selectedProfIds.length === professionals.length ? 'Todos' : `${selectedProfIds.length} prof.`}
              </span>
              <ChevronLeft className="w-3 h-3 text-gray-400 -rotate-90" />
            </button>

            {showProfFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50 min-w-48">
                {professionals.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProfIds.includes(p.id)}
                      onChange={() => toggleProfessional(p.id)}
                      className="rounded"
                    />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-gray-700">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => { setEditingAppt(null); setClickedTime(null); setShowApptModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Encaixe</span>
          </button>

          <button
            onClick={() => setShowBlockModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
          >
            <Lock className="w-4 h-4" />
            <span className="hidden sm:block">Bloquear</span>
          </button>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto" ref={calendarRef}>
          <div className="flex min-w-max">
            {/* Time column */}
            <div className="w-16 shrink-0 bg-white border-r border-gray-200 sticky left-0 z-10">
              <div className="h-12 border-b border-gray-200" /> {/* Header spacer */}
              {TIME_SLOTS.map((time, i) => (
                <div key={time} className="h-14 border-b border-gray-100 flex items-start justify-end pr-2 pt-1">
                  {i % 2 === 0 && (
                    <span className="text-xs text-gray-400 font-medium">{time}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Professional columns */}
            {displayedProfessionals.map((prof: any) => {
              const profAppts = appointments.filter((a: any) => a.professional_id === prof.id);
              const profBlocked = blockedTimes.filter((b: any) => b.professional_id === prof.id);

              return (
                <div key={prof.id} className="flex-1 min-w-36 border-r border-gray-200 bg-white">
                  {/* Professional Header */}
                  <div
                    className="h-12 border-b border-gray-200 flex items-center justify-center gap-2 sticky top-0 z-10"
                    style={{ backgroundColor: prof.color + '20', borderBottom: `2px solid ${prof.color}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: prof.color }}
                    >
                      {prof.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 truncate">{prof.name}</span>
                  </div>

                  {/* Time slots container */}
                  <div className="relative" style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}>
                    {/* Background slots */}
                    {TIME_SLOTS.map((time) => (
                      <div
                        key={time}
                        className="absolute w-full border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                        style={{ top: timeToPixels(time), height: SLOT_HEIGHT }}
                        onClick={() => handleSlotClick(time, prof.id)}
                      />
                    ))}

                    {/* Blocked times */}
                    {profBlocked.map((blocked: any) => (
                      <div
                        key={blocked.id}
                        className="absolute w-full px-1 z-10"
                        style={{
                          top: timeToPixels(blocked.start_time) + 1,
                          height: durationToPixels(blocked.start_time, blocked.end_time),
                        }}
                      >
                        <div className="h-full bg-gray-700 rounded-md px-2 py-1 overflow-hidden">
                          <p className="text-white text-xs font-bold">BLOQUEADO</p>
                          <p className="text-gray-300 text-xs truncate">{blocked.reason}</p>
                          <p className="text-gray-400 text-xs">{blocked.start_time} - {blocked.end_time}</p>
                        </div>
                      </div>
                    ))}

                    {/* Appointments */}
                    {profAppts.map((appt: any) => (
                      <div
                        key={appt.id}
                        className="absolute w-full px-1 z-20 cursor-pointer"
                        style={{
                          top: timeToPixels(appt.start_time) + 1,
                          height: durationToPixels(appt.start_time, appt.end_time),
                        }}
                        onClick={(e) => { e.stopPropagation(); handleApptClick(appt); }}
                      >
                        <div
                          className={`h-full rounded-md px-2 py-1 overflow-hidden border-l-4 ${STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled} hover:brightness-95 transition-all`}
                        >
                          <p className="text-xs font-bold truncate">{appt.start_time} - {appt.end_time}</p>
                          <p className="text-xs font-semibold truncate">{appt.client_name}</p>
                          <p className="text-xs truncate opacity-75">{appt.service_name}</p>
                          {appt.client_phone && (
                            <p className="text-xs opacity-60 truncate">{appt.client_phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {loadingAppts && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
        {/* Mini Calendar */}
        <div className="p-3 border-b border-gray-200">
          <MiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {/* Stats */}
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-teal-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-teal-700">{appointments.length}</p>
              <p className="text-xs text-teal-600">Agendamentos</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-blue-700">{waitingList.length}</p>
              <p className="text-xs text-blue-600">Em espera</p>
            </div>
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setShowRightPanel(showRightPanel === 'appointments' ? null : 'appointments')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
              showRightPanel === 'appointments' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Agendamentos
          </button>
          <button
            onClick={() => setShowRightPanel(showRightPanel === 'waiting' ? null : 'waiting')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
              showRightPanel === 'waiting' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Espera
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {showRightPanel === 'appointments' && (
            <div className="p-2 space-y-1">
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum agendamento</p>
              ) : (
                appointments
                  .filter((a: any) => a.status !== 'cancelled')
                  .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                  .map((appt: any) => (
                    <div
                      key={appt.id}
                      onClick={() => handleApptClick(appt)}
                      className="p-2 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{appt.client_name}</p>
                          <p className="text-xs text-gray-500 truncate">{appt.service_name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-gray-700">{appt.start_time}</p>
                          <div
                            className="w-2 h-2 rounded-full mt-1 ml-auto"
                            style={{ backgroundColor: appt.professional_color || '#10b981' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {showRightPanel === 'waiting' && (
            <div className="p-2 space-y-1">
              {waitingList.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Lista de espera vazia</p>
              ) : (
                waitingList.map((entry: any) => (
                  <div key={entry.id} className="p-2 rounded-lg border border-orange-100 bg-orange-50">
                    <p className="text-xs font-semibold text-gray-800">{entry.client_name}</p>
                    <p className="text-xs text-gray-500">{entry.service_name}</p>
                    {entry.preferred_date && (
                      <p className="text-xs text-orange-600 mt-1">Pref: {entry.preferred_date} {entry.preferred_time}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Legenda</p>
          <div className="space-y-1">
            {[
              { color: 'bg-blue-400', label: 'Agendado' },
              { color: 'bg-green-400', label: 'Confirmado' },
              { color: 'bg-gray-400', label: 'Concluído' },
              { color: 'bg-orange-400', label: 'Não compareceu' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showApptModal && (
        <AppointmentModal
          appointment={editingAppt}
          defaultDate={dateStr}
          defaultTime={clickedTime?.time}
          defaultProfId={clickedTime?.profId}
          onClose={handleModalClose}
        />
      )}

      {showBlockModal && (
        <BlockTimeModal
          defaultDate={dateStr}
          onClose={() => {
            setShowBlockModal(false);
            queryClient.invalidateQueries({ queryKey: ['blocked-times'] });
          }}
        />
      )}
    </div>
  );
}
