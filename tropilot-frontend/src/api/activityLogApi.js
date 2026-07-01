import apiClient from './axiosClient.js';

export async function getAdminActivityLogs(action) {
  const params = action ? { action } : {};
  const response = await apiClient.get('/api/admin/activity-logs', { params });
  return response.data;
}

export async function getStaffActivityLogs(action) {
  const params = action ? { action } : {};
  const response = await apiClient.get('/api/staff/activity-logs/my', { params });
  return response.data;
}

export async function getMyActivityLogs(action) {
  const params = action ? { action } : {};
  const response = await apiClient.get('/api/activity-logs/me', { params });
  return response.data;
}
