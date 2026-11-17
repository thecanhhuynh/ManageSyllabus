import React from "react";
import { Tag } from "antd";
import { EyeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { BlockInlinePreview } from "../block_preview";

export const BlockLivePreviewPane = ({
  block,
  resolvedTemplateId,
  titleStyle,
  contentStyle,
  draftCustomColumns,
  columnWidthFormula,
  isTableBlock,
  displayType,
  textFormat,
  cellAlignments,
  setCellAlignments,
  columnsMetadata,
  handleUpdateColumnLabel,
  handleResetColumnLabel,
  tableLabelOverrides,
  mobileViewTab,
}) => (
  <div
    className={`lg:col-span-7 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 flex flex-col min-w-0 ${
      mobileViewTab === "editor" ? "hidden lg:flex" : "flex"
    }`}
  >
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
);

export default BlockLivePreviewPane;
