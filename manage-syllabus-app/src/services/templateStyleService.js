import {authApis, endpoints} from "../config/Apis";

class TemplateStyleService {

  static async getStyleConfig(templateId) {
    if (!templateId) {
      throw new Error("Template ID không hợp lệ.");
    }
    const response = await authApis().get(
      endpoints["template-style-config"](templateId),
    );
    return response.data;
  }

  static async saveDraftStyle(templateId, blockLayout) {
    if (!templateId || !blockLayout) {
      throw new Error("Thiếu template ID hoặc dữ liệu cấu hình style.");
    }
    const response = await authApis().patch(
      endpoints["template-style-config"](templateId),
      {block_layout: blockLayout},
    );
    return response.data;
  }

  static async publishStyle(templateId, blockLayout) {
    if (!templateId || !blockLayout) {
      throw new Error("Thiếu template ID hoặc dữ liệu cấu hình style.");
    }
    const response = await authApis().post(
      endpoints["template-publish-style"](templateId),
      {block_layout: blockLayout},
    );
    return response.data;
  }

  static async uploadAndCleanDocx(templateId, file) {
    if (!templateId || !file) {
      throw new Error("Thiếu template ID hoặc file DOCX.");
    }
    const formData = new FormData();
    formData.append("file", file);

    const response = await authApis().post(
      endpoints["template-upload-docx"](templateId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  static async previewStyle(templateId, blockLayout = null, syllabusId = null) {
    if (!templateId) {
      throw new Error("Template ID không hợp lệ.");
    }
    const payload = {};
    if (syllabusId) {
      payload.syllabus_id = syllabusId;
    }
    if (blockLayout) {
      payload.block_layout = blockLayout;
    }
    const response = await authApis().post(
      endpoints["template-preview"](templateId),
      payload,
    );
    return response.data;
  }

  static async updateMainSectionStyle(templateId, msId, styleConfig) {
    if (!templateId || !msId) {
      throw new Error("Template ID hoặc MainSection ID không hợp lệ.");
    }
    const response = await authApis().patch(
      endpoints["template-main-section-style"](templateId, msId),
      { style_config: styleConfig }
    );
    return response.data;
  }
}

export default TemplateStyleService;
