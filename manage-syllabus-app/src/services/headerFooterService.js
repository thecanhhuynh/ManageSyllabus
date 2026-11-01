import { authApis, endpoints } from "../config/Apis";

class HeaderFooterService {
  static async getHeaderFooter(templateId) {
    if (!templateId) return {};
    const res = await authApis().get(endpoints["template-header-footer"](templateId));
    return res.data;
  }

  static async updateHeaderFooter(templateId, headerFooter) {
    if (!templateId || !headerFooter) return null;
    const res = await authApis().patch(
      endpoints["template-header-footer"](templateId),
      headerFooter
    );
    return res.data;
  }

  static async uploadLogo(templateId, file) {
    if (!templateId || !file) return null;
    const formData = new FormData();
    formData.append("logo", file);
    const url = endpoints["template-upload-logo"]
      ? endpoints["template-upload-logo"](templateId)
      : `/templates/${templateId}/upload-logo/`;
    const res = await authApis().post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  static async deleteLogo(templateId) {
    if (!templateId) return null;
    const url = endpoints["template-delete-logo"]
      ? endpoints["template-delete-logo"](templateId)
      : `/templates/${templateId}/delete-logo/`;
    const res = await authApis().delete(url);
    return res.data;
  }
}

export default HeaderFooterService;
