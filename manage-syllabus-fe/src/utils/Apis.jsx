import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const endpoints = {
    login: '/login',
    profile: '/profile',
    users: '/users',
    user_details: (user_id) => `users/${user_id}`,
    subjects: '/subjects',
    subject_details: (subject_id) => `subjects/${subject_id}`,
    syllabuses: '/syllabuses',
    roles: '/roles',
};


const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Token không hợp lệ hoặc đã hết hạn!');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_info');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;