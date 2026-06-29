import React from "react";
import {Layout, Typography} from "antd";

const {Footer} = Layout;
const {Text} = Typography;

const MyFooter = () => {
  return (
    <Footer
      className="flex flex-col items-center justify-center"
      style={{
        background: "#fafafa",
        borderTop: "1px solid #f0f0f0",
        padding: "24px 20px",
        textAlign: "center",
        marginTop: "auto",
      }}
    >
      <Text
        strong
        style={{
          color: "#595959",
          fontSize: 14,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        Hệ thống quản lý đề cương môn học
      </Text>

      <div
        style={{
          width: "40px",
          height: "2px",
          backgroundColor: "#1890ff",
          margin: "12px 0",
          borderRadius: "2px",
        }}
      />

      <div className="flex flex-col gap-1">
        <Text style={{color: "#8c8c8c", fontSize: 13}}>
          Trường Đại học Mở Thành phố Hồ Chí Minh
        </Text>
        <Text style={{color: "#bfbfbf", fontSize: 12}}>
          © {new Date().getFullYear()} - Bản quyền thuộc về Tôi Syllabus
        </Text>
      </div>
    </Footer>
  );
};

export default MyFooter;
