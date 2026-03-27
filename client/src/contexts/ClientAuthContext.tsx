import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientLogin } from '../services/api';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyalty_points?: number;
}

interface ClientAuthContextType {
  client: Client | null;
  token: string | null;
  login: (phone: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextType | null>(null);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('client_token');
    const storedClient = localStorage.getItem('client_data');
    if (storedToken && storedClient) {
      setToken(storedToken);
      setClient(JSON.parse(storedClient));
    }
  }, []);

  const login = async (phone: string, name?: string) => {
    const response = await clientLogin({ phone, name });
    const { token: newToken, client: newClient } = response.data;
    localStorage.setItem('client_token', newToken);
    localStorage.setItem('client_data', JSON.stringify(newClient));
    setToken(newToken);
    setClient(newClient);
  };

  const logout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_data');
    setToken(null);
    setClient(null);
  };

  return (
    <ClientAuthContext.Provider value={{ client, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error('useClientAuth must be used within ClientAuthProvider');
  return ctx;
}
