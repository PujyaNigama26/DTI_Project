// Central config for API requests

const API_BASE_URL = 'http://localhost:8080/api'; // Replace with your actual backend URL

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET', headers });
    if (!res.ok) throw new Error(await res.text() || 'An error occurred during GET request');
    return res.json();
  },

  post: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text() || 'An error occurred during POST request');
    return res.json();
  },

  put: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text() || 'An error occurred during PUT request');
    return res.json();
  },

  delete: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error(await res.text() || 'An error occurred during DELETE request');
    return res.json();
  },
};
