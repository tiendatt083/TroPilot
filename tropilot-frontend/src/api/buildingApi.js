import apiClient from './axiosClient.js';

function searchConfig(search) {
  return search ? { params: { search } } : {};
}

export async function getAdminBuildings(search) {
  const response = await apiClient.get('/api/admin/buildings', searchConfig(search));
  return response.data;
}

export async function getAdminBuilding(id) {
  const response = await apiClient.get(`/api/admin/buildings/${id}`);
  return response.data;
}

export async function getAdminBuildingUsers(id) {
  const response = await apiClient.get(`/api/admin/buildings/${id}/users`);
  return response.data;
}

export async function createAdminBuilding(payload) {
  const response = await apiClient.post('/api/admin/buildings', payload);
  return response.data;
}

export async function updateAdminBuilding(id, payload) {
  const response = await apiClient.put(`/api/admin/buildings/${id}`, payload);
  return response.data;
}

export async function deleteAdminBuilding(id) {
  const response = await apiClient.delete(`/api/admin/buildings/${id}`);
  return response.data;
}

export async function getStaffBuildings(search) {
  const response = await apiClient.get('/api/staff/buildings', searchConfig(search));
  return response.data;
}

export async function getStaffBuilding(id) {
  const response = await apiClient.get(`/api/staff/buildings/${id}`);
  return response.data;
}
