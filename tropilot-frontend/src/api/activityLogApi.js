import apiClient from './axiosClient.js';

export async function getMyActivityLogs() {
  const response = await apiClient.get('/api/activity-logs/me');
  return response.data;
}
