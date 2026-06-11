import apiClient from './axiosClient.js';

export async function getSystemContact() {
  const response = await apiClient.get('/api/contact');
  return response.data;
}

export async function updateSystemContact(payload) {
  const response = await apiClient.put('/api/admin/contact', payload);
  return response.data;
}
