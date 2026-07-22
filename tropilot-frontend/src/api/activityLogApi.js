import apiClient from './axiosClient.js';

export async function getMyActivityLogs(query) {
  const params = query ? { query } : {};
  const response = await apiClient.get('/api/activity-logs/me', { params });
  return response.data;
}
