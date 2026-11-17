import React from "react";
import { Tag, Button, Tooltip } from "antd";
import {
  FormatPainterOutlined,
  EyeOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";

export const BlockDrawerTitle = ({ block }) => {
  if (!block) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-blue-700">
        <FormatPainterOutlined /> Format:
      </span>
      <span className="font-semibold text-blue-800">{block.name}</span>
      <Tag color="cyan">{block.block_type}</Tag>
    </div>
  );
};

export const BlockDrawerHeaderActions = ({
  block,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPreview,
  previewLoading,
  onSave,
  isDirty,
}) => (
  <div className="flex items-center gap-2">
    <Tooltip title="Hoàn tác (Ctrl+Z)">
      <Button
        icon={<UndoOutlined />}
        size="small"
        disabled={!canUndo}
        onClick={onUndo}
      >
        Hoàn tác
      </Button>
    </Tooltip>
    <Tooltip title="Làm lại (Ctrl+Y)">
      <Button
        icon={<RedoOutlined />}
        size="small"
        disabled={!canRedo}
        onClick={onRedo}
      >
        Làm lại
      </Button>
    </Tooltip>
    {onPreview && block && (
      <Button
        icon={<EyeOutlined />}
        loading={previewLoading}
        onClick={onPreview}
        size="small"
      >
        Xem trước
      </Button>
    )}
    <Button
      type="primary"
      size="small"
      onClick={onSave}
      disabled={!isDirty}
      className="lg:hidden"
    >
      Lưu
    </Button>
  </div>
);

export default BlockDrawerHeaderActions;
