import apiClient from './axiosClient.js';

/** API lấy số liệu dashboard riêng cho admin, staff và cư dân theo quyền đăng nhập. */
export async function getAdminDashboard() {
  const response = await apiClient.get('/api/admin/dashboard');
  return response.data;
}

export async function getStaffDashboard() {
  const response = await apiClient.get('/api/staff/dashboard');
  return response.data;
}

export async function getResidentDashboard() {
  const response = await apiClient.get('/api/resident/dashboard');
  return response.data;
}
