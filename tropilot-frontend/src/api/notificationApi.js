import apiClient from './axiosClient.js';

/** Chuẩn hóa filter tòa nhà cho thông báo do admin quản lý. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** API tạo/xem thông báo và đánh dấu thông báo đã đọc cho người dùng hiện tại. */
export async function createAdminNotification(payload, filters) {
  const response = await apiClient.post('/api/admin/notifications', payload, filterConfig(filters));
  return response.data;
}

export async function getAdminNotifications(filters) {
  const response = await apiClient.get('/api/admin/notifications', filterConfig(filters));
  return response.data;
}

export async function getAdminSentNotifications(filters) {
  const response = await apiClient.get('/api/admin/notifications/sent', filterConfig(filters));
  return response.data;
}

export async function getMyNotifications() {
  const response = await apiClient.get('/api/notifications/me');
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.put(`/api/notifications/${id}/read`);
  return response.data;
}
