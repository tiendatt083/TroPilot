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

export async function createStaffExpense(payload) {
  const response = await apiClient.post('/api/staff/expenses', toFormData(payload), multipartConfig);
  return response.data;
}

export async function getStaffExpenses() {
  const response = await apiClient.get('/api/staff/expenses');
  return response.data;
}

export async function getStaffCashFlow(month) {
  const response = await apiClient.get('/api/staff/cashflow', {
    params: month ? { month } : {}
  });
  return response.data;
}

export async function getAdminExpenses() {
  const response = await apiClient.get('/api/admin/expenses');
  return response.data;
}

export async function cancelAdminExpense(id) {
  const response = await apiClient.put(`/api/admin/expenses/${id}/cancel`);
  return response.data;
}

export async function getAdminCashFlow(month) {
  const response = await apiClient.get('/api/admin/cashflow', {
    params: month ? { month } : {}
  });
  return response.data;
}
