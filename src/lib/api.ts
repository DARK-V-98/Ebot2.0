// src/lib/api.ts — Axios API client with auth interceptors
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token', { path: '/' });
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password }).then(r => r.data);

export const register = (name: string, email: string, password: string) =>
  api.post('/api/auth/register', { name, email, password }).then(r => r.data);

export const getMe = () => api.get('/api/auth/me').then(r => r.data);

export const updateSettings = (data: object) =>
  api.patch('/api/auth/settings', data).then(r => r.data);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get('/api/dashboard/stats').then(r => r.data);

export const getDashboardInsights = () =>
  api.get('/api/dashboard/insights').then(r => r.data);

// ── Messages ──────────────────────────────────────────────────────────────────
export const getConversations = (params?: object) =>
  api.get('/api/messages', { params }).then(r => r.data);

export const getCustomerMessages = (customerId: number, params?: object) =>
  api.get(`/api/messages/${customerId}`, { params }).then(r => r.data);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = (params?: object) =>
  api.get('/api/orders', { params }).then(r => r.data);

export const getOrder = (id: number) =>
  api.get(`/api/orders/${id}`).then(r => r.data);

export const updateOrderStatus = (id: number, status: string) =>
  api.patch(`/api/orders/${id}/status`, { status }).then(r => r.data);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (params?: object) =>
  api.get('/api/products', { params }).then(r => r.data);

export const createProduct = (data: object) =>
  api.post('/api/products', data).then(r => r.data);

export const updateProduct = (id: number, data: object) =>
  api.put(`/api/products/${id}`, data).then(r => r.data);

export const deleteProduct = (id: number) =>
  api.delete(`/api/products/${id}`).then(r => r.data);

export const getCategories = () =>
  api.get('/api/products/categories').then(r => r.data);

export const syncProducts = (commit: boolean = false) =>
  api.post('/api/products/sync', { commit }).then(r => r.data);

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers = (params?: object) =>
  api.get('/api/customers', { params }).then(r => r.data);

export const getCustomer = (id: number) =>
  api.get(`/api/customers/${id}`).then(r => r.data);

export default api;
