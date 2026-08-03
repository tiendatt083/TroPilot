import apiClient from './axiosClient.js';

/** API khoản phí dịch vụ theo tòa nhà: admin quản lý, staff/cư dân chỉ xem theo quyền. */
export async function getAdminBuildingServiceFees(buildingId) {
  const response = await apiClient.get(`/api/admin/buildings/${buildingId}/service-fees`);
  return response.data;
}

export async function createAdminBuildingServiceFee(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/service-fees`, payload);
  return response.data;
}

export async function updateAdminBuildingServiceFee(buildingId, id, payload) {
  const response = await apiClient.put(`/api/admin/buildings/${buildingId}/service-fees/${id}`, payload);
  return response.data;
}

export async function deleteAdminBuildingServiceFee(buildingId, id) {
  const response = await apiClient.delete(`/api/admin/buildings/${buildingId}/service-fees/${id}`);
  return response.data;
}

export async function toggleAdminBuildingServiceFee(buildingId, id) {
  const response = await apiClient.put(`/api/admin/buildings/${buildingId}/service-fees/${id}/toggle`);
  return response.data;
}

export async function getStaffBuildingServiceFees(buildingId) {
  const response = await apiClient.get(`/api/staff/buildings/${buildingId}/service-fees`);
  return response.data;
}

export async function getResidentBuildingServiceFees() {
  const response = await apiClient.get('/api/resident/service-fees/current-building');
  return response.data;
}
