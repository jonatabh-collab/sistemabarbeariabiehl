'use client'

import { useState, useRef } from 'react'
import { Download, Upload, Database, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [enviandoLembrete, setEnviandoLembrete] = useState(false)
  const [enviandoAniversario, setEnviandoAniversario] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('Erro ao gerar backup')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-barbearia-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Backup baixado com sucesso!')
    } catch {
      toast.error('Erro ao gerar backup')
    } finally {
      setDownloading(false)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Selecione um arquivo .json válido')
      return
    }

    const confirmRestore = window.confirm(
      '⚠️ Atenção!\n\nA restauração do backup irá sobrescrever os dados existentes.\n\nDeseja continuar?',
    )
    if (!confirmRestore) return

    setUploading(true)
    setResultado(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro na restauração')

      setResultado(data.resultado)
      toast.success('Backup restaurado com sucesso!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao restaurar backup')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const enviarLembretes = async () => {
    setEnviandoLembrete(true)
    try {
      const res = await fetch('/api/emails/lembrete', { method: 'POST' })
      const data = await res.json()
      toast.success(`${data.enviados} lembrete(s) enviado(s)!`)
    } catch {
      toast.error('Erro ao enviar lembretes')
    } finally {
      setEnviandoLembrete(false)
    }
  }

  const enviarAniversarios = async () => {
    setEnviandoAniversario(true)
    try {
      const res = await fetch('/api/emails/aniversario', { method: 'POST' })
      const data = await res.json()
      toast.success(`${data.enviados} e-mail(is) de aniversário enviado(s)!`)
    } catch {
      toast.error('Erro ao enviar e-mails de aniversário')
    } finally {
      setEnviandoAniversario(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Backup & Ferramentas</h2>
        <p className="text-sm text-gray-500">Gerencie backups e envie comunicações</p>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Database size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Backup do Sistema</h3>
            <p className="text-sm text-gray-500">Exporte e importe todos os dados do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 text-center hover:border-blue-400 transition-colors">
            <Download size={32} className="mx-auto text-blue-400 mb-3" />
            <p className="font-medium text-gray-900 mb-1">Fazer Backup</p>
            <p className="text-xs text-gray-500 mb-4">Baixa um arquivo JSON com todos os dados</p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {downloading ? 'Gerando...' : 'Baixar Backup'}
            </button>
          </div>

          {/* Upload */}
          <div className="border-2 border-dashed border-amber-200 rounded-xl p-5 text-center hover:border-amber-400 transition-colors">
            <Upload size={32} className="mx-auto text-amber-400 mb-3" />
            <p className="font-medium text-gray-900 mb-1">Restaurar Backup</p>
            <p className="text-xs text-gray-500 mb-4">Importa dados de um arquivo de backup</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'Restaurando...' : 'Selecionar Arquivo'}
            </button>
          </div>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="font-semibold text-green-800">Backup restaurado com sucesso!</p>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>✅ Clientes restaurados: {resultado.clientes}</p>
              <p>✅ Serviços restaurados: {resultado.servicos}</p>
              {resultado.erros?.length > 0 && (
                <div className="mt-2">
                  <p className="text-amber-700 font-medium">Avisos:</p>
                  {resultado.erros.map((e: string, i: number) => (
                    <p key={i} className="text-amber-600 text-xs">{e}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* E-mails Manuais */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Enviar E-mails Manualmente</h3>
            <p className="text-sm text-gray-500">Dispare comunicações sem esperar o agendador automático</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="font-medium text-gray-900 text-sm mb-1">⏰ Lembretes 24h</p>
            <p className="text-xs text-gray-500 mb-3">Envia lembrete para agendamentos de amanhã ainda não notificados</p>
            <button
              onClick={enviarLembretes}
              disabled={enviandoLembrete}
              className="flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {enviandoLembrete ? <Loader2 size={14} className="animate-spin" /> : null}
              Enviar Lembretes
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <p className="font-medium text-gray-900 text-sm mb-1">🎂 Aniversários</p>
            <p className="text-xs text-gray-500 mb-3">Envia parabéns para clientes aniversariantes de hoje</p>
            <button
              onClick={enviarAniversarios}
              disabled={enviandoAniversario}
              className="flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {enviandoAniversario ? <Loader2 size={14} className="animate-spin" /> : null}
              Enviar Parabéns
            </button>
          </div>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Dica de segurança</p>
          <p>Faça backup regularmente (semanal ou antes de grandes mudanças). Guarde os arquivos em local seguro como Google Drive ou Dropbox.</p>
        </div>
      </div>
    </div>
  )
}
