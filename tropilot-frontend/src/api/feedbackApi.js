import apiClient from './axiosClient.js';

/** Chuẩn hóa filter tòa nhà khi quản trị viên lọc phản hồi. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** API phản hồi/khiếu nại: cư dân tạo và xem, admin lọc, trả lời hoặc cập nhật trạng thái. */
export async function createResidentFeedback(payload) {
  const response = await apiClient.post('/api/resident/feedbacks', payload);
  return response.data;
}

export async function getResidentFeedbacks() {
  const response = await apiClient.get('/api/resident/feedbacks');
  return response.data;
}

export async function getAdminFeedbacks(filters) {
  const response = await apiClient.get('/api/admin/feedbacks', filterConfig(filters));
  return response.data;
}

export async function replyAdminFeedback(id, payload, filters) {
  const response = await apiClient.put(`/api/admin/feedbacks/${id}/reply`, payload, filterConfig(filters));
  return response.data;
}

export async function updateAdminFeedbackStatus(id, payload, filters) {
  const response = await apiClient.put(`/api/admin/feedbacks/${id}/status`, payload, filterConfig(filters));
  return response.data;
}
