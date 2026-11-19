import React from "react";
import { Alert } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";

const DangerAlert = ({
  message,
  description,
  children,
  compact = false,
  showIcon = true,
  className = "",
  style,
  ...props
}) => {
  const content = description || children;
  const compactClass = compact
    ? "py-1 px-2.5 text-xs [&_.ant-alert-message]:text-xs [&_.ant-alert-icon]:text-xs [&_.ant-alert-icon]:mr-1.5"
    : "";

  return (
    <Alert
      type="error"
      icon={showIcon ? <CloseCircleFilled /> : null}
      showIcon={showIcon}
      message={message}
      description={content}
      className={`rounded-md border-red-200 bg-red-50/80 ${compactClass} ${className}`.trim()}
      style={style}
      {...props}
    />
  );
};

export default DangerAlert;
