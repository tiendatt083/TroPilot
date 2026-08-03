import apiClient from './axiosClient.js';

// Task hoàn thành có thể đính kèm ảnh kết quả nên dùng multipart/form-data.
const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

/** Chuyển dữ liệu task có thể chứa ảnh thành FormData, bỏ qua trường chưa có giá trị. */
function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

/** Chuẩn hóa filter tòa nhà cho API task của admin. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** API công việc: admin CRUD theo tòa nhà, staff xem task được giao, bắt đầu và hoàn thành. */
export async function createAdminTask(payload, filters) {
  const response = await apiClient.post('/api/admin/tasks', payload, filterConfig(filters));
  return response.data;
}

export async function getAdminTasks(filters) {
  const response = await apiClient.get('/api/admin/tasks', filterConfig(filters));
  return response.data;
}

export async function getAdminTask(id, filters) {
  const response = await apiClient.get(`/api/admin/tasks/${id}`, filterConfig(filters));
  return response.data;
}

export async function updateAdminTask(id, payload, filters) {
  const response = await apiClient.put(`/api/admin/tasks/${id}`, payload, filterConfig(filters));
  return response.data;
}

export async function deleteAdminTask(id, filters) {
  const response = await apiClient.delete(`/api/admin/tasks/${id}`, filterConfig(filters));
  return response.data;
}

export async function getStaffTasks() {
  const response = await apiClient.get('/api/staff/tasks');
  return response.data;
}

export async function getStaffTask(id) {
  const response = await apiClient.get(`/api/staff/tasks/${id}`);
  return response.data;
}

export async function startStaffTask(id) {
  const response = await apiClient.put(`/api/staff/tasks/${id}/start`);
  return response.data;
}

export async function completeStaffTask(id, payload) {
  const response = await apiClient.put(`/api/staff/tasks/${id}/complete`, toFormData(payload), multipartConfig);
  return response.data;
}
