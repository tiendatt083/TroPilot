import apiClient from './axiosClient.js';

export async function generateInvoice(payload) {
  const response = await apiClient.post('/api/staff/invoices/generate', payload);
  return response.data;
}

export async function getStaffInvoices() {
  const response = await apiClient.get('/api/staff/invoices');
  return response.data;
}

export async function getStaffInvoice(id) {
  const response = await apiClient.get(`/api/staff/invoices/${id}`);
  return response.data;
}

export async function getAdminInvoices() {
  const response = await apiClient.get('/api/admin/invoices');
  return response.data;
}

export async function getAdminInvoice(id) {
  const response = await apiClient.get(`/api/admin/invoices/${id}`);
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
