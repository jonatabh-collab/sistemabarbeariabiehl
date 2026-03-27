import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Menu, X, User, Calendar, Package, Tag, LogOut } from 'lucide-react';
import { useClientAuth } from '../contexts/ClientAuthContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { client, isAuthenticated, logout } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/agendar', label: 'Agendar', icon: Calendar },
    { to: '/combos', label: 'Combos', icon: Tag },
    { to: '/pacotes', label: 'Pacotes', icon: Package },
  ];

  return (
    <header className="bg-[#0d7377] shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">Barbearia Biehl</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to}
              className="px-4 py-2 text-sm font-medium text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link to="/meus-agendamentos"
              className="px-4 py-2 text-sm font-medium text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              Meus Agendamentos
            </Link>
          )}
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-white">{client?.name}</span>
              </div>
              <button onClick={handleLogout} className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-xl">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login"
              className="px-4 py-2 bg-white text-teal-700 text-sm font-semibold rounded-xl hover:bg-teal-50 transition-colors">
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b5e62] border-t border-teal-600">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/meus-agendamentos" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl">
                  <Calendar className="w-4 h-4" />
                  Meus Agendamentos
                </Link>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl">
                  <LogOut className="w-4 h-4" />
                  Sair ({client?.name})
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-teal-100 hover:text-white hover:bg-white/10 rounded-xl">
                <User className="w-4 h-4" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
