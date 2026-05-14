import apiClient from './axiosClient.js';

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

export async function getAdminVehicles() {
  const response = await apiClient.get('/api/admin/vehicles');
  return response.data;
}

export async function getPendingVehicles() {
  const response = await apiClient.get('/api/admin/vehicles/pending');
  return response.data;
}

export async function approveVehicle(id) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/approve`);
  return response.data;
}

export async function rejectVehicle(id) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/reject`);
  return response.data;
}

export async function deactivateVehicle(id) {
  const response = await apiClient.put(`/api/admin/vehicles/${id}/deactivate`);
  return response.data;
}

export async function getStaffVehicles() {
  const response = await apiClient.get('/api/staff/vehicles');
  return response.data;
}
