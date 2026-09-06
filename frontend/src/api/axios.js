import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('budgetbuddy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('budgetbuddy_token');
      localStorage.removeItem('budgetbuddy_user');
    }
    return Promise.reject(error);
  }
);

export const parseApiError = (err, defaultMessage = 'An unexpected error occurred.') => {
  if (!err) return defaultMessage;
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => (d.msg ? `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}` : JSON.stringify(d))).join('; ');
    }
    if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  if (err.message) {
    return err.message;
  }
  return defaultMessage;
};

export default api;
