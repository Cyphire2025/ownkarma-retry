import axios from 'axios';

// Use environment variable or default to localhost
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

if (import.meta.env.PROD && BASE_URL.startsWith('http://')) {
    console.warn('[security] VITE_BACKEND_URL should use HTTPS in production');
}

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Products API
export const productsAPI = {
    // Get all products
    getAll: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    // Get products by page
    getByPage: async (pageName, activeOnly = true) => {
        const response = await api.get('/products', {
            params: {
                page: pageName,
                active: activeOnly
            }
        });
        return response.data;
    },

    // Get single product
    getById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    // Create product
    create: async (data) => {
        const response = await api.post('/products', data);
        return response.data;
    },

    // Update product
    update: async (id, data) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    // Delete product
    delete: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
};

// Categories API
export const categoriesAPI = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },
};

export default api;
