import React, {useContext} from "react";
import {Layout, Button, Avatar, Space, Tooltip} from "antd";
import {UserOutlined, LoginOutlined, UserAddOutlined} from "@ant-design/icons";
import {Link} from "react-router-dom";
import {MyUserContext} from "../config/contexts/MyContext";

const {Header} = Layout;

const MyHeader = () => {
  const [user, dispatch] = useContext(MyUserContext);
  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: "0 20px",
        height: "70px",
        boxShadow: "0 2px 8px #f0f1f2",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "3px solid #368bd5",
      }}
    >
      <div style={{display: "flex", alignItems: "center"}}>
        <div
          style={{
            width: "150px",
            height: "50px",
            backgroundColor: "#f0f2f5",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <span style={{color: "#368bd5", fontWeight: "bold"}}>
            <Link to="/" style={{textDecoration: "none"}}>
              HCMOU LOGO
            </Link>
          </span>
        </div>
      </div>

      <Space size="middle">
        {user === null ? (
          <>
            <Button
              type="text"
              icon={<LoginOutlined />}
              style={{color: "#368bd5", fontWeight: 500}}
            >
              <Link to="/login">Đăng nhập</Link>
            </Button>

            <Button
              type="primary"
              icon={<UserAddOutlined />}
              style={{backgroundColor: "#368bd5"}}
            >
              <Link to="/register">Đăng ký</Link>
            </Button>

            <div
              style={{
                width: "1px",
                height: "20px",
                backgroundColor: "#f0f0f0",
                margin: "0 10px",
              }}
            />
          </>
        ) : (
          <>
            <Tooltip title="Hồ sơ cá nhân">
              <Link to="/profile">
                <Avatar
                  src={user?.avatar}
                  size="large"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: "#368bd5",
                    cursor: "pointer",
                    border: "2px solid #e6f7ff",
                  }}
                />
              </Link>
            </Tooltip>
            <Button
              type="text"
              icon={<LoginOutlined />}
              style={{color: "#368bd5", fontWeight: 500}}
            >
              <Link onClick={() => dispatch({type: "logout"})}>Đăng xuất</Link>
            </Button>
          </>
        )}
      </Space>
    </Header>
  );
};

export default MyHeader;
