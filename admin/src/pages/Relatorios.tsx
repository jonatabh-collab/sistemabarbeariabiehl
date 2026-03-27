import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Calendar, DollarSign, Scissors } from 'lucide-react';
import { getFinancialSummary, getTransactions, getAppointments } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
};

export default function Relatorios() {
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFinancialSummary({ period }),
      getTransactions({ period, limit: 50 }),
    ])
      .then(([summaryRes, txRes]) => {
        setSummary(summaryRes.data);
        setTransactions(txRes.data.transactions || []);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const incomeByMethod: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'income' && t.payment_method)
    .forEach(t => {
      incomeByMethod[t.payment_method] = (incomeByMethod[t.payment_method] || 0) + t.amount;
    });

  const totalIncome = summary?.income || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Análise do desempenho da barbearia</p>
        </div>

        {/* Period selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
            { value: 'year', label: 'Ano' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                period === opt.value ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Receita Total',
                value: `R$ ${(summary?.income || 0).toFixed(2)}`,
                icon: DollarSign,
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
              },
              {
                label: 'Despesas',
                value: `R$ ${(summary?.expenses || 0).toFixed(2)}`,
                icon: TrendingUp,
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-200',
              },
              {
                label: 'Lucro',
                value: `R$ ${(summary?.profit || 0).toFixed(2)}`,
                icon: BarChart2,
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                border: 'border-teal-200',
              },
              {
                label: 'Atendimentos',
                value: summary?.appointment_count || 0,
                icon: Scissors,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-200',
              },
            ].map(card => (
              <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-4`}>
                <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment methods breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600" />
                Formas de Pagamento
              </h3>
              {Object.keys(incomeByMethod).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(incomeByMethod)
                    .sort(([, a], [, b]) => b - a)
                    .map(([method, amount]) => {
                      const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                      return (
                        <div key={method}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{PAYMENT_LABELS[method] || method}</span>
                            <span className="text-gray-600">R$ {amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Últimas Transações
              </h3>
              {transactions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">Nenhuma transação</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.slice(0, 15).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{tx.description || tx.category}</p>
                        <p className="text-xs text-gray-400">{tx.date}</p>
                      </div>
                      <span className={`text-sm font-bold ml-3 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}R$ {Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary stats */}
          {summary && (
            <div className="mt-6 bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-4">Resumo do Período</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-teal-100 text-xs">Ticket Médio</p>
                  <p className="text-xl font-bold">
                    R$ {summary.appointment_count > 0 ? (summary.income / summary.appointment_count).toFixed(2) : '0,00'}
                  </p>
                </div>
                <div>
                  <p className="text-teal-100 text-xs">Margem de Lucro</p>
                  <p className="text-xl font-bold">
                    {summary.income > 0 ? ((summary.profit / summary.income) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-teal-100 text-xs">Atendimentos</p>
                  <p className="text-xl font-bold">{summary.appointment_count || 0}</p>
                </div>
                <div>
                  <p className="text-teal-100 text-xs">Novos Clientes</p>
                  <p className="text-xl font-bold">{summary.new_clients || 0}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
