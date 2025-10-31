import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const productAPI = {
  getAll: () => API.get('/Inventory'),
  getOne: (id) => API.get(`/Inventory/${id}`),
  create: (data) => API.post('/Inventory', data),
  update: (id, data) => API.put(`/Inventory/${id}`, data),
  delete: (id) => API.delete(`/Inventory/${id}`),
  getCount: () => API.get('/Inventory/stats')
};

export const userAPI = {
  getAll: () => API.get('/Users'),
  create: (data) => API.post('/Users', data),
  update: (id, data) => API.put(`/Users/${id}`, data),
  delete: (id) => API.delete(`/Users/${id}`)
};

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials)
};

export const salesAPI = {
  record: (payload) => API.post('/Sales', payload)
};

export const ordersAPI = {
  record: (payload) => API.post('/Orders', payload)
};

export default API;