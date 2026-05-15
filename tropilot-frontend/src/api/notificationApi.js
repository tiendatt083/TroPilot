import apiClient from './axiosClient.js';

export async function createAdminNotification(payload) {
  const response = await apiClient.post('/api/admin/notifications', payload);
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
