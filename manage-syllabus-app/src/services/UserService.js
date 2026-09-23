import {authApis, endpoints} from "../config/Apis";

export const UserService = {
  getUsers: async (page = 1, filters = {}) => {
    const params = {page};

    if (filters.q) {
      params.q = filters.q;
    }

    if (filters.user_role) {
      params.user_role = filters.user_role;
    }

    if (filters.is_active !== undefined && filters.is_active !== null && filters.is_active !== "") {
      params.is_active = filters.is_active;
    }

    return authApis().get(endpoints["admin-users"], {params});
  },

  getUserDetail: async (userId) => {
    return authApis().get(endpoints["admin-user-detail"](userId));
  },

  updateUser: async (userId, data) => {
    return authApis().patch(endpoints["admin-user-detail"](userId), data);
  },

  deactivateUser: async (userId) => {
    return authApis().delete(endpoints["admin-user-detail"](userId));
  },

  activateUser: async (userId) => {
    return authApis().post(endpoints["admin-user-activate"](userId));
  },

  getFaculties: async () => {
    return authApis().get(endpoints["faculties"]);
  },
};
