import apiClient from './axiosClient.js';

export async function getAssignedRoom() {
  const response = await apiClient.get('/api/resident/room');
  return response.data;
}
