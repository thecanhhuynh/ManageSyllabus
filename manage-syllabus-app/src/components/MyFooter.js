import React from "react";
import {Layout, Typography, Divider} from "antd";

const {Footer} = Layout;
const {Text, Title} = Typography;

const MyFooter = () => {
  return (
    <Footer
      style={{
        textAlign: "center",
        backgroundColor: "#00529C",
        padding: "30px 20px",
      }}
    >
      <Title level={5} style={{color: "#fff", margin: 0, letterSpacing: "1px"}}>
        HỆ THỐNG QUẢN LÝ ĐỀ CƯƠNG MÔN HỌC
      </Title>
      <Divider
        style={{borderColor: "rgba(255,255,255,0.2)", margin: "15px 0"}}
      />
      <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
        <Text style={{color: "rgba(255,255,255,0.8)", fontSize: "12px"}}>
          Trường Đại học Mở Thành phố Hồ Chí Minh
        </Text>
        <Text style={{color: "rgba(255,255,255,0.6)", fontSize: "11px"}}>
          © {new Date().getFullYear()} - Bản quyền thuộc về Tôi Syllabus
        </Text>
      </div>
    </Footer>
  );
};

export default MyFooter;
