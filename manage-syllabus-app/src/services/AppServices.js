import {authApis, endpoints} from "../config/Apis";

export const AppServices = {
  getReqTypes: () => authApis().get(endpoints["type-requirements"]),

  getSubjects: (page, q) =>
    authApis().get(endpoints["subjects"], {
      params: {
        page,
        q,
      },
    }),

  getPLOs: (params) =>
    authApis().get(endpoints["programme-learning-outcomes"], {params}),

  getMaterials: (page, q) =>
    authApis().get(endpoints["materials"], {
      params: {
        page,
        q,
      },
    }),
};
