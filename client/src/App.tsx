import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Booking from './pages/Booking';
import Combos from './pages/Combos';
import Packages from './pages/Packages';
import MyAppointments from './pages/MyAppointments';

export default function App() {
  return (
    <ClientAuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/agendar" element={<Booking />} />
            <Route path="/combos" element={<Combos />} />
            <Route path="/pacotes" element={<Packages />} />
            <Route path="/meus-agendamentos" element={<MyAppointments />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ClientAuthProvider>
  );
}
