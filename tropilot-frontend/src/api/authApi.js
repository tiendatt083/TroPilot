import apiClient from './axiosClient.js';

export async function login(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}

export async function changePasswordFirstTime(payload) {
  const response = await apiClient.post('/api/auth/change-password-first-time', payload);
  return response.data;
}
