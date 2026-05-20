import apiClient from './axiosClient.js';

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function createResidentMember(payload) {
  const response = await apiClient.post('/api/resident/members', payload);
  return response.data;
}

export async function getResidentMembers() {
  const response = await apiClient.get('/api/resident/members');
  return response.data;
}

export async function updateResidentMember(id, payload) {
  const response = await apiClient.put(`/api/resident/members/${id}`, payload);
  return response.data;
}

export async function markResidentMemberLeft(id) {
  const response = await apiClient.put(`/api/resident/members/${id}/leave`);
  return response.data;
}

export async function getPendingMembers(filters) {
  const response = await apiClient.get('/api/admin/members/pending', filterConfig(filters));
  return response.data;
}

export async function getAdminBuildingMembers(filters) {
  const response = await apiClient.get('/api/admin/members', filterConfig(filters));
  return response.data;
}

export async function getAdminRoomMembers(roomId) {
  const response = await apiClient.get(`/api/admin/rooms/${roomId}/members`);
  return response.data;
}

export async function approveMember(id, filters) {
  const response = await apiClient.put(`/api/admin/members/${id}/approve`, null, filterConfig(filters));
  return response.data;
}

export async function rejectMember(id, filters) {
  const response = await apiClient.put(`/api/admin/members/${id}/reject`, null, filterConfig(filters));
  return response.data;
}
