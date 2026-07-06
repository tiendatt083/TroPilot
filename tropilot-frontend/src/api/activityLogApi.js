import apiClient from './axiosClient.js';

export async function getAdminActivityLogs(query) {
  const params = query ? { query } : {};
  const response = await apiClient.get('/api/admin/activity-logs', { params });
  return response.data;
}

export async function getStaffActivityLogs(query) {
  const params = query ? { query } : {};
  const response = await apiClient.get('/api/staff/activity-logs/my', { params });
  return response.data;
}

export async function getMyActivityLogs(query) {
  const params = query ? { query } : {};
  const response = await apiClient.get('/api/activity-logs/me', { params });
  return response.data;
}
