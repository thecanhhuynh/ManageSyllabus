import React from "react";
import { Alert } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const SuccessAlert = ({
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
      type="success"
      icon={showIcon ? <CheckCircleFilled /> : null}
      showIcon={showIcon}
      message={message}
      description={content}
      className={`rounded-md border-green-200 bg-green-50/80 ${compactClass} ${className}`.trim()}
      style={style}
      {...props}
    />
  );
};

export default SuccessAlert;
