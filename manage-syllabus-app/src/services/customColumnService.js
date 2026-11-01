import { authApis, endpoints } from "../config/Apis";

class CustomColumnService {
  static async getCustomColumns(templateId, tableCode = null) {
    if (!templateId) return [];
    const url = endpoints["template-custom-columns"](templateId);
    const params = tableCode ? { table_code: tableCode } : {};
    const res = await authApis().get(url, { params });
    return res.data;
  }

  static async createCustomColumn(templateId, data) {
    if (!templateId || !data) return null;
    const res = await authApis().post(endpoints["template-custom-columns"](templateId), data);
    return res.data;
  }

  static async updateCustomColumn(columnId, data) {
    if (!columnId || !data) return null;
    const res = await authApis().patch(endpoints["custom-column-detail"](columnId), data);
    return res.data;
  }

  static async delete(columnId) {
    if (!columnId) return null;
    const res = await authApis().delete(endpoints["custom-column-detail"](columnId));
    return res.data;
  }

  static async deleteCustomColumn(columnId) {
    if (!columnId) return false;
    await authApis().delete(endpoints["custom-column-detail"](columnId));
    return true;
  }

  static async getCustomValues(syllabusId, tableCode = null, objectId = null) {
    if (!syllabusId) return [];
    const url = endpoints["syllabus-custom-values"](syllabusId);
    const params = {};
    if (tableCode) params.table_code = tableCode;
    if (objectId) params.object_id = objectId;
    const res = await authApis().get(url, { params });
    return res.data;
  }

  static async saveCustomValues(syllabusId, values) {
    if (!syllabusId || !values) return null;
    const res = await authApis().post(endpoints["syllabus-custom-values"](syllabusId), { values });
    return res.data;
  }
}

export default CustomColumnService;
