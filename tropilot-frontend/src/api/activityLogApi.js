import apiClient from './axiosClient.js';

/** API lấy lịch sử thao tác của người dùng đang đăng nhập để hiển thị trang hoạt động cá nhân. */
export async function getMyActivityLogs() {
  const response = await apiClient.get('/api/activity-logs/me');
  return response.data;
}
