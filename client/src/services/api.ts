import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const getServices = () => api.get('/api/services');
export const getCombos = () => api.get('/api/combos');
export const getPackages = () => api.get('/api/packages');
export const getProfessionals = () => api.get('/api/professionals');
export const getAvailableSlots = (params: any) => api.get('/api/appointments/available-slots', { params });
export const createAppointment = (data: any) => api.post('/api/appointments', data);
export const getMyAppointments = (clientId: string) => api.get(`/api/clients/${clientId}/appointments`);
export const updateAppointment = (id: string, data: any) => api.put(`/api/appointments/${id}`, data);
export const purchasePackage = (id: string) => api.post(`/api/packages/${id}/purchase`);
export const clientLogin = (data: any) => api.post('/api/clients/login', data);
