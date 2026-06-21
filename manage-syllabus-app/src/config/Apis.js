import axios from "axios";
import cookies from "react-cookies";
export const endpoints = {
  login: "/o/token/",
  register: "/register/",
  profile: "/users/current-user/",
  syllabuses: "/syllabuses/",
  "syllabus-detail": (syllabusId) => `/syllabuses/${syllabusId}/`,
  faculties: "/faculties/",
  subjects: "/subjects/",
  "attribute-groups": "/attribute-groups/",
  "type-requirements": "/type-requirements/",
  "programme-learning-outcomes": "/programme-learning-outcomes/",
  "learning-materials": "/learning-materials/",
  "type-materials": "/type-learning-materials/",
};
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
export default axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

export const authApis = () => {
  const token = cookies.load("token");
  const instance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response &&
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = cookies.load("refreshToken");
          if (refreshToken) {
            const res = await axios.post(
              `${process.env.REACT_APP_BASE_URL}/refresh-token`,
              {
                refreshToken,
              },
            );
            if (res.status === 200 && res.data.accessToken) {
              const newToken = res.data.accessToken;
              cookies.save("token", newToken, {path: "/"});
              cookies.save("refreshToken", res.data.refreshToken, {path: "/"});
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshErr) {
          console.error("Refresh token expired or failed", refreshErr);
          cookies.remove("token");
          cookies.remove("refreshToken");
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};
export {CLIENT_ID, CLIENT_SECRET};
