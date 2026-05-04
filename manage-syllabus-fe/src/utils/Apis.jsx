import axios from "axios";

const BASE_URL = process.env.VITE_API_BASE_URL;
const CLIENT_ID = process.meta.env.VITE_CLIENT_ID;
const CLIENT_SECRET = process.meta.env.VITE_CLIENT_SECRET;

export const endpoints = {
    login: '/login',
    profile: '/users/current-user',
    users: '/users',
};


export default axios.create({
    baseURL: BASE_URL,
});

export const authApis = () => {
    const token = localStorage.getItem('access_token');
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export { CLIENT_ID, CLIENT_SECRET };

