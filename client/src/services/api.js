import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    updatePassword: (data) => api.put('/auth/password', data),
};

// Workouts
export const workoutAPI = {
    getAll: (params) => api.get('/workouts', { params }),
    getOne: (id) => api.get(`/workouts/${id}`),
    create: (data) => api.post('/workouts', data),
    update: (id, data) => api.put(`/workouts/${id}`, data),
    delete: (id) => api.delete(`/workouts/${id}`),
    getStats: (params) => api.get('/workouts/stats', { params }),
};

// Meals
export const mealAPI = {
    getAll: (params) => api.get('/meals', { params }),
    getOne: (id) => api.get(`/meals/${id}`),
    create: (data) => api.post('/meals', data),
    update: (id, data) => api.put(`/meals/${id}`, data),
    delete: (id) => api.delete(`/meals/${id}`),
    getDaily: (date) => api.get(`/meals/daily/${date}`),
    getStats: (params) => api.get('/meals/stats', { params }),
    getFavorites: () => api.get('/meals/favorites'),
};

// Progress
export const progressAPI = {
    getAll: (params) => api.get('/progress', { params }),
    getOne: (id) => api.get(`/progress/${id}`),
    create: (data) => api.post('/progress', data),
    update: (id, data) => api.put(`/progress/${id}`, data),
    delete: (id) => api.delete(`/progress/${id}`),
    calculateBMI: (data) => api.post('/progress/bmi', data),
    getAnalytics: (params) => api.get('/progress/analytics', { params }),
};

// Reminders
export const reminderAPI = {
    getAll: (params) => api.get('/reminders', { params }),
    getOne: (id) => api.get(`/reminders/${id}`),
    create: (data) => api.post('/reminders', data),
    update: (id, data) => api.put(`/reminders/${id}`, data),
    delete: (id) => api.delete(`/reminders/${id}`),
    toggle: (id) => api.patch(`/reminders/${id}/toggle`),
    getToday: () => api.get('/reminders/today'),
};

export default api;
