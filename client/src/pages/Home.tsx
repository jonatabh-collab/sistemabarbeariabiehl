import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Clock, DollarSign, Star, ChevronRight, Package, Tag } from 'lucide-react';
import { getServices, getCombos, getPackages } from '../services/api';

const SERVICE_ICONS: Record<string, string> = {
  'Corte': '✂️',
  'Barba': '🪒',
  'Corte + Barba': '✂️🪒',
  'Hidratação': '💧',
  'Sobrancelha': '👁️',
};

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    getServices().then(r => setServices(r.data.services?.filter((s: any) => s.active) || []));
    getCombos().then(r => setCombos(r.data.combos?.slice(0, 3) || []));
    getPackages().then(r => setPackages(r.data.packages?.slice(0, 3) || []));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0d7377] via-[#0d9488] to-[#0f766e] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
              <Scissors className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Barbearia Biehl</h1>
          <p className="text-teal-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Estilo, precisão e cuidado para o homem moderno. Agende seu horário online com os melhores profissionais.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/agendar"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-all text-lg shadow-lg">
              <Calendar />
              Agendar Agora
            </Link>
            <Link to="/combos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all text-lg border border-white/20">
              Ver Combos
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Clientes' },
              { value: '4', label: 'Profissionais' },
              { value: '5★', label: 'Avaliação' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-teal-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nossos Serviços</h2>
              <p className="text-gray-500 text-sm mt-1">Qualidade e precisão em cada atendimento</p>
            </div>
            <Link to="/agendar" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium">
              Agendar <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc: any) => (
              <Link key={svc.id} to={`/agendar?service=${svc.id}`}
                className="group bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-2xl p-5 transition-all">
                <div className="text-3xl mb-3">{SERVICE_ICONS[svc.name] || '✂️'}</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-teal-700 mb-1">{svc.name}</h3>
                {svc.description && <p className="text-sm text-gray-500 mb-3">{svc.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {svc.duration} min
                  </div>
                  <div className="font-bold text-teal-700">
                    R$ {svc.price.toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Combos */}
      {combos.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Combos Especiais</h2>
                <p className="text-gray-500 text-sm mt-1">Economize combinando serviços</p>
              </div>
              <Link to="/combos" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {combos.map((combo: any) => {
                const savings = combo.original_price - combo.price;
                return (
                  <div key={combo.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <Tag className="w-5 h-5 opacity-80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                          Economize R$ {savings.toFixed(2)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mt-2">{combo.name}</h3>
                      {combo.description && <p className="text-teal-100 text-xs mt-1">{combo.description}</p>}
                    </div>
                    <div className="p-4">
                      <div className="space-y-1 mb-4">
                        {combo.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                            {item.service_name}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-gray-400 line-through">R$ {combo.original_price.toFixed(2)}</span>
                          <p className="text-xl font-bold text-gray-800">R$ {combo.price.toFixed(2)}</p>
                        </div>
                        <Link to={`/agendar`}
                          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700">
                          Agendar
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pacotes de Fidelidade</h2>
                <p className="text-gray-500 text-sm mt-1">Pague menos vindo mais vezes</p>
              </div>
              <Link to="/pacotes" className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg: any) => (
                <div key={pkg.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                  </div>
                  {pkg.description && <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>}
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{pkg.sessions} sessões</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">R$ {pkg.price.toFixed(2)}</p>
                      <p className="text-xs text-teal-600">R$ {(pkg.price / pkg.sessions).toFixed(2)}/sessão</p>
                    </div>
                    <Link to="/pacotes"
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700">
                      Comprar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-white text-lg">Barbearia Biehl</span>
          </div>
          <p className="text-sm">Rua das Flores, 123 - Porto Alegre, RS</p>
          <p className="text-sm mt-1">Seg-Sáb: 08:00 - 20:00</p>
          <p className="text-xs mt-4 text-gray-600">© 2026 Barbearia Biehl. Todos os direitos reservados.</p>
        </div>
      </footer>
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
