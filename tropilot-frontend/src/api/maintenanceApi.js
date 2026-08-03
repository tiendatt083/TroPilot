import apiClient from './axiosClient.js';

// Request hoàn thành bảo trì có thể gửi ảnh kết quả nên cần multipart/form-data.
const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

/** Đưa filter tòa nhà vào query parameters nếu người dùng đã chọn tòa nhà. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** Chuyển dữ liệu hoàn thành bảo trì thành FormData, bỏ qua trường trống để backend không nhận giá trị rỗng. */
function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

/** API yêu cầu bảo trì theo từng role: cư dân xem, admin phân công, staff bắt đầu và hoàn thành. */
export async function getResidentMaintenanceRequests() {
  const response = await apiClient.get('/api/resident/maintenance-requests');
  return response.data;
}

export async function getAdminMaintenanceRequests(filters) {
  const response = await apiClient.get('/api/admin/maintenance-requests', filterConfig(filters));
  return response.data;
}

export async function assignAdminMaintenanceRequest(id, payload, filters) {
  const response = await apiClient.put(`/api/admin/maintenance-requests/${id}/assign`, payload, filterConfig(filters));
  return response.data;
}

export async function deleteAdminMaintenanceRequest(id, filters) {
  const response = await apiClient.delete(`/api/admin/maintenance-requests/${id}`, filterConfig(filters));
  return response.data;
}

export async function getStaffMaintenanceRequests(filters) {
  const response = await apiClient.get('/api/staff/maintenance-requests', filterConfig(filters));
  return response.data;
}

export async function startStaffMaintenanceRequest(id) {
  const response = await apiClient.put(`/api/staff/maintenance-requests/${id}/start`);
  return response.data;
}

export async function completeStaffMaintenanceRequest(id, payload) {
  const response = await apiClient.put(
    `/api/staff/maintenance-requests/${id}/complete`,
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}
