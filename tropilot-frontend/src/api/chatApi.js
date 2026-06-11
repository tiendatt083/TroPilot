import apiClient from './axiosClient.js';

export async function sendChatMessage(payload) {
  const response = await apiClient.post('/api/chat/messages', payload);
  return response.data;
}
