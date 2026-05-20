import apiClient from './axiosClient.js';

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function requestResidentVehicle(payload) {
  const response = await apiClient.post('/api/resident/vehicles/request', payload);
  return response.data;
}

export async function getResidentVehicles() {
  const response = await apiClient.get('/api/resident/vehicles');
  return response.data;
}

export async function requestVehicleCancel(id) {
  const response = await apiClient.put(`/api/resident/vehicles/${id}/request-cancel`);
  return response.data;
}

export async function getAdminVehicles(filters) {
  const response = await apiClient.get('/api/admin/vehicles', filterConfig(filters));
  return response.data;
}

export async function getPendingVehicles(filters) {
  const response = await apiClient.get('/api/admin/vehicles/pending', filterConfig(filters));
  return response.data;
}

export async function approveVehicle(id, filters) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/approve`, null, filterConfig(filters));
  return response.data;
}

export async function rejectVehicle(id, filters) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/reject`, null, filterConfig(filters));
  return response.data;
}

export async function deactivateVehicle(id, filters) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/deactivate`, null, filterConfig(filters));
  return response.data;
}

export async function getStaffVehicles(filters) {
  const response = await apiClient.get('/api/staff/vehicles', filterConfig(filters));
  return response.data;
}
