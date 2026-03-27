import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { getCombos } from '../services/api';

export default function Combos() {
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCombos()
      .then(r => setCombos(r.data.combos?.filter((c: any) => c.active) || []))
      .finally(() => setLoading(false));
  }, []);

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
          <Tag className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Combos Especiais</h1>
        <p className="text-gray-500 mt-2">Combine serviços e economize. Agende agora!</p>
      </div>

      {combos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum combo disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {combos.map((combo) => {
            const savings = combo.original_price - combo.price;
            const pct = Math.round((savings / combo.original_price) * 100);
            const totalDuration = combo.items?.reduce((acc: number, i: any) => acc + (i.service_duration || 0), 0) || 0;

            return (
              <div key={combo.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{combo.name}</h3>
                      {combo.description && (
                        <p className="text-teal-100 text-sm mt-1">{combo.description}</p>
                      )}
                    </div>
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      -{pct}% OFF
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {/* Services included */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inclui:</p>
                    <div className="space-y-1.5">
                      {combo.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                          <span className="text-sm text-gray-700">{item.service_name}</span>
                          {item.service_duration && (
                            <span className="text-xs text-gray-400 ml-auto">{item.service_duration}min</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  {totalDuration > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Duração total: ~{totalDuration} minutos</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-400 line-through">
                        De R$ {combo.original_price.toFixed(2)}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {combo.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Economia de R$ {savings.toFixed(2)}
                      </p>
                    </div>
                    <Link
                      to={`/agendar`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                    >
                      Agendar
                      <ChevronRight className="w-4 h-4" />
                    </Link>
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
