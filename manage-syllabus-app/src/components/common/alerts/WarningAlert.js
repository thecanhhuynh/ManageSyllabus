import React from "react";
import { Alert } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";

const WarningAlert = ({
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
      type="warning"
      icon={showIcon ? <ExclamationCircleFilled /> : null}
      showIcon={showIcon}
      message={message}
      description={content}
      className={`rounded-md border-amber-200 bg-amber-50/80 ${compactClass} ${className}`.trim()}
      style={style}
      {...props}
    />
  );
};

export default WarningAlert;
