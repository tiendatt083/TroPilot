import apiClient from './axiosClient.js';

export async function getAdminServiceFees() {
  const response = await apiClient.get('/api/admin/service-fees');
  return response.data;
}

export async function getAdminServiceFee(id) {
  const response = await apiClient.get(`/api/admin/service-fees/${id}`);
  return response.data;
}

export async function createAdminServiceFee(payload) {
  const response = await apiClient.post('/api/admin/service-fees', payload);
  return response.data;
}

export async function updateAdminServiceFee(id, payload) {
  const response = await apiClient.put(`/api/admin/service-fees/${id}`, payload);
  return response.data;
}

export async function deleteAdminServiceFee(id) {
  const response = await apiClient.delete(`/api/admin/service-fees/${id}`);
  return response.data;
}

export async function toggleAdminServiceFee(id) {
  const response = await apiClient.put(`/api/admin/service-fees/${id}/toggle`);
  return response.data;
}

export async function getStaffServiceFees() {
  const response = await apiClient.get('/api/staff/service-fees');
  return response.data;
}
