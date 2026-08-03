import apiClient from './axiosClient.js';

/** API đọc thông tin liên hệ chung và cho admin cập nhật thông tin ban quản lý. */
export async function getSystemContact() {
  const response = await apiClient.get('/api/contact');
  return response.data;
}

export async function updateSystemContact(payload) {
  const response = await apiClient.put('/api/admin/contact', payload);
  return response.data;
}
