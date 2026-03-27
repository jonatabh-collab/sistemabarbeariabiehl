import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFinancialSummary, getTransactions, createTransaction } from '../services/api';
import { X } from 'lucide-react';

function TransactionModal({ onClose }: { onClose: (saved?: boolean) => void }) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createTransaction({ type, category, description, amount: Number(amount), payment_method: paymentMethod, date });
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Nova Transação</h2>
          <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button type="button" onClick={() => setType('income')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === 'income' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Receita
            </button>
            <button type="button" onClick={() => setType('expense')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${type === 'expense' ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Despesa
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" min={0}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Serviços" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="pix">Pix</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Descrição da transação" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full py-2.5 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 text-sm disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const [period, setPeriod] = useState('month');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const now = new Date();
  const { data: summary } = useQuery({
    queryKey: ['financial-summary', period],
    queryFn: () => getFinancialSummary({ period, year: now.getFullYear(), month: now.getMonth() + 1 }).then(r => r.data),
  });

  const { data: transData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions({ limit: 30 }).then(r => r.data),
  });

  const transactions = transData?.transactions || [];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Dinheiro', card: 'Cartão', pix: 'Pix', transfer: 'Transferência'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Controle de receitas e despesas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {[
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'year', label: 'Ano' },
            ].map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p.value ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
            <Plus className="w-4 h-4" />
            Transação
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-sm text-gray-500">Receita Total</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary?.income)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            </div>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-sm text-gray-500">Despesas</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(summary?.expense)}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <BarChart2 className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-sm text-teal-100">Lucro Líquido</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary?.profit)}</p>
        </div>
      </div>

      {/* Chart (simple bar chart with CSS) */}
      {summary?.daily_data && summary.daily_data.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Receita por Dia</h2>
          <div className="flex items-end gap-1 h-32 overflow-x-auto">
            {summary.daily_data.slice(-30).map((d: any) => {
              const maxVal = Math.max(...summary.daily_data.map((x: any) => x.income));
              const height = maxVal > 0 ? (d.income / maxVal) * 100 : 0;
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 min-w-6">
                  <div
                    className="w-5 bg-teal-400 rounded-t-sm transition-all hover:bg-teal-500"
                    style={{ height: `${height}%` }}
                    title={`${d.date}: R$ ${d.income.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-300" style={{ fontSize: '8px' }}>
                    {d.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Transações Recentes</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma transação</div>
          ) : (
            transactions.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {t.type === 'income'
                    ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                    : <ArrowDownRight className="w-4 h-4 text-red-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.category || 'Transação'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.category && <span className="text-xs text-gray-400">{t.category}</span>}
                    {t.payment_method && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-500">
                        {PAYMENT_LABELS[t.payment_method] || t.payment_method}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <TransactionModal onClose={(saved) => {
          setShowModal(false);
          if (saved) {
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
          }
        }} />
      )}
    </div>
  );
}
