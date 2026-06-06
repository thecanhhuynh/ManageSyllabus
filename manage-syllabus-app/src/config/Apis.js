import axios from "axios";
import cookies from "react-cookies";
export const endpoints = {
  login: "/o/token/",
  register: "/register/",
  profile: "/users/current-user/",
};
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
export default axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

export const authApis = () => {
  const token = cookies.load("token");
  return axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
export {CLIENT_ID, CLIENT_SECRET};
