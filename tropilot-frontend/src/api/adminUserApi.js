import apiClient from './axiosClient.js';

/** Các API quản trị tài khoản: xem danh sách, tạo tài khoản mới và xóa tài khoản. */
export async function getUsers() {
  const response = await apiClient.get('/api/admin/users');
  return response.data;
}

export async function createUser(payload) {
  const response = await apiClient.post('/api/admin/users', payload);
  return response.data;
}

export async function deleteUser(id) {
  const response = await apiClient.delete(`/api/admin/users/${id}`);
  return response.data;
}
