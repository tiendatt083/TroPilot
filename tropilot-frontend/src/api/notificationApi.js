import apiClient from './axiosClient.js';

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function createAdminNotification(payload, filters) {
  const response = await apiClient.post('/api/admin/notifications', payload, filterConfig(filters));
  return response.data;
}

export async function getAdminNotifications(filters) {
  const response = await apiClient.get('/api/admin/notifications', filterConfig(filters));
  return response.data;
}

export async function getResidentNotifications() {
  const response = await apiClient.get('/api/resident/notifications');
  return response.data;
}

export async function getStaffNotifications() {
  const response = await apiClient.get('/api/staff/notifications');
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.put(`/api/notifications/${id}/read`);
  return response.data;
}
