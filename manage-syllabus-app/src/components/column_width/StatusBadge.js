import React from "react";
import { Tag } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

export const StatusBadge = ({ formula, validation }) => {
  if (!formula || !formula.trim()) {
    return <Tag color="default">Mặc định</Tag>;
  }
  if (!validation.valid) {
    return <Tag color="error">{validation.error}</Tag>;
  }
  if (validation.isGrid12) {
    return (
      <Tag color="success" icon={<CheckCircleOutlined />}>
        Chuẩn 12 cột
      </Tag>
    );
  }
  return (
    <Tag color="blue">Tỉ lệ tự do (Tổng: {validation.sum.toFixed(1)})</Tag>
  );
};

export default StatusBadge;
