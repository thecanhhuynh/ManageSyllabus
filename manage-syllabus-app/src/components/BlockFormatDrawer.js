import React, { useState, useEffect, useMemo } from "react";
import { Drawer, Tag, Button, Collapse, Radio, Divider, message } from "antd";
import { BlockInlinePreview } from "./block_preview";
import TableColumnWidthControl from "./TableColumnWidthControl";
import CustomColumnService from "../services/customColumnService";
import {
  EyeOutlined,
  FormatPainterOutlined,
  PushpinOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  TABLE_DEFAULT_COLUMNS,
  DEFAULT_COLUMN_LABELS,
  ADMINISTRATIVE_COLORS,
  NESTED_TABLE_LEVELS,
  UNSUPPORTED_CUSTOM_COLUMN,
  StyleControls,
  CustomColumnSection,
  CustomColumnModal,
  DrawerFooterActions,
} from "./block_styler";

const areObjectsEqual = (a, b) => {
  if (a === b) return true;
  if (!a && !b) return true;
  if (!a || !b) return false;
  const cleanA = Object.fromEntries(
    Object.entries(a).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const cleanB = Object.fromEntries(
    Object.entries(b).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  );
  const keysA = Object.keys(cleanA);
  const keysB = Object.keys(cleanB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => cleanA[k] === cleanB[k]);
};

export { StyleControls, DEFAULT_COLUMN_LABELS, ADMINISTRATIVE_COLORS };

const BlockFormatDrawer = ({
  open,
  visible,
  onClose,
  block,
  templateId,
  blockLayout,
  customColumns = [],
  onCreateCustomColumn,
  onDeleteCustomColumn,
  onSave,
  onPreview,
}) => {
  const [titleStyle, setTitleStyle] = useState({});
  const [contentStyle, setContentStyle] = useState({});
  const [displayType, setDisplayType] = useState("TABLE");
  const [textFormat, setTextFormat] = useState("INLINE");
  const [columnOverrides, setColumnOverrides] = useState({});
  const [columnWidthFormula, setColumnWidthFormula] = useState("");
  const [cellAlignments, setCellAlignments] = useState({});
  const [tableLabelOverrides, setTableLabelOverrides] = useState({});
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [draftCustomColumns, setDraftCustomColumns] = useState([]);

  const resolvedTemplateId = templateId || block?.template || block?.template_id;

  useEffect(() => {
    if (!block?.id) return;
    const resolvedCode =
      (block.config || {}).table_code ||
      (block.config || {}).code ||
      block.code?.toLowerCase();
    const filtered = (customColumns || []).filter(
      (c) => !c.table_code || c.table_code === resolvedCode,
    );
    setDraftCustomColumns(filtered);
  }, [block, customColumns]);

  useEffect(() => {
    if (!block) return;
    const rawCfg = block.style_config || {};
    if (rawCfg.title_style || rawCfg.content_style) {
      setTitleStyle(rawCfg.title_style || {});
      setContentStyle(rawCfg.content_style || {});
    } else {
      setTitleStyle({});
      setContentStyle(rawCfg);
    }
    setDisplayType((block.config || {}).display_type || "TABLE");
    setTextFormat((block.config || {}).text_format || "INLINE");
    setColumnOverrides((block.config || {}).column_overrides || {});
    setColumnWidthFormula((block.config || {}).column_widths_formula || "");
    setCellAlignments((block.config || {}).cell_alignments || {});
    const resolvedCode = (block.config || {}).table_code || (block.config || {}).code || block.code?.toLowerCase();
    const existingLabels = blockLayout?.label_overrides?.[resolvedCode] || {};
    setTableLabelOverrides({ ...existingLabels });
  }, [block, blockLayout]);

  const tableCode =
    block?.config?.table_code ||
    block?.config?.code ||
    block?.code?.toLowerCase();
  const isTableBlock =
    (block?.block_type === "table" ||
      (block?.block_type === "reference" && tableCode !== "learning_material")) &&
    displayType === "TABLE";
  const levelOptions = NESTED_TABLE_LEVELS[tableCode] || null;
  const isNested = Boolean(levelOptions);
  const supportsCustomColumn = isTableBlock && tableCode && !UNSUPPORTED_CUSTOM_COLUMN.has(tableCode);
  const isDisplayTypeSupported = ["credit", "lecturer_info"].includes(tableCode);

  const namedStyles = blockLayout?.named_styles || {};
  const defaultTitleStyle = namedStyles.SYLLABUS_HEADING_2 || {
    font_name: "Times New Roman",
    font_size_pt: 13,
    alignment: "LEFT",
    bold: true,
  };
  const defaultContentStyle = isTableBlock
    ? (blockLayout?.table_structures?.SYLLABUS_TABLE_BODY || {
        font_name: "Times New Roman",
        font_size_pt: 12,
        alignment: "LEFT",
        bold: false,
        line_spacing: 1.15,
        space_before_pt: 0,
        space_after_pt: 6,
      })
    : (namedStyles.SYLLABUS_BODY || {
        font_name: "Times New Roman",
        font_size_pt: 13,
        alignment: "JUSTIFY",
        bold: false,
        line_spacing: 1.15,
        space_before_pt: 0,
        space_after_pt: 6,
      });

  const baseCols = (() => {
    if (block?.block_type === "table" && Array.isArray(block.table_schema?.columns) && block.table_schema.columns.length > 0) {
      return block.table_schema.columns.map((c, idx) => {
        const k = c.field || c.id || `col_${idx}`;
        return tableLabelOverrides[k] || c.headerName || c.field || c.id || `Cột ${idx + 1}`;
      });
    }
    const defCols = DEFAULT_COLUMN_LABELS[tableCode];
    if (defCols) {
      return defCols.map((c) => tableLabelOverrides[c.key] || c.defaultLabel);
    }
    return TABLE_DEFAULT_COLUMNS[tableCode] || ["Cột 1", "Cột 2", "Cột 3"];
  })();

  const defaultCols = (() => {
    if (block?.block_type === "table" && Array.isArray(block.table_schema?.columns) && block.table_schema.columns.length > 0) {
      return block.table_schema.columns.map((c, idx) => ({
        key: c.field || c.id || `col_${idx}`,
        defaultLabel: c.headerName || c.field || `Cột ${idx + 1}`,
      }));
    }
    if (DEFAULT_COLUMN_LABELS[tableCode]) {
      return DEFAULT_COLUMN_LABELS[tableCode];
    }
    if (TABLE_DEFAULT_COLUMNS[tableCode]) {
      return TABLE_DEFAULT_COLUMNS[tableCode].map((label, idx) => ({
        key: `col_${idx}`,
        defaultLabel: label,
      }));
    }
    return baseCols.map((label, idx) => ({
      key: `col_${idx}`,
      defaultLabel: label,
    }));
  })();

  const tableCustomCols = (draftCustomColumns || []).filter(
    (col) => !col.table_code || col.table_code === tableCode
  );

  const columnsMetadata = [
    ...defaultCols.map((col, idx) => ({
      ci: idx,
      key: col.key,
      defaultLabel: col.defaultLabel,
      currentLabel: tableLabelOverrides[col.key] || col.defaultLabel,
      isModified: Boolean(tableLabelOverrides[col.key] && tableLabelOverrides[col.key].trim()),
      isCustom: false,
    })),
    ...tableCustomCols.map((col, idx) => ({
      ci: defaultCols.length + idx,
      key: col.column_key || `custom_${col.id}`,
      id: col.id,
      column_type: col.column_type || "text",
      defaultLabel: col.column_label || "Cột tùy biến",
      currentLabel: col.column_label || "",
      isModified: false,
      isCustom: true,
    })),
  ];

  const handleUpdateColumnLabel = (colMeta, newLabel) => {
    if (!colMeta.isCustom) {
      const next = { ...tableLabelOverrides };
      if (!newLabel || !newLabel.trim()) {
        delete next[colMeta.key];
      } else {
        next[colMeta.key] = newLabel;
      }
      setTableLabelOverrides(next);
      return;
    }
    handleUpdateCustomColumnLabel(colMeta.id || colMeta.key, newLabel);
  };

  const handleResetColumnLabel = (colMeta) => {
    if (colMeta.isCustom) return;
    const next = { ...tableLabelOverrides };
    delete next[colMeta.key];
    setTableLabelOverrides(next);
    message.info(`Đã khôi phục tiêu đề cột "${colMeta.defaultLabel}" về mặc định.`);
  };

  const effectiveTableCols = tableCode === "lecturer_info"
    ? baseCols
    : [...baseCols, ...tableCustomCols.map((c) => c.column_label || "Cột mới")];

  const updateTitleStyle = (key, val) => setTitleStyle((prev) => ({ ...prev, [key]: val }));
  const updateContentStyle = (key, val) => setContentStyle((prev) => ({ ...prev, [key]: val }));

  const handlePreview = async () => {
    if (!block || !onPreview || previewLoading) return;
    setPreviewLoading(true);
    try {
      await onPreview(
        { [block.code]: { title_style: titleStyle, content_style: contentStyle } },
        {
          [block.code]: {
            ...(block.config || {}),
            display_type: displayType,
            text_format: textFormat,
            column_overrides: columnOverrides,
            column_widths_formula: columnWidthFormula,
            cell_alignments: cellAlignments,
          },
        }
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = () => {
    if (!onSave) return;
    const newCols = draftCustomColumns.filter((c) => c.is_draft);
    const updatedCols = draftCustomColumns.filter((c) => !c.is_draft && c.is_dirty);
    onSave({
      ...block,
      style_config: { title_style: titleStyle, content_style: contentStyle },
      config: {
        ...(block.config || {}),
        display_type: displayType,
        text_format: textFormat,
        column_overrides: columnOverrides,
        column_widths_formula: columnWidthFormula,
        cell_alignments: cellAlignments,
      },
      label_overrides: tableLabelOverrides,
      tableCode,
      new_custom_columns: newCols.map((c) => ({
        column_label: c.column_label,
        column_type: c.column_type,
        default_value: c.default_value,
        level: c.level || "root",
      })),
      updated_custom_columns: updatedCols.map((c) => ({
        id: c.id,
        column_label: c.column_label,
        column_type: c.column_type,
        default_value: c.default_value,
        level: c.level || "root",
      })),
    });
  };

  const isDirty = useMemo(() => {
    if (!block) return false;
    const rawCfg = block.style_config || {};
    const initTitle = rawCfg.title_style || {};
    const initContent = rawCfg.content_style || (rawCfg.title_style ? {} : rawCfg);
    if (!areObjectsEqual(titleStyle, initTitle)) return true;
    if (!areObjectsEqual(contentStyle, initContent)) return true;

    const cfg = block.config || {};
    if (isDisplayTypeSupported && (cfg.display_type || "TABLE") !== displayType) return true;
    if (isDisplayTypeSupported && tableCode === "credit" && (cfg.text_format || "INLINE") !== textFormat) return true;
    if ((cfg.column_widths_formula || "") !== columnWidthFormula) return true;
    if (!areObjectsEqual(cellAlignments, cfg.cell_alignments || {})) return true;
    if (!areObjectsEqual(columnOverrides, cfg.column_overrides || {})) return true;

    const resolvedCode = cfg.table_code || cfg.code || block.code?.toLowerCase();
    const initLabels = blockLayout?.label_overrides?.[resolvedCode] || {};
    if (!areObjectsEqual(tableLabelOverrides, initLabels)) return true;

    if (draftCustomColumns.some((c) => c.is_draft || c.is_dirty)) return true;
    const initialCustomCount = (customColumns || []).filter(
      (c) => !c.table_code || c.table_code === resolvedCode
    ).length;
    if (draftCustomColumns.length !== initialCustomCount) return true;

    return false;
  }, [
    block,
    blockLayout,
    titleStyle,
    contentStyle,
    displayType,
    textFormat,
    columnWidthFormula,
    cellAlignments,
    columnOverrides,
    tableLabelOverrides,
    draftCustomColumns,
    customColumns,
    isDisplayTypeSupported,
    tableCode,
  ]);

  const handleOpenAddColumn = () => {
    setEditingColumn(null);
    setIsColModalOpen(true);
  };

  const handleOpenEditColumn = (col) => {
    setEditingColumn(col);
    setIsColModalOpen(true);
  };

  const handleApplyPreset = (preset) => {
    setEditingColumn(null);
    setDraftCustomColumns((prev) => [
      ...prev,
      {
        column_key: `custom_${tableCode}_draft_${Date.now()}`,
        column_label: preset.label,
        column_type: preset.column_type,
        default_value: preset.default_value,
        level: "root",
        is_draft: true,
      },
    ]);
  };

  const handleColumnFormSubmit = (values) => {
    if (editingColumn) {
      setDraftCustomColumns((prev) =>
        prev.map((c) => {
          if (c.column_key !== editingColumn.column_key && c.id !== editingColumn.id) return c;
          return {
            ...c,
            column_label: values.column_label,
            column_type: values.column_type || c.column_type,
            default_value: values.default_value || "",
            level: values.level || "root",
            is_dirty: !c.is_draft,
          };
        })
      );
    } else {
      setDraftCustomColumns((prev) => [
        ...prev,
        {
          column_key: `custom_${tableCode}_draft_${Date.now()}`,
          column_label: values.column_label,
          column_type: values.column_type || "text",
          default_value: values.default_value || "",
          level: values.level || "root",
          is_draft: true,
        },
      ]);
    }
    setIsColModalOpen(false);
  };

  const handleRemoveCustomColumn = async (col) => {
    if (!col) return;
    if (col.is_draft) {
      setDraftCustomColumns((prev) => prev.filter((c) => c.column_key !== col.column_key));
      return;
    }
    try {
      await CustomColumnService.delete(col.id);
      setDraftCustomColumns((prev) => prev.filter((c) => c.column_key !== col.column_key && c.id !== col.id));
      if (onDeleteCustomColumn) onDeleteCustomColumn(col.id);
      message.success("Đã xóa cột tùy biến");
    } catch {
      message.error("Không thể xóa cột");
    }
  };

  const handleUpdateCustomColumnLabel = (colKeyOrId, newLabel) => {
    setDraftCustomColumns((prev) =>
      prev.map((c) => {
        if (c.id === colKeyOrId || c.column_key === colKeyOrId) {
          return {
            ...c,
            column_label: newLabel,
            is_dirty: !c.is_draft,
          };
        }
        return c;
      })
    );
  };

  if (!block) return null;

  const collapseItems = [
    {
      key: "title",
      label: (
        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
          <PushpinOutlined className="text-blue-600" /> TIÊU ĐỀ (Title)
        </span>
      ),
      children: (
        <div>
          <div className="text-xs text-gray-500 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
            Áp dụng cho phần label trước placeholder
          </div>
          <StyleControls style={titleStyle} defaultStyle={defaultTitleStyle} onUpdate={updateTitleStyle} />
        </div>
      ),
    },
    {
      key: "content",
      label: (
        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
          <FileTextOutlined className="text-blue-600" /> NỘI DUNG (Content)
        </span>
      ),
      children: (
        <div>
          <div className="text-xs text-gray-500 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
            Áp dụng cho phần giá trị động &#123;&#123;...&#125;&#125;
          </div>
          <StyleControls style={contentStyle} defaultStyle={defaultContentStyle} onUpdate={updateContentStyle} showSpacing />
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-blue-700">
            <FormatPainterOutlined /> Format:
          </span>
          <span className="font-semibold text-blue-800">{block.name}</span>
          <Tag color="cyan">{block.block_type}</Tag>
        </div>
      }
      placement="right"
      width="min(90vw, 1200px)"
      style={{ maxWidth: 1200 }}
      styles={{ body: { padding: 16 } }}
      open={open !== undefined ? open : visible}
      destroyOnClose
      onClose={onClose}
      extra={
        onPreview && block ? (
          <Button icon={<EyeOutlined />} loading={previewLoading} onClick={handlePreview} size="small">
            Xem trước
          </Button>
        ) : null
      }
      footer={
        <DrawerFooterActions
          onResetTitle={() => {
            setTitleStyle({});
            message.info("Đã khôi phục style Tiêu đề về mặc định.");
          }}
          onResetContent={() => {
            setContentStyle({});
            message.info("Đã khôi phục style Nội dung về mặc định.");
          }}
          onClose={onClose}
          onSave={handleSave}
          disabled={!isDirty}
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-1">
          <Collapse defaultActiveKey={["title", "content"]} items={collapseItems} />

          {isTableBlock && supportsCustomColumn && (
            <CustomColumnSection
              tableCode={tableCode}
              supportsCustomColumn={supportsCustomColumn}
              isNested={isNested}
              draftCustomColumns={draftCustomColumns}
              onOpenAdd={handleOpenAddColumn}
              onApplyPreset={handleApplyPreset}
              onEditColumn={handleOpenEditColumn}
              onDeleteColumn={handleRemoveCustomColumn}
            />
          )}

          {isDisplayTypeSupported && (
            <div>
              <Divider className="my-3" />
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Kiểu hiển thị</h4>
              <Radio.Group value={displayType} onChange={(e) => setDisplayType(e.target.value)}>
                <Radio value="TABLE">Bảng</Radio>
                <Radio value="TEXT">Văn bản</Radio>
              </Radio.Group>

              {tableCode === "credit" && displayType === "TEXT" && (
                <div className="mt-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[11px] font-semibold text-gray-700 block mb-1.5">
                    Định dạng câu văn bản:
                  </span>
                  <Radio.Group
                    value={textFormat}
                    onChange={(e) => setTextFormat(e.target.value)}
                    className="flex flex-col gap-2"
                  >
                    <Radio value="INLINE" className="text-xs">
                      <span className="font-medium">Mẫu 1: Dòng câu tóm tắt</span>
                      <span className="block text-[10px] text-gray-400">
                        Tổng số: 3 tín chỉ (Lý thuyết: 2, Thực hành: 1, Tự học: 90 giờ)
                      </span>
                    </Radio>
                    <Radio value="BULLET" className="text-xs">
                      <span className="font-medium">Mẫu 2: Danh sách gạch đầu dòng</span>
                      <span className="block text-[10px] text-gray-400">
                        • Tổng số: 3 tín chỉ • Lý thuyết: 2 tín chỉ...
                      </span>
                    </Radio>
                  </Radio.Group>
                </div>
              )}
            </div>
          )}

          {isTableBlock && supportsCustomColumn && (
            <div>
              <Divider className="my-3" />
              <TableColumnWidthControl
                columns={effectiveTableCols}
                value={columnWidthFormula}
                onChange={setColumnWidthFormula}
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 flex flex-col min-w-0">
          <div className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-blue-900 font-semibold">
              <EyeOutlined /> Bản xem trước (Live Preview)
            </span>
            <div className="flex items-center gap-1.5">
              {isTableBlock && displayType === "TABLE" && (
                <Tag color="cyan" className="mr-0 text-[10px] flex items-center gap-1">
                  <InfoCircleOutlined className="text-cyan-700" />
                  <span>Click ô tiêu đề để sửa tên, ô thân bảng để căn lề</span>
                </Tag>
              )}
              <Tag color="blue" className="mr-0 text-[10px]">Realtime 300ms</Tag>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-50/70 p-3 rounded-lg border border-gray-200 min-h-[300px]">
            <BlockInlinePreview
              blockId={block.id}
              templateId={resolvedTemplateId}
              titleStyle={titleStyle}
              contentStyle={contentStyle}
              customColumns={draftCustomColumns}
              columnWidthFormula={columnWidthFormula}
              interactiveCellAlign={isTableBlock && displayType === "TABLE"}
              cellAlignments={cellAlignments}
              onCellAlignmentChange={setCellAlignments}
              columnsMetadata={columnsMetadata}
              onUpdateColumnLabel={handleUpdateColumnLabel}
              onResetColumnLabel={handleResetColumnLabel}
              blockConfig={{
                ...(block.config || {}),
                display_type: displayType,
                text_format: textFormat,
                column_widths_formula: columnWidthFormula,
                cell_alignments: cellAlignments,
                label_overrides: tableLabelOverrides,
              }}
              debounceMs={300}
              withContext
            />
          </div>
        </div>
      </div>

      <CustomColumnModal
        open={isColModalOpen}
        editingColumn={editingColumn}
        levelOptions={levelOptions}
        onCancel={() => setIsColModalOpen(false)}
        onSubmit={handleColumnFormSubmit}
      />
    </Drawer>
  );
};

export default BlockFormatDrawer;
