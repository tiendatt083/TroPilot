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

export async function getAdminBuildingServiceFees(buildingId) {
  const response = await apiClient.get(`/api/admin/buildings/${buildingId}/service-fees`);
  return response.data;
}

export async function getAdminBuildingServiceFee(buildingId, id) {
  const response = await apiClient.get(`/api/admin/buildings/${buildingId}/service-fees/${id}`);
  return response.data;
}

export async function createAdminBuildingServiceFee(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/service-fees`, payload);
  return response.data;
}

export async function updateAdminBuildingServiceFee(buildingId, id, payload) {
  const response = await apiClient.put(`/api/admin/buildings/${buildingId}/service-fees/${id}`, payload);
  return response.data;
}

export async function deleteAdminBuildingServiceFee(buildingId, id) {
  const response = await apiClient.delete(`/api/admin/buildings/${buildingId}/service-fees/${id}`);
  return response.data;
}

export async function toggleAdminBuildingServiceFee(buildingId, id) {
  const response = await apiClient.put(`/api/admin/buildings/${buildingId}/service-fees/${id}/toggle`);
  return response.data;
}

export async function getStaffServiceFees() {
  const response = await apiClient.get('/api/staff/service-fees');
  return response.data;
}
