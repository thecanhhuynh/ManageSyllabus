import React, { useState, useMemo } from "react";
import { Drawer, Collapse, message } from "antd";
import {
  PushpinOutlined,
  FileTextOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons";
import TableColumnWidthControl from "../column_width/TableColumnWidthControl";
import CustomColumnService from "../../services/customColumnService";
import {
  TABLE_DEFAULT_COLUMNS,
  DEFAULT_COLUMN_LABELS,
  DEFAULT_COLUMN_WIDTH_FORMULAS,
  ADMINISTRATIVE_COLORS,
  NESTED_TABLE_LEVELS,
  UNSUPPORTED_CUSTOM_COLUMN,
} from "./constants";
import StyleControls from "./StyleControls";
import CustomColumnSection from "./CustomColumnSection";
import CustomColumnModal from "./CustomColumnModal";
import DrawerFooterActions from "./DrawerFooterActions";
import { BlockDrawerTitle, BlockDrawerHeaderActions } from "./BlockDrawerHeader";
import DisplayTypeSection from "./DisplayTypeSection";
import BlockLivePreviewPane from "./BlockLivePreviewPane";
import useBlockDrawerHistory from "./useBlockDrawerHistory";

export { StyleControls, DEFAULT_COLUMN_LABELS, ADMINISTRATIVE_COLORS };

const MOBILE_VIEW_TABS = [
  { label: "Chỉnh sửa", value: "editor", icon: <FormatPainterOutlined /> },
  { label: "Xem trước", value: "preview" },
];

export const BlockFormatDrawer = ({
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
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState("editor");

  const resolvedTemplateId = templateId || block?.template || block?.template_id;
  const isDrawerOpen = open !== undefined ? open : visible;

  const tableCode =
    block?.config?.table_code ||
    block?.config?.code ||
    block?.code?.toLowerCase();
  const isDisplayTypeSupported = ["credit", "lecturer_info"].includes(tableCode);

  const {
    titleStyle,
    setTitleStyle,
    contentStyle,
    setContentStyle,
    displayType,
    setDisplayType,
    textFormat,
    setTextFormat,
    columnOverrides,
    columnWidthFormula,
    setColumnWidthFormula,
    cellAlignments,
    setCellAlignments,
    tableLabelOverrides,
    setTableLabelOverrides,
    draftCustomColumns,
    setDraftCustomColumns,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    isDirty,
  } = useBlockDrawerHistory({
    block,
    blockLayout,
    customColumns,
    isOpen: isDrawerOpen,
    tableCode,
    isDisplayTypeSupported,
  });

  const isTableBlock =
    (block?.block_type === "table" ||
      (block?.block_type === "reference" && tableCode !== "learning_material")) &&
    displayType === "TABLE";
  const levelOptions = NESTED_TABLE_LEVELS[tableCode] || null;
  const isNested = Boolean(levelOptions);
  const supportsCustomColumn = isTableBlock && tableCode && !UNSUPPORTED_CUSTOM_COLUMN.has(tableCode);

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

  const baseCols = useMemo(() => {
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
  }, [block, tableCode, tableLabelOverrides]);

  const defaultCols = useMemo(() => {
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
  }, [block, tableCode, baseCols]);

  const tableCustomCols = useMemo(
    () => (draftCustomColumns || []).filter((col) => Boolean(col.table_code && col.table_code === tableCode)),
    [draftCustomColumns, tableCode]
  );

  const columnsMetadata = useMemo(
    () => [
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
    ],
    [defaultCols, tableLabelOverrides, tableCustomCols]
  );

  const effectiveTableCols = useMemo(
    () => (tableCode === "lecturer_info" ? baseCols : [...baseCols, ...tableCustomCols.map((c) => c.column_label || "Cột mới")]),
    [tableCode, baseCols, tableCustomCols]
  );

  const handleUpdateCustomColumnLabel = (colKeyOrId, newLabel) => {
    setDraftCustomColumns((prev) =>
      prev.map((c) => {
        if (c.id === colKeyOrId || c.column_key === colKeyOrId) {
          return { ...c, column_label: newLabel, is_dirty: !c.is_draft };
        }
        return c;
      })
    );
  };

  const handleUpdateColumnLabel = (colMeta, newLabel) => {
    if (!colMeta.isCustom) {
      const colKey = colMeta.key || `col_${colMeta.ci}`;
      const next = { ...tableLabelOverrides };
      if (!newLabel || !newLabel.trim()) {
        delete next[colKey];
      } else {
        next[colKey] = newLabel;
      }
      setTableLabelOverrides(next);
      return;
    }
    handleUpdateCustomColumnLabel(colMeta.id || colMeta.key, newLabel);
  };

  const handleResetColumnLabel = (colMeta) => {
    if (colMeta.isCustom) return;
    const colKey = colMeta.key || `col_${colMeta.ci}`;
    const next = { ...tableLabelOverrides };
    delete next[colKey];
    setTableLabelOverrides(next);
    message.info(`Đã khôi phục tiêu đề cột "${colMeta.defaultLabel}" về mặc định.`);
  };

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
      new_custom_columns: newCols.map((c) => ({
        column_label: c.column_label,
        column_type: c.column_type,
        default_value: c.default_value,
        level: c.level,
      })),
      updated_custom_columns: updatedCols.map((c) => ({
        id: c.id,
        column_label: c.column_label,
        column_type: c.column_type,
        default_value: c.default_value,
        level: c.level,
      })),
      label_overrides: { [tableCode]: tableLabelOverrides },
    });
  };

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

  const handleColumnFormSubmit = (values) => {
    if (editingColumn) {
      setDraftCustomColumns((prev) =>
        prev.map((c) => {
          if (c.id === editingColumn.id || c.column_key === editingColumn.column_key) {
            return { ...c, ...values, is_dirty: !c.is_draft };
          }
          return c;
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
      title={<BlockDrawerTitle block={block} />}
      placement="right"
      width="100%"
      styles={{ body: { padding: 16 } }}
      open={isDrawerOpen}
      destroyOnClose
      onClose={onClose}
      extra={
        <BlockDrawerHeaderActions
          block={block}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPreview={handlePreview}
          previewLoading={previewLoading}
          onSave={handleSave}
          isDirty={isDirty}
        />
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
      <div className="lg:hidden mb-3">
        <div className="grid grid-cols-2 p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9] gap-1 w-full">
          {MOBILE_VIEW_TABS.map((tab) => {
            const isSelected = mobileViewTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setMobileViewTab(tab.value)}
                className={`py-1 text-xs rounded-[6px] transition-all text-center cursor-pointer select-none flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs font-semibold"
                    : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff] font-medium"
                }`}
              >
                {tab.icon && <span className="text-[11px]">{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-10 gap-6 lg:h-full min-h-0">
        <div
          className={`lg:col-span-3 space-y-4 overflow-y-auto pr-1 ${
            mobileViewTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
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

          <DisplayTypeSection
            displayType={displayType}
            setDisplayType={setDisplayType}
            textFormat={textFormat}
            setTextFormat={setTextFormat}
            tableCode={tableCode}
            isDisplayTypeSupported={isDisplayTypeSupported}
          />

          {isTableBlock && supportsCustomColumn && (
            <div>
              <TableColumnWidthControl
                columns={effectiveTableCols}
                tableCode={tableCode}
                defaultFormula={DEFAULT_COLUMN_WIDTH_FORMULAS[tableCode] || ""}
                value={columnWidthFormula}
                onChange={setColumnWidthFormula}
              />
            </div>
          )}
        </div>

        <BlockLivePreviewPane
          block={block}
          resolvedTemplateId={resolvedTemplateId}
          titleStyle={titleStyle}
          contentStyle={contentStyle}
          draftCustomColumns={draftCustomColumns}
          columnWidthFormula={columnWidthFormula}
          isTableBlock={isTableBlock}
          displayType={displayType}
          textFormat={textFormat}
          cellAlignments={cellAlignments}
          setCellAlignments={setCellAlignments}
          columnsMetadata={columnsMetadata}
          handleUpdateColumnLabel={handleUpdateColumnLabel}
          handleResetColumnLabel={handleResetColumnLabel}
          tableLabelOverrides={tableLabelOverrides}
          mobileViewTab={mobileViewTab}
        />
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
