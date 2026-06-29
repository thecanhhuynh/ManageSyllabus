import React from "react";
import {Spin, Typography} from "antd";
import {LoadingOutlined} from "@ant-design/icons";
import PropTypes from "prop-types";

const {Text} = Typography;

const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 48,
      color: "#1890ff",
    }}
    spin
  />
);

const MySpinner = ({message = "Đang tải dữ liệu...", fullScreen = true}) => {
  return (
    <div
      className="flex flex-col items-center justify-center w-full"
      style={{
        minHeight: fullScreen ? "60vh" : "auto",
        padding: "24px",
      }}
    >
      <Spin indicator={antIcon} />
      {message && (
        <Text
          type="secondary"
          style={{marginTop: 16, fontSize: 14, fontWeight: 500}}
        >
          {message}
        </Text>
      )}
    </div>
  );
};

MySpinner.propTypes = {
  message: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default MySpinner;
