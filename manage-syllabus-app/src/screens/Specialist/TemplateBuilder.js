import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, message, Spin, Empty } from "antd";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { authApis, endpoints, springApi } from "../../config/Apis";
import TemplateStyleService from "../../services/templateStyleService";
import BlockService from "../../services/blockService";
import CustomColumnService from "../../services/customColumnService";

import BlockFormatDrawer from "../../components/BlockFormatDrawer";
import MainSectionFormatDrawer from "../../components/MainSectionFormatDrawer";
import HeaderFooterEditor from "../../components/HeaderFooterEditor";
import BulkSpacingModal from "../../components/BulkSpacingModal";

import DocxPreviewModal from "./template_builder/DocxPreviewModal";
import AddMainSectionModal from "./template_builder/AddMainSectionModal";
import CustomSubSectionModal from "./template_builder/CustomSubSectionModal";
import SortableMainSectionCard from "./template_builder/SortableMainSectionCard";
import TemplateStudioHeader from "./template_builder/TemplateStudioHeader";
import { DEFAULT_BLOCK_LAYOUT } from "./template_builder/constants";
import useTemplateSections from "./template_builder/hooks/useTemplateSections";
import useTemplateDocxPreview from "./template_builder/hooks/useTemplateDocxPreview";

const TemplateBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("synced");

  const [templateMeta, setTemplateMeta] = useState({ name: "", version: "", is_active: false });
  const [sections, setSections] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  const [attributeGroups, setAttributeGroups] = useState([]);
  const [blockLayout, setBlockLayout] = useState(DEFAULT_BLOCK_LAYOUT);
  const [publishedAt, setPublishedAt] = useState(null);
  const [canRollback, setCanRollback] = useState(false);

  const [blockDrawerOpen, setBlockDrawerOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [mainSectionDrawerOpen, setMainSectionDrawerOpen] = useState(false);
  const [selectedMainSection, setSelectedMainSection] = useState(null);

  const [headerFooterModalOpen, setHeaderFooterModalOpen] = useState(false);
  const [bulkSpacingModalOpen, setBulkSpacingModalOpen] = useState(false);
  const [addMainModalOpen, setAddMainModalOpen] = useState(false);
  const [addSubModalOpen, setAddSubModalOpen] = useState(false);
  const [activeSectionIdForSub, setActiveSectionIdForSub] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [tplRes, styleData, blockList, colList, attrRes] = await Promise.all([
        authApis().get(`${endpoints["templates"]}${id}/`),
        TemplateStyleService.getStyleConfig(id),
        BlockService.getBlocks(id),
        CustomColumnService.getCustomColumns(id),
        authApis().get(endpoints["attribute-groups"]),
      ]);

      setTemplateMeta({
        name: tplRes.data?.name || "",
        version: tplRes.data?.version || "",
        is_active: tplRes.data?.is_active || false,
      });

      const rawSections = Array.isArray(tplRes.data?.main_sections) ? tplRes.data.main_sections : [];
      const sortedSections = [...rawSections].sort((a, b) => (a.position || 0) - (b.position || 0));
      setSections(sortedSections);

      if (styleData?.block_layout) {
        setBlockLayout({ ...DEFAULT_BLOCK_LAYOUT, ...styleData.block_layout });
      }

      const layout = styleData?.block_layout || tplRes.data?.block_layout || {};
      setCanRollback(Boolean(layout.bulk_spacing_backup));
      setPublishedAt(styleData?.layout_published_at || null);
      setBlocks(Array.isArray(blockList) ? blockList : []);
      setCustomColumns(Array.isArray(colList) ? colList : []);
      setAttributeGroups(attrRes.data?.results || attrRes.data || []);
    } catch {
      message.error("Lỗi khi tải dữ liệu đề cương mẫu.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const blockMap = useMemo(() => {
    const map = {};
    (blocks || []).forEach((b) => {
      if (b.config?.code) map[b.config.code] = b;
      if (b.config?.table_code) map[b.config.table_code] = b;
      if (b.code) map[b.code] = b;
      if (b.name) map[b.name] = b;
    });
    return map;
  }, [blocks]);

  const autoSaveSections = async (nextSections, customMeta = null) => {
    if (!id) return;
    try {
      setSyncStatus("syncing");
      const meta = customMeta || templateMeta;
      await authApis().put(`${endpoints["templates"]}${id}/`, {
        name: meta.name,
        version: meta.version,
        main_sections: nextSections,
      });
      setSyncStatus("synced");

      const refreshedBlocks = await BlockService.getBlocks(id);
      if (Array.isArray(refreshedBlocks)) {
        setBlocks(refreshedBlocks);
      }
    } catch {
      setSyncStatus("error");
      message.error("Lỗi tự động lưu cấu trúc đề cương!");
    }
  };

  const {
    handleDragEnd,
    handleAddMainSection,
    handleRemoveMainSection,
    handleUpdateSectionName,
    handleAddSubSection,
    handleRemoveSubSection,
    handleUpdateSubName,
    handleUpdateTemplateName,
  } = useTemplateSections(sections, setSections, templateMeta, setTemplateMeta, autoSaveSections);

  const {
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
  } = useTemplateDocxPreview(id, blocks, blockLayout, setActionLoading);

  const handleOpenSubStyleDrawer = (block, sub) => {
    const targetBlock = block?.id ? block : { ...sub, block_type: sub.type || "text" };
    setSelectedBlock(targetBlock);
    setBlockDrawerOpen(true);
  };

  const handleSaveBlockDrawer = async (updatedBlock) => {
    try {
      const result = await BlockService.batchSaveBlock(id, updatedBlock.id, {
        style_config: updatedBlock.style_config,
        config: updatedBlock.config,
        label_overrides: updatedBlock.label_overrides,
        new_custom_columns: updatedBlock.new_custom_columns || [],
        updated_custom_columns: updatedBlock.updated_custom_columns || [],
      });

      const savedBlock = result?.block || updatedBlock;
      setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? savedBlock : b)));

      if (result?.block_layout) {
        setBlockLayout(result.block_layout);
      }

      const created = result?.created_custom_columns || [];
      const updated = result?.updated_custom_columns || [];
      if (created.length > 0 || updated.length > 0) {
        setCustomColumns((prev) => {
          let next = [...prev];
          updated.forEach((u) => {
            next = next.map((c) => (c.id === u.id ? u : c));
          });
          return [...next, ...created];
        });
      }

      message.success("Đã lưu định dạng block thành công!");
      setBlockDrawerOpen(false);
    } catch {
      message.error("Lỗi khi lưu định dạng block.");
    }
  };

  const handleCreateCustomColumn = async (colData) => {
    const res = await CustomColumnService.createCustomColumn(id, colData);
    setCustomColumns((prev) => [...prev, res]);
    message.success("Thêm cột tùy biến thành công!");
    return res;
  };

  const handleDeleteCustomColumn = (colId) => {
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleOpenSectionStyleDrawer = (sec) => {
    setSelectedMainSection(sec);
    setMainSectionDrawerOpen(true);
  };

  const handleSaveMainSectionStyle = async (styleConfig) => {
    if (!selectedMainSection) return;
    try {
      await TemplateStyleService.updateMainSectionStyle(id, selectedMainSection.id, styleConfig);
      setBlockLayout((prev) => ({
        ...prev,
        main_sections_style: {
          ...(prev?.main_sections_style || {}),
          [String(selectedMainSection.id)]: styleConfig,
        },
      }));
      message.success("Đã lưu định dạng Phần lớn.");
      setMainSectionDrawerOpen(false);
    } catch {
      message.error("Lỗi khi lưu định dạng Phần lớn.");
    }
  };

  const handleHeaderFooterUpdated = (hfData) => {
    setBlockLayout((prev) => ({ ...prev, header_footer: hfData }));
  };

  const handleBulkSpacingApplied = async (result) => {
    setCanRollback(Boolean(result?.can_rollback));
    await loadData();
  };

  const handleRollbackBulkSpacing = async () => {
    try {
      const res = await BlockService.rollbackBulkSpacing(id);
      message.success(`Đã hoàn tác spacing cho ${res?.restored_count ?? 0} mục.`);
      setCanRollback(false);
      await loadData();
    } catch {
      message.error("Hoàn tác spacing thất bại.");
    }
  };

  const handlePublish = async () => {
    if (!sections || sections.length === 0) {
      return message.error(
        "Template chưa có phần lớn (MainSection) nào. Không thể ban hành!",
      );
    }
    try {
      setActionLoading(true);
      const res = await TemplateStyleService.publishStyle(id, blockLayout);
      let cloneSuccess = false;
      try {
        await springApi().post(endpoints["publish-template"](id));
        cloneSuccess = true;
      } catch (springErr) {
        const errorMsg = springErr?.response?.data || springErr.message;
        message.warning(`Đã ban hành cấu hình mẫu, nhưng nhân bản đề cương thất bại: ${errorMsg}`);
      }
      setPublishedAt(res.layout_published_at || new Date().toISOString());
      setTemplateMeta((prev) => ({ ...prev, is_active: true }));
      if (cloneSuccess) {
        message.success("Ban hành đề cương mẫu và nhân bản toàn bộ đề cương thành công!");
      }
    } catch {
      message.error("Lỗi khi ban hành đề cương mẫu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveManual = async () => {
    try {
      setActionLoading(true);
      await autoSaveSections(sections);
      message.success("Đã lưu các thay đổi đề cương mẫu thành công!");
    } catch {
      message.error("Lỗi khi lưu thay đổi đề cương mẫu.");
    } finally {
      setActionLoading(false);
    }
  };

  const currentMainSectionStyle = useMemo(() => {
    if (!selectedMainSection?.id) return {};
    return blockLayout?.main_sections_style?.[String(selectedMainSection.id)] || {};
  }, [blockLayout?.main_sections_style, selectedMainSection?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <TemplateStudioHeader
        templateName={templateMeta.name}
        version={templateMeta.version}
        publishedAt={publishedAt}
        isActive={templateMeta.is_active}
        syncStatus={syncStatus}
        actionLoading={actionLoading}
        canRollback={canRollback}
        previewUrl={previewUrl}
        onBack={() => navigate("/specialist/templates")}
        onReload={loadData}
        onSaveManual={handleSaveManual}
        onUpdateTemplateName={handleUpdateTemplateName}
        onOpenAddMainModal={() => setAddMainModalOpen(true)}
        onOpenHeaderFooterModal={() => setHeaderFooterModalOpen(true)}
        onOpenBulkSpacingModal={() => setBulkSpacingModalOpen(true)}
        onRollbackBulkSpacing={handleRollbackBulkSpacing}
        onOpenDocxPreview={handleOpenDocxPreviewModal}
        onDownloadDocx={handleDownloadDocx}
        onPublish={handlePublish}
      />

      <div className="max-w-5xl mx-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.length === 0 ? (
              <Empty description="Chưa có phần lớn nào. Hãy thêm phần lớn đầu tiên!" />
            ) : (
              sections.map((section, index) => (
                <SortableMainSectionCard
                  key={section.id}
                  index={index}
                  section={section}
                  blockMap={blockMap}
                  onUpdateSectionName={handleUpdateSectionName}
                  onRemoveSection={handleRemoveMainSection}
                  onOpenSectionStyleDrawer={handleOpenSectionStyleDrawer}
                  onOpenAddSubModal={(secId) => {
                    setActiveSectionIdForSub(secId);
                    setAddSubModalOpen(true);
                  }}
                  onUpdateSubName={handleUpdateSubName}
                  onOpenSubStyleDrawer={handleOpenSubStyleDrawer}
                  onRemoveSub={handleRemoveSubSection}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>

      <BlockFormatDrawer
        open={blockDrawerOpen}
        onClose={() => setBlockDrawerOpen(false)}
        block={selectedBlock}
        templateId={id}
        blockLayout={blockLayout}
        customColumns={customColumns.filter(
          (c) =>
            c.table_code ===
            (selectedBlock?.config?.table_code || selectedBlock?.code?.toLowerCase()),
        )}
        onCreateCustomColumn={handleCreateCustomColumn}
        onDeleteCustomColumn={handleDeleteCustomColumn}
        onSave={handleSaveBlockDrawer}
        onPreview={handlePreviewFromDrawer}
      />

      <MainSectionFormatDrawer
        open={mainSectionDrawerOpen}
        onClose={() => setMainSectionDrawerOpen(false)}
        mainSection={selectedMainSection}
        styleConfig={currentMainSectionStyle}
        fallbackStyle={blockLayout?.named_styles?.SYLLABUS_HEADING_1}
        onSave={handleSaveMainSectionStyle}
        onPreview={(draft) => handlePreviewFromMainDrawer(draft, selectedMainSection)}
      />

      <Modal
        title="Quản lý Header & Footer đề cương"
        open={headerFooterModalOpen}
        onCancel={() => setHeaderFooterModalOpen(false)}
        footer={null}
        width={950}
        destroyOnClose
      >
        <HeaderFooterEditor templateId={id} onUpdated={handleHeaderFooterUpdated} />
      </Modal>

      <BulkSpacingModal
        open={bulkSpacingModalOpen}
        templateId={id}
        mainSections={sections}
        onApplied={handleBulkSpacingApplied}
        onClose={() => setBulkSpacingModalOpen(false)}
      />

      <DocxPreviewModal
        open={docxPreviewModalOpen}
        onClose={() => setDocxPreviewModalOpen(false)}
        previewUrl={previewUrl}
        hasRendered={hasDocxRendered}
        actionLoading={actionLoading}
        onRenderDocx={handlePreviewDocx}
        onDownloadDocx={handleDownloadDocx}
        docxContainerRef={docxContainerRef}
      />

      <AddMainSectionModal
        open={addMainModalOpen}
        onClose={() => setAddMainModalOpen(false)}
        onAddSection={handleAddMainSection}
        nextPosition={sections.length + 1}
      />

      <CustomSubSectionModal
        isOpen={addSubModalOpen}
        onClose={() => setAddSubModalOpen(false)}
        onAdd={handleAddSubSection}
        attributeGroups={attributeGroups}
        sectionId={activeSectionIdForSub}
        currentLength={
          sections.find((s) => s.id === activeSectionIdForSub)?.sub_sections?.length || 0
        }
      />
    </div>
  );
};

export default TemplateBuilder;
