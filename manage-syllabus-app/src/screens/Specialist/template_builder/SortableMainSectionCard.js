import React, { useState, useEffect } from "react";
import { Card, Button, Input, Popconfirm, Tooltip, Space } from "antd";
import {
  DragOutlined,
  DeleteOutlined,
  PlusOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableSubSectionRow from "./SortableSubSectionRow";

const toRoman = (num) => {
  const romanNumerals = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"
  ];
  const idx = (num || 1) - 1;
  return 0 <= idx && idx < romanNumerals.length ? romanNumerals[idx] : String(num);
};

const SortableMainSectionCard = ({
  section,
  index,
  blockMap = {},
  onUpdateSectionName,
  onOpenSectionStyleDrawer,
  onRemoveSection,
  onOpenAddSubModal,
  onUpdateSubName,
  onOpenSubStyleDrawer,
  onRemoveSub,
}) => {
  const [localName, setLocalName] = useState(section.name || "");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  useEffect(() => {
    setLocalName(section.name || "");
  }, [section.name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalName(val);
    onUpdateSectionName(section.id, val, false);
  };

  const handleBlur = () => {
    const trimmed = localName.trim();
    if (trimmed !== localName) {
      setLocalName(trimmed);
    }
    if (trimmed === section.name) return;
    onUpdateSectionName(section.id, trimmed, true);
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.target.blur();
  };

  const roman = toRoman(index + 1);
  const subs = section.sub_sections || [];

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <Card
        className="shadow-xs border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-colors"
        styles={{
          header: { backgroundColor: "#f8fafc", padding: "12px 16px" },
          body: { padding: "16px", backgroundColor: "#fcfdfe" },
        }}
        title={
          <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
              title="Kéo thả đổi vị trí Phần lớn"
            >
              <DragOutlined className="text-base" />
            </div>

            <span className="font-extrabold text-indigo-700 text-base shrink-0 select-none">
              {roman}.
            </span>

            <Input
              value={localName}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="font-bold text-gray-800 text-base flex-1 max-w-xl bg-white border border-gray-300 hover:border-indigo-400 focus:border-indigo-600 rounded-lg px-3 py-1.5 shadow-2xs transition-all"
              placeholder="Nhập tiêu đề Phần lớn..."
            />
          </div>
        }
        extra={
          <Space>
            <Tooltip title="Định dạng tiêu đề Phần lớn (Font, Cỡ chữ, Căn lề, Giãn dòng)">
              <Button
                size="small"
                type="text"
                className="text-indigo-600 hover:bg-indigo-50 font-medium"
                icon={<FormatPainterOutlined />}
                onClick={() => onOpenSectionStyleDrawer(section)}
              >
                Định dạng Section
              </Button>
            </Tooltip>

            <Popconfirm
              title="Xóa toàn bộ Phần lớn này?"
              description="Toàn bộ các mục con bên trong cũng sẽ bị xóa khỏi đề cương."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => onRemoveSection(section.id)}
            >
              <Button danger type="text" icon={<DeleteOutlined />} title="Xóa phần lớn" />
            </Popconfirm>
          </Space>
        }
      >
        <div className="space-y-3">
          <SortableContext
            items={subs.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {subs.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 border border-dashed rounded-lg bg-gray-50/50">
                Chưa có mục con nào trong phần này.
              </div>
            ) : (
              subs.map((sub) => {
                const matchedBlock =
                  blockMap[sub.code] ||
                  blockMap[sub.name] || {
                    id: sub.id,
                    name: sub.name,
                    block_type: sub.type || "text",
                    code: sub.code,
                  };
                return (
                  <SortableSubSectionRow
                    key={sub.id}
                    sub={sub}
                    sectionId={section.id}
                    block={matchedBlock}
                    onUpdateName={onUpdateSubName}
                    onOpenStyleDrawer={onOpenSubStyleDrawer}
                    onRemove={onRemoveSub}
                  />
                );
              })
            )}
          </SortableContext>
        </div>

        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          onClick={() => onOpenAddSubModal(section.id)}
          className="mt-4 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
        >
          Thêm mục con vào phần {roman}
        </Button>
      </Card>
    </div>
  );
};

export default SortableMainSectionCard;
