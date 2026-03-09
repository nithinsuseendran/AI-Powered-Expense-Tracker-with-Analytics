import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update', data),
};

// Expense APIs
export const expenseAPI = {
    getAll: (params) => api.get('/expenses', { params }),
    getOne: (id) => api.get(`/expenses/${id}`),
    create: (data) => api.post('/expenses', data),
    update: (id, data) => api.put(`/expenses/${id}`, data),
    delete: (id) => api.delete(`/expenses/${id}`),
    bulkDelete: (ids) => api.post('/expenses/bulk/delete', { ids }),
};

// Category APIs
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Budget APIs
export const budgetAPI = {
    getAll: () => api.get('/budgets'),
    create: (data) => api.post('/budgets', data),
    delete: (id) => api.delete(`/budgets/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
    getSummary: () => api.get('/analytics/summary'),
    getTrends: (months) => api.get('/analytics/trends', { params: { months } }),
    getByCategory: (params) => api.get('/analytics/by-category', { params }),
    getDaily: (days) => api.get('/analytics/daily', { params: { days } }),
};

// Chat APIs
export const chatAPI = {
    getHistory: (limit) => api.get('/chat/history', { params: { limit } }),
    sendMessage: (message) => api.post('/chat/message', { message }),
    clearHistory: () => api.delete('/chat/clear'),
};

export default api;
