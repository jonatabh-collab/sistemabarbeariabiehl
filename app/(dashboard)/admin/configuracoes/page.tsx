'use client'
// Configurações do Sistema — somente Admin
import { useState, useEffect, useCallback } from 'react'
import { Save, Settings, Clock, Phone, MapPin, Mail, Loader2 } from 'lucide-react'

interface ConfigItem {
  chave: string
  valor: string
  label: string
  tipo: 'text' | 'time' | 'email' | 'tel'
  placeholder?: string
}

const configSchema: ConfigItem[] = [
  { chave: 'nome_barbearia', label: 'Nome da Barbearia', tipo: 'text', placeholder: 'Ex: Barbearia Biehl' },
  { chave: 'telefone', label: 'Telefone de Contato', tipo: 'tel', placeholder: '(51) 99999-9999' },
  { chave: 'endereco', label: 'Endereço', tipo: 'text', placeholder: 'Rua Principal, 123 - Centro' },
  { chave: 'email_contato', label: 'E-mail de Contato', tipo: 'email', placeholder: 'contato@barbearia.com' },
  { chave: 'horario_abertura', label: 'Horário de Abertura', tipo: 'time' },
  { chave: 'horario_fechamento', label: 'Horário de Fechamento', tipo: 'time' },
  { chave: 'intervalo_agendamento', label: 'Intervalo entre Agendamentos (minutos)', tipo: 'text', placeholder: '30' },
]

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [diasFuncionamento, setDiasFuncionamento] = useState<string[]>([])

  const DIAS = [
    { num: '1', label: 'Seg' },
    { num: '2', label: 'Ter' },
    { num: '3', label: 'Qua' },
    { num: '4', label: 'Qui' },
    { num: '5', label: 'Sex' },
    { num: '6', label: 'Sáb' },
    { num: '0', label: 'Dom' },
  ]

  const carregarConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await fetch('/api/admin/configuracoes')
      const data = await resp.json()
      setConfigs(data.configuracoes || {})
      const dias = (data.configuracoes?.dias_funcionamento || '1,2,3,4,5,6').split(',')
      setDiasFuncionamento(dias)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { carregarConfigs() }, [carregarConfigs])

  const salvarConfigs = async () => {
    setSalvando(true)
    setSucesso(false)
    try {
      const todasConfigs = {
        ...configs,
        dias_funcionamento: diasFuncionamento.join(','),
      }

      await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuracoes: todasConfigs }),
      })

      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch {
      alert('Erro ao salvar configurações')
    } finally {
      setSalvando(false)
    }
  }

  const toggleDia = (dia: string) => {
    setDiasFuncionamento(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Configurações</h2>
        <p className="text-sm text-[#888]">Ajuste as informações e parâmetros do sistema</p>
      </div>

      {/* Informações da Barbearia */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-6 space-y-5">
        <h3 className="font-serif font-semibold text-[#f5f0e8] flex items-center gap-2 text-base">
          <Settings className="w-4 h-4 text-[#c9a84c]" />
          Informações da Barbearia
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {configSchema.slice(0, 4).map((item) => (
            <div key={item.chave} className={item.tipo === 'text' && item.chave === 'endereco' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                {item.label}
              </label>
              <input
                type={item.tipo}
                value={configs[item.chave] || ''}
                onChange={(e) => setConfigs(prev => ({ ...prev, [item.chave]: e.target.value }))}
                className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                placeholder={item.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Horários de Funcionamento */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-6 space-y-5">
        <h3 className="font-serif font-semibold text-[#f5f0e8] flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-[#c9a84c]" />
          Horários de Funcionamento
        </h3>

        {/* Dias de funcionamento */}
        <div>
          <label className="block text-sm font-medium text-[#ccc] mb-3">Dias de Funcionamento</label>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((dia) => {
              const ativo = diasFuncionamento.includes(dia.num)
              return (
                <button
                  key={dia.num}
                  type="button"
                  onClick={() => toggleDia(dia.num)}
                  className={`w-12 h-12 rounded-xl text-sm font-medium border transition-all ${
                    ativo
                      ? 'bg-[#c9a84c]/20 border-[#c9a84c]/40 text-[#c9a84c]'
                      : 'bg-[#1a1a1a] border-[#333] text-[#555] hover:border-[#444]'
                  }`}
                >
                  {dia.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Horários de abertura e fechamento */}
        <div className="grid grid-cols-2 gap-4">
          {configSchema.slice(4, 7).map((item) => (
            <div key={item.chave}>
              <label className="block text-sm font-medium text-[#ccc] mb-1.5">{item.label}</label>
              <input
                type={item.tipo}
                value={configs[item.chave] || ''}
                onChange={(e) => setConfigs(prev => ({ ...prev, [item.chave]: e.target.value }))}
                className="w-full bg-[#1a1a1a] border border-[#333] text-[#f5f0e8] placeholder:text-[#555] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9a84c]"
                placeholder={item.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botão salvar */}
      <div className="flex items-center gap-4">
        <button
          onClick={salvarConfigs}
          disabled={salvando}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 text-[#1a1a1a] font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
        {sucesso && (
          <span className="text-sm text-green-400 font-medium">
            ✓ Configurações salvas com sucesso!
          </span>
        )}
      </div>
    </div>
  )
}
