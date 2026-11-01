import React from "react";
import { Button } from "antd";
import { UndoOutlined } from "@ant-design/icons";

export const DrawerFooterActions = ({
  onResetTitle,
  onResetContent,
  onClose,
  onSave,
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <Button size="small" icon={<UndoOutlined />} onClick={onResetTitle}>
        Khôi phục Title
      </Button>
      <Button size="small" icon={<UndoOutlined />} onClick={onResetContent}>
        Khôi phục Content
      </Button>
    </div>
    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
      <Button onClick={onClose}>Hủy</Button>
      <Button type="primary" onClick={onSave}>
        Lưu
      </Button>
    </div>
  </div>
);

export default DrawerFooterActions;
