import apiClient from './axiosClient.js';

/** Chuẩn hóa filter tòa nhà cho các API hợp đồng của admin. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** API hợp đồng: admin quản lý/tải tệp, cư dân xem, xác nhận hoặc báo lỗi hợp đồng của mình. */
export async function getAdminContracts(filters) {
  const response = await apiClient.get('/api/admin/contracts', filterConfig(filters));
  return response.data;
}

export async function getAdminContract(id, filters) {
  const response = await apiClient.get(`/api/admin/contracts/${id}`, filterConfig(filters));
  return response.data;
}

export async function uploadAdminContract(id, file, filters) {
  // Tệp hợp đồng phải gửi theo multipart/form-data thay vì JSON.
  const formData = new FormData();
  formData.append('file', file);

  const config = filterConfig(filters);
  const response = await apiClient.post(`/api/admin/contracts/${id}/upload`, formData, {
    ...config,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function getCurrentResidentContract() {
  const response = await apiClient.get('/api/resident/contracts/current');
  return response.data;
}

export async function confirmResidentContract(id) {
  const response = await apiClient.put(`/api/resident/contracts/${id}/confirm`);
  return response.data;
}

export async function reportResidentContractIssue(id) {
  const response = await apiClient.post(`/api/resident/contracts/${id}/report-error`);
  return response.data;
}
