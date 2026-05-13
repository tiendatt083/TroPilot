import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from '../utils/authStorage.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const { token } = getStoredAuth();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/api/auth/login') {
      clearStoredAuth();
      window.dispatchEvent(new Event('tropilot:auth-expired'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
