import Apis, {authApis, endpoints} from "../config/Apis";

export const AppServices = {
  // --- Requirement Subject ---
  getReqTypes: () => authApis().get(endpoints["type-requirements"]),

  getSubjects: (page, q) =>
    authApis().get(endpoints["subjects"], {
      params: {
        page,
        q,
      },
    }),

  // --- CLO & Objective Outcome ---
  getPLOs: () => authApis().get(endpoints["programme-learning-outcomes"]),

  // --- Learning Material ---
  getMaterials: (page, q) =>
    authApis().get(endpoints["materials"], {
      params: {
        page,
        q,
      },
    }),
};
