import { useEffect, useState } from 'react';
import { Package, Star, Calendar, CheckCircle, ChevronRight, Lock } from 'lucide-react';
import { getPackages, purchasePackage } from '../services/api';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { client } = useClientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getPackages()
      .then(r => setPackages(r.data.packages?.filter((p: any) => p.active) || []))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (pkg: any) => {
    if (!client) {
      navigate('/login?redirect=/pacotes');
      return;
    }
    try {
      setPurchasing(pkg.id);
      await purchasePackage(pkg.id);
      setSuccess(pkg.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao adquirir pacote');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-100 rounded-2xl mb-4">
          <Package className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Pacotes de Fidelidade</h1>
        <p className="text-gray-500 mt-2">Pague menos vindo mais vezes. Sessões pré-pagas com desconto especial.</p>
      </div>

      {!client && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3 mb-8">
          <Lock className="w-5 h-5 text-teal-600 shrink-0" />
          <p className="text-sm text-teal-800">
            <Link to="/login?redirect=/pacotes" className="font-semibold underline">Entre na sua conta</Link> para adquirir pacotes.
          </p>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum pacote disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const pricePerSession = pkg.price / pkg.sessions;

            return (
              <div key={pkg.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-white">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-gray-300 text-sm mt-1">{pkg.description}</p>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Details */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <span className="text-sm text-gray-700">
                        Serviço: <span className="font-medium">{pkg.service_name || 'Consultar'}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 shrink-0" />
                      <span className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{pkg.sessions} sessões</span> incluídas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm text-gray-700">
                        Validade: <span className="font-medium">{pkg.validity_days} dias</span>
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-3xl font-bold text-gray-900">R$ {pkg.price.toFixed(2)}</p>
                    <p className="text-sm text-teal-600 font-medium">
                      R$ {pricePerSession.toFixed(2)} por sessão
                    </p>

                    {success === pkg.id ? (
                      <div className="mt-3 flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Pacote adquirido com sucesso!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.id}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60"
                      >
                        {purchasing === pkg.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            Comprar Pacote
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
