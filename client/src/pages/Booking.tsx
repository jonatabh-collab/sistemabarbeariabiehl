import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Clock, User, Scissors, Calendar, ChevronRight } from 'lucide-react';
import { getServices, getProfessionals, getAvailableSlots, createAppointment } from '../services/api';
import { useClientAuth } from '../contexts/ClientAuthContext';

type Step = 'service' | 'professional' | 'datetime' | 'confirm';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { client, isAuthenticated } = useClientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getServices().then(r => {
      const svcs = r.data.services?.filter((s: any) => s.active) || [];
      setServices(svcs);
      if (preselectedServiceId) {
        const found = svcs.find((s: any) => s.id === preselectedServiceId);
        if (found) { setSelectedService(found); setStep('professional'); }
      }
    });
    getProfessionals().then(r => setProfessionals(r.data.professionals?.filter((p: any) => p.active) || []));
  }, []);

  useEffect(() => {
    if (selectedService && selectedProfessional && selectedDate) {
      getAvailableSlots({
        date: selectedDate,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
      }).then(r => setAvailableSlots(r.data.slots || [])).catch(() => setAvailableSlots([]));
    }
  }, [selectedService, selectedProfessional, selectedDate]);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return format(d, 'yyyy-MM-dd');
  });

  const handleBook = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/agendar' } } });
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createAppointment({
        client_id: client!.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        source: 'client_app',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao agendar');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['service', 'professional', 'datetime', 'confirm'];
  const stepIndex = steps.indexOf(step);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Agendado!</h2>
          <p className="text-gray-500 text-sm mb-1">
            <strong>{selectedService?.name}</strong> com <strong>{selectedProfessional?.name}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })} às {selectedSlot?.start_time}
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/meus-agendamentos')}
              className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
              Ver Agendamentos
            </button>
            <button onClick={() => { setSuccess(false); setStep('service'); setSelectedService(null); setSelectedProfessional(null); setSelectedDate(''); setSelectedSlot(null); }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Agendar Serviço</h1>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {['Serviço', 'Profissional', 'Data/Hora', 'Confirmar'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < stepIndex ? 'bg-teal-600 text-white' :
              i === stepIndex ? 'bg-teal-600 text-white ring-4 ring-teal-100' :
              'bg-gray-100 text-gray-400'
            }`}>
              {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === stepIndex ? 'text-teal-700' : 'text-gray-400'}`}>{label}</span>
            {i < 3 && <div className={`flex-1 h-0.5 ${i < stepIndex ? 'bg-teal-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Service */}
      {step === 'service' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Escolha o Serviço</h2>
          {services.map(svc => (
            <button key={svc.id} onClick={() => { setSelectedService(svc); setStep('professional'); }}
              className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:border-teal-400 hover:bg-teal-50 rounded-2xl transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{svc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />{svc.duration} min
                    </span>
                    <span className="font-bold text-teal-700 text-sm">R$ {svc.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Professional */}
      {step === 'professional' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Escolha o Profissional</h2>
            <button onClick={() => setStep('service')} className="text-sm text-teal-600 hover:text-teal-700">Voltar</button>
          </div>

          <button onClick={() => { setSelectedProfessional({ id: 'any', name: 'Qualquer Profissional' }); setStep('datetime'); }}
            className="w-full flex items-center gap-4 p-4 bg-white border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl transition-all">
            <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Qualquer Profissional</p>
              <p className="text-xs text-gray-400">Primeiro disponível</p>
            </div>
          </button>

          {professionals.map(prof => (
            <button key={prof.id} onClick={() => { setSelectedProfessional(prof); setStep('datetime'); }}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 hover:border-teal-400 hover:bg-teal-50 rounded-2xl transition-all">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: prof.color }}>
                {prof.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">{prof.name}</p>
                <p className="text-xs text-gray-400 capitalize">{prof.role === 'admin' ? 'Administrador' : 'Barbeiro'}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Date + Time */}
      {step === 'datetime' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Escolha a Data e Horário</h2>
            <button onClick={() => setStep('professional')} className="text-sm text-teal-600 hover:text-teal-700">Voltar</button>
          </div>

          {/* Date picker */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {dates.map(d => {
              const dateObj = new Date(d + 'T00:00:00');
              return (
                <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                  className={`flex-shrink-0 w-16 p-2 rounded-xl text-center transition-all border ${
                    selectedDate === d
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-teal-300'
                  }`}>
                  <p className="text-xs font-medium capitalize">{format(dateObj, 'EEE', { locale: ptBR })}</p>
                  <p className="text-lg font-bold">{format(dateObj, 'd')}</p>
                  <p className="text-xs">{format(dateObj, 'MMM', { locale: ptBR })}</p>
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Horários Disponíveis</h3>
              {availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum horário disponível para esta data</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button key={slot.start_time} onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 text-sm font-medium rounded-xl transition-all border ${
                        selectedSlot?.start_time === slot.start_time
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50'
                      }`}>
                      {slot.start_time}
                    </button>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <button onClick={() => setStep('confirm')}
                  className="w-full mt-6 py-3 bg-teal-600 text-white rounded-2xl font-semibold hover:bg-teal-700 transition-colors">
                  Continuar
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Confirmar Agendamento</h2>
            <button onClick={() => setStep('datetime')} className="text-sm text-teal-600 hover:text-teal-700">Voltar</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 mb-6">
            {[
              { icon: Scissors, label: 'Serviço', value: selectedService?.name },
              { icon: User, label: 'Profissional', value: selectedProfessional?.name },
              { icon: Calendar, label: 'Data', value: selectedDate ? format(new Date(selectedDate + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '' },
              { icon: Clock, label: 'Horário', value: `${selectedSlot?.start_time} - ${selectedSlot?.end_time}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-teal-700">R$ {selectedService?.price.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200 mb-4">
              {error}
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700 mb-4">
              Você precisa entrar para confirmar o agendamento.
            </div>
          )}

          <button onClick={handleBook} disabled={loading}
            className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {loading ? 'Agendando...' : isAuthenticated ? 'Confirmar Agendamento' : 'Entrar para Agendar'}
          </button>
        </div>
      )}
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${className}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
