import React, { useState, useEffect } from "react";
import { Button, Input, Tag, Popconfirm, Tooltip } from "antd";
import {
  DragOutlined,
  DeleteOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TYPE_COLORS = {
  table: "cyan",
  reference: "purple",
  selection: "orange",
  text: "blue",
};

const SortableSubSectionRow = ({
  sub,
  sectionId,
  block,
  onUpdateName,
  onOpenStyleDrawer,
  onRemove,
}) => {
  const [localName, setLocalName] = useState(sub.name || "");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sub.id });

  useEffect(() => {
    setLocalName(sub.name || "");
  }, [sub.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalName(val);
    onUpdateName(sectionId, sub.id, val, false);
  };

  const handleBlur = () => {
    const trimmed = localName.trim();
    if (trimmed !== localName) {
      setLocalName(trimmed);
    }
    if (trimmed === sub.name) return;
    onUpdateName(sectionId, sub.id, trimmed, true);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.target.blur();
  };

  const tagColor = TYPE_COLORS[block?.block_type || sub.type] || "default";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-gray-400 hover:text-blue-500 transition-colors"
          title="Kéo thả đổi vị trí"
        >
          <DragOutlined />
        </div>

        <span className="text-xs font-semibold text-gray-500 w-12 shrink-0">
          Mục {sub.position}.
        </span>

        <Input
          value={localName}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="font-medium text-gray-800 flex-1 max-w-md bg-transparent hover:bg-gray-50 focus:bg-white"
          placeholder="Nhập tên tiêu đề hiển thị..."
        />

        <Tag color={tagColor} className="uppercase text-xs shrink-0">
          {block?.block_type || sub.type || "text"}
        </Tag>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Tooltip title="Định dạng Block & Bảng (Font, Size, Cột, Căn lề, Display Type)">
          <Button
            size="small"
            type="primary"
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
            icon={<FormatPainterOutlined />}
            onClick={() => onOpenStyleDrawer(block, sub)}
          >
            Định dạng
          </Button>
        </Tooltip>

        <Popconfirm
          title="Ẩn/Xóa mục này?"
          description="Khối này sẽ bị xóa khỏi danh sách mục của đề cương."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => onRemove(sectionId, sub.id)}
        >
          <Button
            size="small"
            danger
            type="text"
            icon={<DeleteOutlined />}
            title="Xóa mục"
          />
        </Popconfirm>
      </div>
    </div>
  );
};

export default SortableSubSectionRow;
