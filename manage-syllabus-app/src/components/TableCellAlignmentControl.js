import React, { useMemo } from "react";
import { Button, Popconfirm } from "antd";
import { UndoOutlined, TableOutlined } from "@ant-design/icons";

const TableCellAlignmentControl = ({
  value = {},
  onChange,
  disabled = false,
}) => {
  const cellAlignments = useMemo(() => value || {}, [value]);
  const customCount = Object.keys(cellAlignments).length;

  const handleClearAll = () => {
    if (!onChange || disabled) return;
    onChange({});
  };

  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
      <span className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
        <TableOutlined className="text-blue-600" /> Căn lề chi tiết từng ô
      </span>
      <Popconfirm
        title="Khôi phục tất cả ô về mặc định?"
        onConfirm={handleClearAll}
        okText="Khôi phục"
        cancelText="Hủy"
        disabled={customCount === 0 || disabled}
      >
        <Button
          size="small"
          type="link"
          danger={customCount > 0}
          disabled={customCount === 0 || disabled}
          icon={<UndoOutlined />}
          className="p-0 text-xs flex items-center"
        >
          Khôi phục
        </Button>
      </Popconfirm>
    </div>
  );
};

export default TableCellAlignmentControl;

