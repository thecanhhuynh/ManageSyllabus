import React, { useState, useEffect, useCallback } from "react";
import { Spin, Alert } from "antd";
import { previewInlineBlock } from "../../services/blockService";
import ParagraphRenderer from "./ParagraphRenderer";
import TableRenderer from "./TablePreviewRenderer";

export { ParagraphRenderer, TableRenderer };

const useBlockPreview = (
  templateId,
  blockId,
  titleStyle,
  contentStyle,
  customColumns,
  debounceMs,
  initialData,
  withContext = false,
  blockConfig = undefined
) => {
  const [previewData, setPreviewData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const titleKey = JSON.stringify(titleStyle || {});
  const contentKey = JSON.stringify(contentStyle || {});
  const customKey = JSON.stringify(customColumns || []);
  const configKey = JSON.stringify(blockConfig || {});

  const fetchPreview = useCallback(async () => {
    if (!blockId || !templateId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await previewInlineBlock(
        templateId,
        blockId,
        {
          title_style: JSON.parse(titleKey),
          content_style: JSON.parse(contentKey),
        },
        JSON.parse(customKey),
        withContext,
        JSON.parse(configKey)
      );
      setPreviewData(data);
    } catch {
      setError("Không thể tải bản xem trước.");
    } finally {
      setLoading(false);
    }
  }, [blockId, templateId, titleKey, contentKey, customKey, withContext, configKey]);

  useEffect(() => {
    if (initialData) return;
    const timer = setTimeout(fetchPreview, debounceMs);
    return () => clearTimeout(timer);
  }, [fetchPreview, debounceMs, initialData]);

  return { previewData, loading, error };
};

const BlockInlinePreview = ({
  blockId,
  templateId,
  titleStyle,
  contentStyle,
  customColumns = [],
  columnWidthFormula = null,
  debounceMs = 300,
  initialData = null,
  withContext = false,
  blockConfig = undefined,
  interactiveCellAlign = false,
  cellAlignments = {},
  onCellAlignmentChange = null,
}) => {
  const { previewData, loading, error } = useBlockPreview(
    templateId,
    blockId,
    titleStyle,
    contentStyle,
    customColumns,
    debounceMs,
    initialData,
    withContext,
    blockConfig
  );

  if (!blockId || !templateId) {
    return (
      <div className="text-gray-400 text-center py-4 text-sm">
        Chưa chọn block để xem trước.
      </div>
    );
  }

  const isScheduleBlock = Boolean(
    previewData?.code === "teaching_schedule" ||
    previewData?.code === "teaching_sessions" ||
    previewData?.block_code === "teaching_schedule" ||
    blockConfig?.code === "teaching_schedule"
  );

  let renderedElements = previewData?.elements || [];
  if (isScheduleBlock && interactiveCellAlign) {
    let firstTableSeen = false;
    renderedElements = renderedElements.filter((el) => {
      if (firstTableSeen) return false;
      if (el.type === "table") {
        firstTableSeen = true;
        return true;
      }
      return true;
    });
  }

  return (
    <div className="preview-container relative min-h-[120px]">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded">
          <Spin tip="Đang tải bản xem trước..." />
        </div>
      )}
      {error && <Alert type="error" message={error} className="mb-2" showIcon />}
      {previewData && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
          {previewData.context?.prev && (
            <div className="px-4 py-3 bg-gray-50/70 opacity-40 text-gray-500 italic text-sm border-b border-dashed border-gray-300">
              {previewData.context.prev.position}. {previewData.context.prev.name}
            </div>
          )}

          <div className="p-4">
            {isScheduleBlock && interactiveCellAlign && (
              <Alert
                type="info"
                showIcon
                className="mb-3 text-xs"
                message="Bảng kế hoạch giảng dạy mẫu (Đại diện ca học)"
                description="Cấu hình căn lề chi tiết từng ô trên bảng này sẽ tự động dùng chung cho tất cả các bảng ca học còn lại (buổi sáng, buổi tối, thực hành)."
              />
            )}
            {renderedElements.map((el, i) => {
              if (el.type === "paragraph") return <ParagraphRenderer key={i} para={el} />;
              if (el.type === "table") {
                return (
                  <TableRenderer
                    key={i}
                    table={el}
                    columnWidthFormula={columnWidthFormula}
                    interactiveCellAlign={interactiveCellAlign}
                    cellAlignments={cellAlignments}
                    onCellAlignmentChange={onCellAlignmentChange}
                  />
                );
              }
              return null;
            })}
          </div>

          {previewData.context?.next && (
            <div className="px-4 py-3 bg-gray-50/70 opacity-40 text-gray-500 italic text-sm border-t border-dashed border-gray-300">
              {previewData.context.next.position}. {previewData.context.next.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockInlinePreview;
