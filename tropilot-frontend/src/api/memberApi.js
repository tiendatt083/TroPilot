import apiClient from './axiosClient.js';

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

export async function getPendingMembers() {
  const response = await apiClient.get('/api/admin/members/pending');
  return response.data;
}

export async function getAdminRoomMembers(roomId) {
  const response = await apiClient.get(`/api/admin/rooms/${roomId}/members`);
  return response.data;
}

export async function approveMember(id) {
  const response = await apiClient.put(`/api/admin/members/${id}/approve`);
  return response.data;
}

export async function rejectMember(id) {
  const response = await apiClient.put(`/api/admin/members/${id}/reject`);
  return response.data;
}
