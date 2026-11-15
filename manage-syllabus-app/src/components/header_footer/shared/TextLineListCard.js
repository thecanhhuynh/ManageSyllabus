import React from "react";
import { Card, Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, BankOutlined } from "@ant-design/icons";
import TypographyPopover from "./TypographyPopover";

export const TextLineListCard = ({
  title,
  icon = <BankOutlined className="mr-1.5" />,
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
        <span className="text-xs font-semibold text-gray-700 flex items-center">
          {icon}
          {title}
        </span>
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddLine}
          className="text-xs"
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
          <span className="text-[11px] font-mono text-gray-400 w-5 text-right flex-shrink-0">
            #{idx + 1}
          </span>
          <Input
            size="small"
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
        <p className="text-xs text-gray-400 italic m-0">Chưa có dòng nào.</p>
      )}
    </div>
  </Card>
);

export default TextLineListCard;
