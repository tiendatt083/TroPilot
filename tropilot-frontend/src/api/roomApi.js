import apiClient from './axiosClient.js';

function filterConfig(filters = {}) {
  const params = {};

  if (filters.search) {
    params.search = filters.search;
  }

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function getAdminRooms(filters) {
  const response = await apiClient.get('/api/admin/rooms', filterConfig(filters));
  return response.data;
}

export async function getAdminRoom(id) {
  const response = await apiClient.get(`/api/admin/rooms/${id}`);
  return response.data;
}

export async function createAdminRoom(payload) {
  const response = await apiClient.post('/api/admin/rooms', payload);
  return response.data;
}

export async function updateAdminRoom(id, payload) {
  const response = await apiClient.put(`/api/admin/rooms/${id}`, payload);
  return response.data;
}

export async function deleteAdminRoom(id) {
  const response = await apiClient.delete(`/api/admin/rooms/${id}`);
  return response.data;
}

export async function getStaffRooms(filters) {
  const response = await apiClient.get('/api/staff/rooms', filterConfig(filters));
  return response.data;
}

export async function getStaffRoom(id) {
  const response = await apiClient.get(`/api/staff/rooms/${id}`);
  return response.data;
}
