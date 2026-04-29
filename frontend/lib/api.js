import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('yash-auth');
      if (raw) {
        try {
          const { state } = JSON.parse(raw);
          if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
        } catch (_) { /* ignore */ }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('yash-auth');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ── API helpers ────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getRelated: (id) => api.get(`/products/${id}/related`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  createPaymentIntent: (data) => api.post('/orders/payment-intent', data),
};

export const reviewsApi = {
  getByProduct: (productId) => api.get(`/reviews/${productId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrder: (id, data) => api.put(`/admin/orders/${id}`, data),
  getProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
};

export default api;
