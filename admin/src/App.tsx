import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Agenda from './pages/Agenda';
import Clients from './pages/Cadastros/Clients';
import Professionals from './pages/Cadastros/Professionals';
import Services from './pages/Cadastros/Services';
import Financeiro from './pages/Financeiro';
import Comandas from './pages/Comandas';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/agenda" replace />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="profissionais" element={<Professionals />} />
              <Route path="servicos" element={<Services />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="comandas" element={<Comandas />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
