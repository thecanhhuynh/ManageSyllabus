import {Button, Card, Form, Input, message} from "antd";
import Apis, {
  authApis,
  CLIENT_ID,
  CLIENT_SECRET,
  endpoints,
} from "../../config/Apis";
import {useContext, useState} from "react";
import MySpinner from "../../components/MySpinner";
import cookies from "react-cookies";
import {MyUserContext} from "../../config/contexts/MyContext";
import {UserOutlined, LockOutlined} from "@ant-design/icons";
import Title from "antd/es/typography/Title";
import {useNavigate} from "react-router-dom";
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [, dispatch] = useContext(MyUserContext);
  const nav = useNavigate();
  const userInfo = [
    {
      field: "username",
      label: "Tên đăng nhập",
      type: "text",
      icon: <UserOutlined />,
    },
    {
      field: "password",
      label: "Mật khẩu",
      type: "password",
      icon: <LockOutlined />,
    },
  ];
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const res = await Apis.post(
        endpoints["login"],
        `grant_type=password&username=${values.username}&password=${values.password}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
        {
          headers: {"Content-Type": "application/x-www-form-urlencoded"},
        },
      );

      if (res.status === 200) {
        cookies.save("token", res.data.access_token);
        cookies.save("refresh_token", res.data.refresh_token);
        message.success("Đăng nhập thành công");

        const uInfo = await authApis().get(endpoints["profile"]);
        console.log(uInfo.data);
        dispatch({
          type: "login",
          payload: uInfo.data,
        });
        nav("/");
      } else {
        message.error("Đăng nhập thất bại");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: "0 8px 24px rgba(0, 82, 156, 0.15)",
          borderRadius: "10px",
          borderTop: "5px solid #00529C",
        }}
      >
        <div style={{textAlign: "center", marginBottom: "30px"}}>
          <Title
            level={3}
            style={{color: "#00529C", margin: 0, textTransform: "uppercase"}}
          >
            Đăng nhập
          </Title>
          <p style={{color: "#8c8c8c", marginTop: "8px"}}>
            Hệ thống Quản lý Đề cương HCMOU
          </p>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          initialValues={{remember: true}}
          onFinish={handleLogin}
          autoComplete="off"
          size="large"
        >
          {userInfo.map((u) => (
            <Form.Item
              key={u.field}
              label={<span style={{fontWeight: 500}}>{u.label}</span>}
              name={u.field}
              rules={[
                {
                  required: true,
                  message: `Vui lòng nhập ${u.label.toLowerCase()}!`,
                },
              ]}
            >
              {u.type === "password" ? (
                <Input.Password
                  prefix={u.icon}
                  placeholder={`Nhập ${u.label.toLowerCase()}`}
                />
              ) : (
                <Input
                  prefix={u.icon}
                  placeholder={`Nhập ${u.label.toLowerCase()}`}
                />
              )}
            </Form.Item>
          ))}

          <div style={{textAlign: "right", marginBottom: "20px"}}>
            <a style={{color: "#00529C"}} href="#forgot">
              Quên mật khẩu?
            </a>
          </div>

          <Form.Item style={{marginBottom: 0}}>
            {loading ? (
              <MySpinner />
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  backgroundColor: "#00529C",
                  height: "45px",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ĐĂNG NHẬP
              </Button>
            )}
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
