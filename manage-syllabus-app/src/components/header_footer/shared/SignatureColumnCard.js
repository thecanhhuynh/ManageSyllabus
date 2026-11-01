import React from "react";
import { Card, Input, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import TypographyPopover from "./TypographyPopover";

export const SignatureColumnCard = ({
  col,
  cIdx,
  canDelete,
  onUpdateTitle,
  onUpdateTitleStyle,
  onUpdateSubtitle,
  onUpdateName,
  onUpdateNameStyle,
  onDeleteColumn,
}) => (
  <Card
    size="small"
    type="inner"
    title={`Cột ${cIdx + 1}: ${col.name || "(Chưa đặt tên)"}`}
    extra={
      canDelete && (
        <Popconfirm
          title="Xóa cột chữ ký này?"
          onConfirm={() => onDeleteColumn(cIdx)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger type="text" size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
    className="bg-gray-50/50 border-gray-200"
  >
    <div className="space-y-3">
      {/* Title line 1 */}
      <div>
        <label className="text-[11px] font-medium text-gray-600 block mb-1">
          Tiêu đề dòng 1 (VI):
        </label>
        <div className="flex gap-2 items-center">
          <Input
            size="small"
            value={col.title_lines?.[0]?.text || ""}
            onChange={(e) => onUpdateTitle(cIdx, 0, e.target.value)}
            placeholder="VD: PHỤ TRÁCH KHOA CNTT"
            className="font-bold text-xs flex-1"
          />
          <TypographyPopover
            title="Định dạng Tiêu đề 1"
            style={col.title_lines?.[0]?.style || {}}
            defaultStyle={{ bold: true, font_size_pt: 12, alignment: "CENTER" }}
            onUpdate={(k, v) => onUpdateTitleStyle(cIdx, 0, k, v)}
          />
        </div>
      </div>

      {/* Title line 2 */}
      <div>
        <label className="text-[11px] font-medium text-gray-600 block mb-1">
          Tiêu đề dòng 2 (EN):
        </label>
        <div className="flex gap-2 items-center">
          <Input
            size="small"
            value={col.title_lines?.[1]?.text || ""}
            onChange={(e) => onUpdateTitle(cIdx, 1, e.target.value)}
            placeholder="VD: DEPUTY DEAN"
            className="font-semibold text-xs flex-1"
          />
          <TypographyPopover
            title="Định dạng Tiêu đề 2"
            style={col.title_lines?.[1]?.style || {}}
            defaultStyle={{ italic: true, font_size_pt: 11, alignment: "CENTER" }}
            onUpdate={(k, v) => onUpdateTitleStyle(cIdx, 1, k, v)}
          />
        </div>
      </div>

      {/* Subtitle */}
      <div>
        <label className="text-[11px] font-medium text-gray-600 block mb-1">
          Ghi chú phụ:
        </label>
        <Input
          size="small"
          value={col.subtitle || ""}
          onChange={(e) => onUpdateSubtitle(cIdx, e.target.value)}
          placeholder="VD: (Ký và ghi rõ họ tên)"
          className="italic text-xs"
        />
      </div>

      {/* Name */}
      <div>
        <label className="text-[11px] font-medium text-gray-600 block mb-1">
          Họ và tên người ký:
        </label>
        <div className="flex gap-2 items-center">
          <Input
            size="small"
            value={col.name || ""}
            onChange={(e) => onUpdateName(cIdx, e.target.value)}
            placeholder="VD: TS. Nguyễn Văn A"
            className="font-bold text-xs flex-1"
          />
          <TypographyPopover
            title="Định dạng Họ tên"
            style={col.name_style || {}}
            defaultStyle={{ bold: true, font_size_pt: 12, alignment: "CENTER" }}
            onUpdate={(k, v) => onUpdateNameStyle(cIdx, k, v)}
          />
        </div>
      </div>
    </div>
  </Card>
);

export default SignatureColumnCard;
