import { authApis, endpoints } from "../config/Apis";

class BlockService {
  static async getBlocks(templateId) {
    if (!templateId) return [];
    const res = await authApis().get(endpoints["template-blocks"](templateId));
    return res.data;
  }

  static async createBlock(templateId, blockData) {
    if (!templateId || !blockData) return null;
    const res = await authApis().post(endpoints["template-blocks"](templateId), blockData);
    return res.data;
  }

  static async updateBlock(blockId, blockData) {
    if (!blockId || !blockData) return null;
    const res = await authApis().patch(endpoints["block-detail"](blockId), blockData);
    return res.data;
  }

  static async deleteBlock(blockId) {
    if (!blockId) return false;
    await authApis().delete(endpoints["block-detail"](blockId));
    return true;
  }

  static async reorderBlocks(templateId, blocks) {
    if (!templateId || !blocks) return null;
    const res = await authApis().post(endpoints["template-blocks"](templateId), { blocks });
    return res.data;
  }

  static async previewInline(templateId, blockId, styleConfig, customColumns, withContext = false) {
    return previewInlineBlock(templateId, blockId, styleConfig, customColumns, withContext);
  }

  static async batchSaveBlock(templateId, blockId, payload) {
    if (!templateId || !blockId) return null;
    const res = await authApis().post(
      `/templates/${templateId}/blocks/${blockId}/batch-save/`,
      payload
    );
    return res.data;
  }

  static async bulkSpacing(templateId, payload) {
    if (!templateId) return null;
    const res = await authApis().post(
      endpoints["template-bulk-spacing"](templateId),
      payload
    );
    return res.data;
  }

  static async rollbackBulkSpacing(templateId) {
    if (!templateId) return null;
    const res = await authApis().post(
      endpoints["template-rollback-bulk-spacing"](templateId)
    );
    return res.data;
  }
}

export const previewInlineBlock = async (
  templateId,
  blockId,
  styleConfig,
  customColumns,
  withContext = false,
  blockConfig = undefined
) => {
  if (!templateId || !blockId) return null;
  const payload = {
    style_config: styleConfig || {},
    with_context: withContext,
  };
  if (customColumns !== undefined) {
    payload.custom_columns = customColumns;
  }
  if (blockConfig !== undefined) {
    payload.config = blockConfig;
  }
  const res = await authApis().post(
    `/templates/${templateId}/blocks/${blockId}/preview-inline/`,
    payload
  );
  return res.data;
};

export default BlockService;
