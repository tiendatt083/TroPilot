import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from '../utils/authStorage.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

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
  (response) => {
    if (response.data?.message) {
      response.data.message = translateInterfaceText(response.data.message);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/api/auth/login') {
      clearStoredAuth();
      window.dispatchEvent(new Event('tropilot:auth-expired'));
    }

    if (error.response?.data?.message) {
      error.response.data.message = translateInterfaceText(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
