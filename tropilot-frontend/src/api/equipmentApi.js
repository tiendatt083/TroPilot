import apiClient from './axiosClient.js';

// Cấu hình dùng cho request có ảnh đính kèm của yêu cầu bảo trì thiết bị.
const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

/** Chuyển các bộ lọc thiết bị có giá trị thành query parameters. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.scope) {
    params.scope = filters.scope;
  }

  if (filters.roomId) {
    params.roomId = filters.roomId;
  }

  if (filters.condition) {
    params.condition = filters.condition;
  }

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** Chuyển yêu cầu bảo trì thiết bị thành FormData để có thể kèm ảnh. */
function toMaintenanceFormData(payload) {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('content', payload.content);

  if (payload.image) {
    formData.append('image', payload.image);
  }

  if (payload.assignedToId) {
    formData.append('assignedToId', payload.assignedToId);
  }

  return formData;
}

/** API thiết bị theo role: admin CRUD, staff theo dõi/báo bảo trì, cư dân chỉ xem thiết bị được phép. */
export async function getAdminBuildingEquipment(buildingId, filters) {
  const response = await apiClient.get(
    `/api/admin/buildings/${buildingId}/equipment`,
    filterConfig(filters)
  );
  return response.data;
}

export async function getAdminEquipment(filters) {
  const response = await apiClient.get('/api/admin/equipment', filterConfig(filters));
  return response.data;
}

export async function createAdminEquipment(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/equipment`, payload);
  return response.data;
}

export async function updateAdminEquipment(buildingId, equipmentId, payload) {
  const response = await apiClient.put(
    `/api/admin/buildings/${buildingId}/equipment/${equipmentId}`,
    payload
  );
  return response.data;
}

export async function deleteAdminEquipment(buildingId, equipmentId) {
  const response = await apiClient.delete(
    `/api/admin/buildings/${buildingId}/equipment/${equipmentId}`
  );
  return response.data;
}

export async function getAdminEquipmentHistory(equipmentId) {
  const response = await apiClient.get(`/api/admin/equipment/${equipmentId}/maintenance-history`);
  return response.data;
}

export async function requestAdminEquipmentMaintenance(equipmentId, payload) {
  const response = await apiClient.post(
    `/api/admin/equipment/${equipmentId}/maintenance-requests`,
    toMaintenanceFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getStaffBuildingEquipment(buildingId, filters) {
  const response = await apiClient.get(
    `/api/staff/buildings/${buildingId}/equipment`,
    filterConfig(filters)
  );
  return response.data;
}

export async function getStaffEquipmentHistory(equipmentId) {
  const response = await apiClient.get(`/api/staff/equipment/${equipmentId}/maintenance-history`);
  return response.data;
}

export async function requestStaffEquipmentMaintenance(equipmentId, payload) {
  const response = await apiClient.post(
    `/api/staff/equipment/${equipmentId}/maintenance-requests`,
    toMaintenanceFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getResidentEquipment() {
  const response = await apiClient.get('/api/resident/equipment/current-room');
  return response.data;
}
