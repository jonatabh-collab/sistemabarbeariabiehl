import { useState } from 'react';
import { Settings, Clock, Bell, Palette, Save, CheckCircle } from 'lucide-react';

const COLORS = ['#0d7377', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899', '#64748b'];

const DEFAULT_CONFIG = {
  barbearia_nome: 'Barbearia Biehl',
  barbearia_endereco: 'Rua das Flores, 123 - Porto Alegre, RS',
  barbearia_telefone: '(51) 99999-9999',
  barbearia_email: 'contato@barbeariabihl.com',
  horario_abertura: '08:00',
  horario_fechamento: '20:00',
  dias_funcionamento: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
  intervalo_agenda: '30',
  cor_primaria: '#0d7377',
  notificacoes_whatsapp: false,
  lembrete_antecedencia: '24',
};

const DIAS = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
];

export default function Configuracoes() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('barbearia_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleDia = (dia: string) => {
    const current: string[] = config.dias_funcionamento;
    update('dias_funcionamento',
      current.includes(dia) ? current.filter(d => d !== dia) : [...current, dia]
    );
  };

  const handleSave = () => {
    localStorage.setItem('barbearia_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Personalize o sistema da sua barbearia</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all ${
            saved ? 'bg-green-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Dados da Barbearia */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Dados da Barbearia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={config.barbearia_nome}
                onChange={e => update('barbearia_nome', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={config.barbearia_telefone}
                onChange={e => update('barbearia_telefone', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={config.barbearia_email}
                onChange={e => update('barbearia_email', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={config.barbearia_endereco}
                onChange={e => update('barbearia_endereco', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </section>

        {/* Horários */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Horários de Funcionamento
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
              <input
                type="time"
                value={config.horario_abertura}
                onChange={e => update('horario_abertura', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
              <input
                type="time"
                value={config.horario_fechamento}
                onChange={e => update('horario_fechamento', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (min)</label>
              <select
                value={config.intervalo_agenda}
                onChange={e => update('intervalo_agenda', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dias de Funcionamento</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleDia(key)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    config.dias_funcionamento.includes(key)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Aparência */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-teal-600" />
            Aparência
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => update('cor_primaria', color)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    config.cor_primaria === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: config.cor_primaria }} />
              <span className="text-sm text-gray-600">Cor selecionada: {config.cor_primaria}</span>
            </div>
          </div>
        </section>

        {/* Notificações */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Notificações
          </h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Lembretes por WhatsApp</p>
                <p className="text-xs text-gray-400">Enviar lembrete de agendamento pelo WhatsApp</p>
              </div>
              <input
                type="checkbox"
                checked={config.notificacoes_whatsapp}
                onChange={e => update('notificacoes_whatsapp', e.target.checked)}
                className="w-5 h-5 rounded accent-teal-600"
              />
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antecedência do lembrete (horas)
              </label>
              <select
                value={config.lembrete_antecedencia}
                onChange={e => update('lembrete_antecedencia', e.target.value)}
                className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="1">1 hora antes</option>
                <option value="2">2 horas antes</option>
                <option value="24">24 horas antes</option>
                <option value="48">48 horas antes</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
