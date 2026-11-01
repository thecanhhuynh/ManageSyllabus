import React from "react";
import { Card, Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import TypographyPopover from "./TypographyPopover";

export const TextLineListCard = ({
  title,
  icon = "🏛️",
  lines = [],
  placeholderPrefix = "Dòng",
  defaultStyle = {},
  onAddLine,
  onUpdateText,
  onUpdateStyle,
  onRemoveLine,
}) => (
  <Card
    title={
      <div className="flex justify-between items-center">
        <span>{icon} {title}</span>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddLine}
        >
          Thêm dòng
        </Button>
      </div>
    }
    size="small"
    className="shadow-xs border-gray-200"
  >
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <div key={line.id || idx} className="flex gap-2 items-center">
          <Input
            value={line.text}
            onChange={(e) => onUpdateText(idx, e.target.value)}
            placeholder={`${placeholderPrefix} ${idx + 1}`}
            className="flex-1 text-xs"
          />
          <TypographyPopover
            title={`Định dạng ${placeholderPrefix} ${idx + 1}`}
            style={line.style || {}}
            defaultStyle={defaultStyle}
            onUpdate={(k, v) => onUpdateStyle(idx, k, v)}
          />
          {lines.length > 1 && (
            <Popconfirm
              title={`Xóa ${placeholderPrefix.toLowerCase()} này?`}
              onConfirm={() => onRemoveLine(idx)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </div>
      ))}
      {lines.length === 0 && (
        <p className="text-xs text-gray-400 italic">Chưa có dòng nào.</p>
      )}
    </div>
  </Card>
);

export default TextLineListCard;
