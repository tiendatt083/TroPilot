import apiClient from './axiosClient.js';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

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

function toMaintenanceFormData(payload) {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('content', payload.content);

  if (payload.image) {
    formData.append('image', payload.image);
  }

  return formData;
}

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

export async function requestResidentEquipmentMaintenance(equipmentId, payload) {
  const response = await apiClient.post(
    `/api/resident/equipment/${equipmentId}/maintenance-requests`,
    toMaintenanceFormData(payload),
    multipartConfig
  );
  return response.data;
}
