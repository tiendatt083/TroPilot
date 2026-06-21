import apiClient from './axiosClient.js';

export async function login(credentials) {
  const response = await apiClient.post('/api/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}

export async function updateCurrentUser(payload) {
  const response = await apiClient.put('/api/auth/me', payload);
  return response.data;
}

export async function changePasswordFirstTime(payload) {
  const response = await apiClient.post('/api/auth/change-password-first-time', payload);
  return response.data;
}

export async function requestPasswordResetCode(payload) {
  const response = await apiClient.post('/api/auth/forgot-password', payload);
  return response.data;
}

export async function resetPasswordWithCode(payload) {
  const response = await apiClient.post('/api/auth/reset-password', payload);
  return response.data;
}
