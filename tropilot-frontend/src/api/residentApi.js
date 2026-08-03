import apiClient from './axiosClient.js';

/** API lấy phòng ACTIVE đang được phân cho chủ hộ đang đăng nhập. */
export async function getAssignedRoom() {
  const response = await apiClient.get('/api/resident/room');
  return response.data.data;
}
