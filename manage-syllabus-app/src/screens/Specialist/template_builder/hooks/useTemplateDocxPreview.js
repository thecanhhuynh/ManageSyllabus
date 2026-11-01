import { useState, useRef } from "react";
import { message } from "antd";
import TemplateStyleService from "../../../../services/templateStyleService";

export const useTemplateDocxPreview = (id, blocks, blockLayout, setActionLoading) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hasDocxRendered, setHasDocxRendered] = useState(false);
  const [docxPreviewModalOpen, setDocxPreviewModalOpen] = useState(false);
  const docxContainerRef = useRef(null);

  const handlePreviewDocx = async (overrides = {}) => {
    try {
      setActionLoading(true);
      const baseBlockStyles = (blocks || []).reduce((acc, b) => {
        if (b?.code) acc[b.code] = b.style_config || {};
        return acc;
      }, {});
      const mergedBlockStyles = { ...baseBlockStyles, ...(overrides?.block_styles || {}) };

      const baseBlockConfigs = (blocks || []).reduce((acc, b) => {
        if (b?.code) acc[b.code] = b.config || {};
        return acc;
      }, {});
      const mergedBlockConfigs = { ...baseBlockConfigs, ...(overrides?.block_configs || {}) };

      const payloadLayout = {
        ...blockLayout,
        ...(overrides?.block_layout || {}),
        block_styles: mergedBlockStyles,
        block_configs: mergedBlockConfigs,
      };

      const res = await TemplateStyleService.previewStyle(id, payloadLayout);
      if (!res?.preview_url) {
        message.warning("Không nhận được URL file xem trước!");
        return;
      }
      setPreviewUrl(res.preview_url);

      const response = await fetch(res.preview_url);
      if (!response.ok) throw new Error("Không thể tải file xem trước.");
      const blob = await response.blob();

      const { renderAsync } = await import("docx-preview");
      let container = docxContainerRef.current;
      for (let i = 0; i < 10 && !container; i++) {
        await new Promise((r) => setTimeout(r, 60));
        container = docxContainerRef.current;
      }

      if (container) {
        container.innerHTML = "";
        await renderAsync(blob, container, null, {
          className: "docx-preview",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          renderHeaders: true,
          renderFooters: true,
        });
        setHasDocxRendered(true);
      }
      message.success("Render xem trước DOCX thành công!");
    } catch {
      message.error("Lỗi khi render bản xem trước DOCX.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDocxPreviewModal = async () => {
    setDocxPreviewModalOpen(true);
    await handlePreviewDocx();
  };

  const handlePreviewFromDrawer = async (draftBlockStyle, draftBlockConfig) => {
    if (!draftBlockStyle && !draftBlockConfig) return;
    setDocxPreviewModalOpen(true);
    await handlePreviewDocx({
      block_styles: draftBlockStyle,
      block_configs: draftBlockConfig,
    });
  };

  const handlePreviewFromMainDrawer = async (draftMainStyle, selectedMainSection) => {
    if (!draftMainStyle || !selectedMainSection) return;
    setDocxPreviewModalOpen(true);
    await handlePreviewDocx({
      block_layout: {
        main_sections_style: {
          ...(blockLayout?.main_sections_style || {}),
          [String(selectedMainSection.id)]: draftMainStyle,
        },
      },
    });
  };

  const handleDownloadDocx = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `preview_template_${id || "docx"}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    previewUrl,
    hasDocxRendered,
    docxPreviewModalOpen,
    setDocxPreviewModalOpen,
    docxContainerRef,
    handlePreviewDocx,
    handleOpenDocxPreviewModal,
    handlePreviewFromDrawer,
    handlePreviewFromMainDrawer,
    handleDownloadDocx,
  };
};

export default useTemplateDocxPreview;
