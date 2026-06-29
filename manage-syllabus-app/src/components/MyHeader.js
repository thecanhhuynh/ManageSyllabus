import React, {useContext} from "react";
import {
  Layout,
  Button,
  Avatar,
  Space,
  Dropdown,
  Typography,
  message,
} from "antd";
import {
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {Link, useNavigate} from "react-router-dom";
import {MyUserContext} from "../config/contexts/MyContext";

const {Header} = Layout;
const {Text} = Typography;

const MyHeader = () => {
  const [user, dispatch] = useContext(MyUserContext);
  const nav = useNavigate();
  const logout = async () => {
    try {
      dispatch({type: "logout"});

      nav("/login");

      message.success("Đăng xuất thành công");
    } catch (error) {
      message.error("Đăng xuất thất bại");
    }
  };
  const userMenuItems = [
    {
      key: "profile",
      icon: <SettingOutlined />,
      label: <Link to="/profile">Hồ sơ cá nhân</Link>,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      danger: true,
      label: <span onClick={() => logout()}>Đăng xuất</span>,
    },
  ];

  const homeRoute =
    {
      admin: "/admin",
      specialist: "/specialist",
    }[user?.user_role] || "/";

  return (
    <Header
      className="flex items-center justify-between"
      style={{
        background: "#ffffff",
        padding: "0 32px",
        height: "76px",
        lineHeight: "normal",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="flex items-center">
        <Link
          to={homeRoute}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          style={{textDecoration: "none"}}
        >
          <div
            className="flex items-center justify-center shadow-sm"
            style={{
              width: 42,
              height: 42,
              backgroundColor: "#1890ff",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            H
          </div>
          <div className="flex flex-col">
            <Text
              strong
              style={{
                color: "#1890ff",
                fontSize: 20,
                letterSpacing: "0.5px",
                lineHeight: 1.2,
              }}
            >
              HCMOU
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#8c8c8c",
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              Syllabus System
            </Text>
          </div>
        </Link>
      </div>

      <div className="flex items-center">
        {user === null ? (
          <Space size="large">
            <Link to="/login">
              <Button
                type="default"
                size="large"
                icon={<LoginOutlined />}
                style={{fontWeight: 500, borderRadius: 6}}
              >
                Đăng nhập
              </Button>
            </Link>

            <Link to="/register">
              <Button
                type="primary"
                size="large"
                icon={<UserAddOutlined />}
                style={{
                  fontWeight: 500,
                  borderRadius: 6,
                  boxShadow: "0 2px 0 rgba(24, 144, 255, 0.2)",
                }}
              >
                Đăng ký
              </Button>
            </Link>
          </Space>
        ) : (
          <Dropdown
            menu={{items: userMenuItems}}
            trigger={["click"]}
            placement="bottomRight"
          >
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
              <div className="hidden md:flex flex-col text-right">
                <Text
                  strong
                  style={{fontSize: 15, lineHeight: "1.2", color: "#262626"}}
                >
                  {user?.name || user?.username || "Giảng viên"}
                </Text>
                <Text style={{fontSize: 13, color: "#8c8c8c"}}>
                  {user?.email || "Manage Syllabus"}
                </Text>
              </div>
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                size={44}
                style={{
                  backgroundColor: "#1890ff",
                  border: "2px solid #e6f7ff",
                }}
              />
            </div>
          </Dropdown>
        )}
      </div>
    </Header>
  );
};

export default MyHeader;
