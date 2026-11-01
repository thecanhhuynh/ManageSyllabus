import axios from "axios";
import cookies from "react-cookies";
export const endpoints = {
  login: "/o/token/",
  register: "/api/auth/register/",
  profile: "/users/current-user/",
  syllabuses: "/syllabuses/",
  "syllabus-detail": (syllabusId) => `/syllabuses/${syllabusId}/`,
  "syllabus-clos": (syllabusId) => `/syllabuses/${syllabusId}/clos/`,
  "syllabus-assessments": (syllabusId) =>
    `/syllabuses/${syllabusId}/assessments/`,
  "syllabus-learning-materials": (syllabusId) =>
    `/syllabuses/${syllabusId}/learning-materials/`,
  faculties: "/faculties/",
  "update-faculty": (facultyId) => `/faculties/${facultyId}/`,
  subjects: "/subjects/",
  "update-subject": (subjectId) => `/subjects/${subjectId}/`,
  "attribute-groups": "/attribute-groups/",
  "type-requirements": "/type-requirements/",
  "programme-learning-outcomes": "/programme-learning-outcomes/",
  "learning-materials": "/learning-materials/",
  "type-materials": "/type-learning-materials/",
  "schedule-groups": "/schedule-groups/",
  majors: "/majors/",
  "update-major": (majorId) => `/majors/${majorId}/`,
  "training-programs": "/training-programs/",
  "update-training-program": (trainingProgramId) =>
    `/training-programs/${trainingProgramId}/`,
  "syllabuses-programs": (programId) =>
    `/training-programs/${programId}/syllabuses/`,
  lecturers: "/lecturers/",
  templates: "/templates/",
  "clone-templates": (templateId) => `/templates/${templateId}/clone/`,
  "publish-template": (templateId) => `/publish-template/${templateId}`,
  "template-style-config": (templateId) => `/templates/${templateId}/style-config/`,
  "template-publish-style": (templateId) => `/templates/${templateId}/publish-style/`,
  "template-upload-docx": (templateId) => `/templates/${templateId}/upload-docx/`,
  "template-preview": (templateId) => `/templates/${templateId}/preview/`,
  "template-blocks": (templateId) => `/templates/${templateId}/blocks/`,
  blocks: "/blocks/",
  "block-detail": (blockId) => `/blocks/${blockId}/`,
  "template-custom-columns": (templateId) => `/templates/${templateId}/custom-columns/`,
  "custom-columns": "/custom-columns/",
  "custom-column-detail": (columnId) => `/custom-columns/${columnId}/`,
  "template-header-footer": (templateId) => `/templates/${templateId}/header-footer/`,
  "template-upload-logo": (templateId) => `/templates/${templateId}/upload-logo/`,
  "template-delete-logo": (templateId) => `/templates/${templateId}/delete-logo/`,
  "template-main-section-style": (templateId, msId) => `/templates/${templateId}/main-sections/${msId}/style/`,
  "template-bulk-spacing": (templateId) => `/templates/${templateId}/bulk-spacing/`,
  "template-rollback-bulk-spacing": (templateId) => `/templates/${templateId}/rollback-bulk-spacing/`,
  "syllabus-custom-values": (syllabusId) => `/syllabuses/${syllabusId}/custom-values/`,
  "export-docx": (syllabusId) => `/export-syllabus/${syllabusId}/`,
  "sse/sync-stream/": "/sse/sync-stream/",
  "admin-users": "/admin/users/",
  "admin-user-detail": (id) => `/admin/users/${id}/`,
  "admin-user-activate": (id) => `/admin/users/${id}/activate/`,
};
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
export default axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

export const authApis = () => {
  const token = cookies.load("token");
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const instance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers,
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const is401 = error?.response?.status === 401;

      if (!is401 || originalRequest?._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = cookies.load("refreshToken");

      if (!refreshToken) {
        cookies.remove("token", {path: "/"});
        cookies.remove("refreshToken", {path: "/"});
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/o/token/`,
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        const newToken = res?.data?.access_token;
        if (!newToken) {
          throw new Error("No access token returned from refresh");
        }

        cookies.save("token", newToken, {path: "/"});
        if (res.data?.refresh_token) {
          cookies.save("refreshToken", res.data.refresh_token, {path: "/"});
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshErr) {
        console.error("Refresh token expired or failed", refreshErr);
        cookies.remove("token", {path: "/"});
        cookies.remove("refreshToken", {path: "/"});
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    },
  );

  return instance;
};
export {CLIENT_ID, CLIENT_SECRET};

export const springApi = () => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_SPRING_API_URL,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = cookies.load("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  return instance;
};
