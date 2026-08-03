import apiClient from './axiosClient.js';

/** API gửi một tin nhắn đến trợ lý chat và nhận phản hồi đã được backend kiểm tra quyền/ngữ cảnh. */
export async function sendChatMessage(payload) {
  const response = await apiClient.post('/api/chat/messages', payload);
  return response.data;
}
