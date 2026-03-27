import { NavLink, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Scissors, DollarSign,
  LogOut, ChevronRight, Briefcase, ClipboardList,
  BarChart2, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/profissionais', icon: Briefcase, label: 'Profissionais' },
  { to: '/servicos', icon: Scissors, label: 'Serviços' },
  { to: '/comandas', icon: ClipboardList, label: 'Comandas' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-16 lg:w-60 bg-[#0d7377] flex flex-col h-full transition-all duration-300 shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-teal-600/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-white font-bold text-sm truncate">Barbearia Biehl</p>
            <p className="text-teal-200 text-xs">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-teal-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block text-sm font-medium flex-1">{label}</span>
            <ChevronRight className="hidden lg:block w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-teal-600/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: user?.color || '#10b981' }}
          >
            {user?.name?.charAt(0)}
          </div>
          <div className="hidden lg:block min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-teal-200 text-xs capitalize">{user?.role === 'admin' ? 'Administrador' : 'Barbeiro'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-teal-100 hover:bg-white/10 hover:text-white transition-all mt-1"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block text-sm">Sair</span>
        </button>
      </div>
    </div>
  );
}
