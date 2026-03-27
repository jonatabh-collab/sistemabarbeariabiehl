'use client'
// Backup e Restore — somente Admin
import { useState, useRef } from 'react'
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileJson,
} from 'lucide-react'

export default function BackupPage() {
  const [exportando, setExportando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [modalConfirmacao, setModalConfirmacao] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Exportar backup
  const exportarBackup = async () => {
    setExportando(true)
    setErro('')
    try {
      const resp = await fetch('/api/admin/backup/export')

      if (!resp.ok) {
        throw new Error('Erro ao gerar backup')
      }

      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const data = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `backup-barbearia-${data}.json`
      a.click()
      URL.revokeObjectURL(url)

      setSucesso('Backup exportado com sucesso!')
      setTimeout(() => setSucesso(''), 5000)
    } catch {
      setErro('Erro ao exportar backup. Tente novamente.')
    } finally {
      setExportando(false)
    }
  }

  // Selecionar arquivo para restore
  const selecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    setErro('')
    setSucesso('')

    if (!arquivo) return

    if (!arquivo.name.endsWith('.json')) {
      setErro('Apenas arquivos .json são suportados')
      return
    }

    setArquivoSelecionado(arquivo)
  }

  // Confirmar e executar restore
  const executarRestore = async () => {
    if (!arquivoSelecionado) return

    setImportando(true)
    setModalConfirmacao(false)
    setErro('')

    try {
      // Ler o arquivo
      const texto = await arquivoSelecionado.text()
      let dados: unknown

      try {
        dados = JSON.parse(texto)
      } catch {
        setErro('Arquivo inválido. O arquivo não é um JSON válido.')
        return
      }

      // Enviar para a API
      const resp = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const result = await resp.json()

      if (!resp.ok) {
        setErro(result.error || 'Erro ao importar backup')
        return
      }

      setSucesso('Backup restaurado com sucesso! A página será recarregada...')
      setArquivoSelecionado(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Recarregar após 2 segundos
      setTimeout(() => window.location.reload(), 2000)
    } catch {
      setErro('Erro inesperado ao importar backup')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#f5f0e8]">Backup e Restore</h2>
        <p className="text-sm text-[#888]">Exporte e importe todos os dados do sistema</p>
      </div>

      {/* Mensagens */}
      {sucesso && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">{sucesso}</p>
        </div>
      )}

      {erro && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{erro}</p>
        </div>
      )}

      {/* Exportar Backup */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-[#f5f0e8]">Exportar Backup</h3>
            <p className="text-sm text-[#777] mt-1">
              Gera um arquivo <strong>.json</strong> com todos os dados do sistema: clientes,
              agendamentos, serviços, barbeiros, financeiro e configurações.
            </p>
            <p className="text-xs text-[#555] mt-2">
              O arquivo será nomeado como: <code className="text-[#c9a84c]">backup-barbearia-AAAA-MM-DD.json</code>
            </p>

            <button
              onClick={exportarBackup}
              disabled={exportando}
              className="mt-4 flex items-center gap-2 bg-[#c9a84c] hover:bg-[#d4b96a] disabled:opacity-50 text-[#1a1a1a] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {exportando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportando ? 'Gerando backup...' : 'Exportar Backup'}
            </button>
          </div>
        </div>
      </div>

      {/* Restaurar Backup */}
      <div className="bg-[#222] border border-[#333] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-[#f5f0e8]">Restaurar Backup</h3>
            <p className="text-sm text-[#777] mt-1">
              Importa dados a partir de um arquivo de backup. Os dados atuais serão substituídos.
            </p>

            {/* Aviso */}
            <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                <strong>Atenção:</strong> Esta operação substituirá todos os dados atuais do sistema.
                Seu usuário admin será preservado. Faça um backup atual antes de continuar.
              </p>
            </div>

            {/* Upload de arquivo */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#ccc] mb-2">
                Selecionar arquivo de backup (.json)
              </label>
              <div
                className="border-2 border-dashed border-[#333] hover:border-[#c9a84c]/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {arquivoSelecionado ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileJson className="w-5 h-5 text-[#c9a84c]" />
                    <span className="text-sm text-[#c9a84c] font-medium">{arquivoSelecionado.name}</span>
                  </div>
                ) : (
                  <>
                    <Database className="w-8 h-8 text-[#444] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">Clique para selecionar um arquivo .json</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={selecionarArquivo}
                className="hidden"
              />
            </div>

            {arquivoSelecionado && (
              <button
                onClick={() => setModalConfirmacao(true)}
                disabled={importando}
                className="mt-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {importando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importando ? 'Restaurando...' : 'Restaurar Backup'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#222] border border-red-500/30 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#f5f0e8]">Confirmar Restore</h3>
            </div>

            <p className="text-sm text-[#ccc] leading-relaxed">
              Você está prestes a substituir <strong>todos os dados atuais</strong> com os dados do arquivo:{' '}
              <span className="text-[#c9a84c]">{arquivoSelecionado?.name}</span>
            </p>

            <p className="mt-3 text-sm text-amber-400">
              ⚠️ Esta ação não pode ser desfeita! Seu usuário admin será preservado.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalConfirmacao(false)}
                className="flex-1 bg-[#333] hover:bg-[#444] text-[#f5f0e8] rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executarRestore}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
