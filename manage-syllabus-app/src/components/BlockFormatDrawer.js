import React, { useState, useEffect } from "react";
import { Drawer, Tag, Button, Collapse, Radio, Divider, message } from "antd";
import { BlockInlinePreview } from "./block_preview";
import TableColumnWidthControl from "./TableColumnWidthControl";
import TableCellAlignmentControl from "./TableCellAlignmentControl";
import CustomColumnService from "../services/customColumnService";
import { EyeOutlined } from "@ant-design/icons";
import {
  TABLE_DEFAULT_COLUMNS,
  DEFAULT_COLUMN_LABELS,
  ADMINISTRATIVE_COLORS,
  NESTED_TABLE_LEVELS,
  UNSUPPORTED_CUSTOM_COLUMN,
  StyleControls,
  ColumnLabelsSection,
  CustomColumnSection,
  CustomColumnModal,
  DrawerFooterActions,
} from "./block_styler";

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
    setColumnOverrides((block.config || {}).column_overrides || {});
    setColumnWidthFormula((block.config || {}).column_widths_formula || "");
    setCellAlignments((block.config || {}).cell_alignments || {});
    const resolvedCode = (block.config || {}).table_code || (block.config || {}).code || block.code?.toLowerCase();
    const existingLabels = blockLayout?.label_overrides?.[resolvedCode] || {};
    setTableLabelOverrides({ ...existingLabels });
  }, [block, blockLayout]);

  if (!block) return null;

  const namedStyles = blockLayout?.named_styles || {};
  const defaultTitleStyle = namedStyles.SYLLABUS_HEADING_2 || {
    font_name: "Times New Roman",
    font_size_pt: 13,
    alignment: "LEFT",
    bold: true,
  };
  const defaultContentStyle = namedStyles.SYLLABUS_BODY || {
    font_name: "Times New Roman",
    font_size_pt: 13,
    alignment: "JUSTIFY",
    bold: false,
    line_spacing: 1.15,
    space_before_pt: 0,
    space_after_pt: 6,
  };

  const isTableBlock = ["reference", "table"].includes(block?.block_type);
  const tableCode = block?.config?.table_code || block?.config?.code;
  const levelOptions = NESTED_TABLE_LEVELS[tableCode] || null;
  const isNested = Boolean(levelOptions);
  const supportsCustomColumn = tableCode && !UNSUPPORTED_CUSTOM_COLUMN.has(tableCode);
  const isDisplayTypeSupported = isTableBlock && tableCode !== "learning_material";

  const baseCols = (() => {
    if (block?.block_type === "table" && Array.isArray(block.table_schema?.columns) && block.table_schema.columns.length > 0) {
      return block.table_schema.columns.map((c) => c.headerName || c.field || c.id || "Cột");
    }
    const defCols = DEFAULT_COLUMN_LABELS[tableCode];
    if (defCols) {
      return defCols.map((c) => tableLabelOverrides[c.key] || c.defaultLabel);
    }
    return TABLE_DEFAULT_COLUMNS[tableCode] || ["Cột 1", "Cột 2", "Cột 3"];
  })();
  const effectiveTableCols = tableCode === "lecturer_info"
    ? baseCols
    : [...baseCols, ...draftCustomColumns.map((c) => c.column_label || "Cột mới")];

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

  const collapseItems = [
    {
      key: "title",
      label: <span className="font-semibold text-gray-800">📌 TIÊU ĐỀ (Title)</span>,
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
      label: <span className="font-semibold text-gray-800">📄 NỘI DUNG (Content)</span>,
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
          <span>🎨 Format:</span>
          <span className="font-semibold text-blue-800">{block.name}</span>
          <Tag color="cyan">{block.block_type}</Tag>
        </div>
      }
      placement="right"
      width="min(90vw, 1200px)"
      style={{ maxWidth: 1200 }}
      styles={{ body: { padding: 16 } }}
      open={open !== undefined ? open : visible}
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
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 h-full">
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-1">
          <Collapse defaultActiveKey={["title", "content"]} items={collapseItems} />

          {isTableBlock && (
            <ColumnLabelsSection
              tableCode={tableCode}
              tableLabelOverrides={tableLabelOverrides}
              customColumns={draftCustomColumns}
              onChange={setTableLabelOverrides}
              onUpdateCustomColumnLabel={handleUpdateCustomColumnLabel}
            />
          )}

          {isTableBlock && (
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
            </div>
          )}

          {isTableBlock && displayType === "TABLE" && (
            <div>
              <Divider className="my-3" />
              <TableColumnWidthControl
                columns={effectiveTableCols}
                value={columnWidthFormula}
                onChange={setColumnWidthFormula}
              />
              <Divider className="my-3" />
              <TableCellAlignmentControl
                columns={effectiveTableCols}
                value={cellAlignments}
                onChange={setCellAlignments}
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
                <Tag color="cyan" className="mr-0 text-[10px]">
                  💡 Click ô để căn lề trực tiếp
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
              blockConfig={{
                ...(block.config || {}),
                display_type: displayType,
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
