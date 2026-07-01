import apiClient from './axiosClient.js';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

function queryConfig(month, filters = {}) {
  const params = {};

  if (month) {
    params.month = month;
  }

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function createStaffExpense(payload) {
  const response = await apiClient.post('/api/staff/expenses', toFormData(payload), multipartConfig);
  return response.data;
}

export async function getStaffExpenses(filters) {
  const response = await apiClient.get('/api/staff/expenses', filterConfig(filters));
  return response.data;
}

export async function getStaffCashFlow(month, filters) {
  const response = await apiClient.get('/api/staff/cashflow', queryConfig(month, filters));
  return response.data;
}

export async function getAdminExpenses(filters) {
  const response = await apiClient.get('/api/admin/expenses', filterConfig(filters));
  return response.data;
}

export async function cancelAdminExpense(id, filters) {
  const response = await apiClient.put(`/api/admin/expenses/${id}/cancel`, null, filterConfig(filters));
  return response.data;
}

export async function approveAdminExpense(id, filters) {
  const response = await apiClient.put(`/api/admin/expenses/${id}/approve`, null, filterConfig(filters));
  return response.data;
}

export async function getAdminCashFlow(month, filters) {
  const response = await apiClient.get('/api/admin/cashflow', queryConfig(month, filters));
  return response.data;
}
