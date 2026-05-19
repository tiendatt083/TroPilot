import apiClient from './axiosClient.js';

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function generateInvoice(payload) {
  const response = await apiClient.post('/api/staff/invoices/generate', payload);
  return response.data;
}

export async function getStaffInvoices(filters) {
  const response = await apiClient.get('/api/staff/invoices', filterConfig(filters));
  return response.data;
}

export async function getStaffInvoice(id, filters) {
  const response = await apiClient.get(`/api/staff/invoices/${id}`, filterConfig(filters));
  return response.data;
}

export async function getAdminInvoices(filters) {
  const response = await apiClient.get('/api/admin/invoices', filterConfig(filters));
  return response.data;
}

export async function getAdminInvoice(id, filters) {
  const response = await apiClient.get(`/api/admin/invoices/${id}`, filterConfig(filters));
  return response.data;
}

export async function getResidentInvoices() {
  const response = await apiClient.get('/api/resident/invoices');
  return response.data;
}

export async function getResidentInvoice(id) {
  const response = await apiClient.get(`/api/resident/invoices/${id}`);
  return response.data;
}
