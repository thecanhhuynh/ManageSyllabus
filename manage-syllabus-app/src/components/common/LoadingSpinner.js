import React from "react";
import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Text } = Typography;

export const LoadingSpinner = ({
  message = "Đang tải dữ liệu...",
  fullScreen = true,
  size = "default",
}) => {
  const isSmall = size === "small";
  const iconSize = isSmall ? 22 : 48;
  const antIcon = (
    <LoadingOutlined
      style={{
        fontSize: iconSize,
        color: "#1890ff",
      }}
      spin
    />
  );

  return (
    <div
      className="flex flex-col items-center justify-center w-full"
      style={{
        minHeight: fullScreen ? "60vh" : "auto",
        padding: isSmall ? "10px" : "24px",
      }}
    >
      <Spin indicator={antIcon} />
      {message && (
        <Text
          type="secondary"
          style={{
            marginTop: isSmall ? 6 : 16,
            fontSize: isSmall ? 12 : 14,
            fontWeight: 500,
          }}
        >
          {message}
        </Text>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
  size: PropTypes.string,
};

export default LoadingSpinner;
