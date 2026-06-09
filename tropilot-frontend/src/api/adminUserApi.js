import apiClient from './axiosClient.js';

export async function getUsers() {
  const response = await apiClient.get('/api/admin/users');
  return response.data;
}

export async function createUser(payload) {
  const response = await apiClient.post('/api/admin/users', payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await apiClient.put(`/api/admin/users/${id}`, payload);
  return response.data;
}

export async function lockUser(id) {
  const response = await apiClient.put(`/api/admin/users/${id}/lock`);
  return response.data;
}

export async function unlockUser(id) {
  const response = await apiClient.put(`/api/admin/users/${id}/unlock`);
  return response.data;
}

export async function resetPassword(id) {
  const response = await apiClient.put(`/api/admin/users/${id}/reset-password`);
  return response.data;
}
