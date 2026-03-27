import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Professionals
export const getProfessionals = () => api.get('/api/professionals');
export const createProfessional = (data: any) => api.post('/api/professionals', data);
export const updateProfessional = (id: string, data: any) => api.put(`/api/professionals/${id}`, data);
export const deleteProfessional = (id: string) => api.delete(`/api/professionals/${id}`);

// Clients
export const getClients = (params?: any) => api.get('/api/clients', { params });
export const createClient = (data: any) => api.post('/api/clients', data);
export const updateClient = (id: string, data: any) => api.put(`/api/clients/${id}`, data);
export const deleteClient = (id: string) => api.delete(`/api/clients/${id}`);
export const getClientAppointments = (id: string) => api.get(`/api/clients/${id}/appointments`);

// Services
export const getServices = () => api.get('/api/services');
export const createService = (data: any) => api.post('/api/services', data);
export const updateService = (id: string, data: any) => api.put(`/api/services/${id}`, data);
export const deleteService = (id: string) => api.delete(`/api/services/${id}`);

// Appointments
export const getAppointments = (params?: any) => api.get('/api/appointments', { params });
export const createAppointment = (data: any) => api.post('/api/appointments', data);
export const updateAppointment = (id: string, data: any) => api.put(`/api/appointments/${id}`, data);
export const deleteAppointment = (id: string) => api.delete(`/api/appointments/${id}`);
export const getAvailableSlots = (params: any) => api.get('/api/appointments/available-slots', { params });

// Blocked times
export const getBlockedTimes = (params?: any) => api.get('/api/blocked-times', { params });
export const createBlockedTime = (data: any) => api.post('/api/blocked-times', data);
export const deleteBlockedTime = (id: string) => api.delete(`/api/blocked-times/${id}`);

// Combos
export const getCombos = () => api.get('/api/combos');
export const createCombo = (data: any) => api.post('/api/combos', data);
export const updateCombo = (id: string, data: any) => api.put(`/api/combos/${id}`, data);
export const deleteCombo = (id: string) => api.delete(`/api/combos/${id}`);

// Packages
export const getPackages = () => api.get('/api/packages');
export const createPackage = (data: any) => api.post('/api/packages', data);
export const updatePackage = (id: string, data: any) => api.put(`/api/packages/${id}`, data);
export const deletePackage = (id: string) => api.delete(`/api/packages/${id}`);

// Financial
export const getFinancialSummary = (params?: any) => api.get('/api/financial/summary', { params });
export const getTransactions = (params?: any) => api.get('/api/financial/transactions', { params });
export const createTransaction = (data: any) => api.post('/api/financial/transactions', data);

// Orders
export const getOrders = (params?: any) => api.get('/api/orders', { params });
export const createOrder = (data: any) => api.post('/api/orders', data);
export const updateOrder = (id: string, data: any) => api.put(`/api/orders/${id}`, data);
export const closeOrder = (id: string, data: any) => api.post(`/api/orders/${id}/close`, data);

// Waiting list
export const getWaitingList = (params?: any) => api.get('/api/waiting-list', { params });
export const addToWaitingList = (data: any) => api.post('/api/waiting-list', data);
export const updateWaitingStatus = (id: string, status: string) => api.put(`/api/waiting-list/${id}/status`, { status });
export const removeFromWaitingList = (id: string) => api.delete(`/api/waiting-list/${id}`);
