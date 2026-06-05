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

export async function previewStaffBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/staff/buildings/${buildingId}/invoices/preview`, payload);
  return response.data;
}

export async function generateStaffBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/staff/buildings/${buildingId}/invoices/generate`, payload);
  return response.data;
}

export async function previewStaffBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/staff/buildings/${buildingId}/invoices/bulk-preview`, payload);
  return response.data;
}

export async function generateStaffBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/staff/buildings/${buildingId}/invoices/bulk-generate`, payload);
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

export async function previewBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/preview`, payload);
  return response.data;
}

export async function generateBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/generate`, payload);
  return response.data;
}

export async function previewBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/bulk-preview`, payload);
  return response.data;
}

export async function generateBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/bulk-generate`, payload);
  return response.data;
}

export async function deleteBuildingInvoice(buildingId, invoiceId) {
  const response = await apiClient.delete(`/api/admin/buildings/${buildingId}/invoices/${invoiceId}`);
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
