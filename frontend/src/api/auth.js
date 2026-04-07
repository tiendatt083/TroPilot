import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  sendRegisterOtp: async (data) => {
    try {
      const response = await api.post('/auth/register/send-otp', data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  googleLogin: async (data) => {
    try {
      const response = await api.post('/auth/google', data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  forgotPassword: async (data) => {
    try {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  }
};
