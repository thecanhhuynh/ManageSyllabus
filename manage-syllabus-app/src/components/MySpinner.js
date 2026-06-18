import {Spin} from "antd";
import {LoadingOutlined} from "@ant-design/icons";

const antIcon = (
  <LoadingOutlined
    style={{
      fontSize: 60,
    }}
    spin
  />
);

const MySpinner = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
      }}
    >
      <Spin indicator={antIcon} tip="Đang tải dữ liệu..." />
    </div>
  );
};

export default MySpinner;
