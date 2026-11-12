import React, {useContext, useState} from "react";
import {Card, Form, Input, Button, Typography, message, Divider} from "antd";
import {UserOutlined, LockOutlined, BookOutlined} from "@ant-design/icons";
import {useNavigate, Link, useSearchParams} from "react-router-dom";
import cookies from "react-cookies";
import Apis, {
  authApis,
  endpoints,
  CLIENT_ID,
  CLIENT_SECRET,
} from "../../config/Apis";
import {MyUserContext} from "../../config/contexts/MyContext";
import CleanInput from "../../components/CleanInput";
import {cleanWhitespace} from "../../utils/stringUtils";

const {Title, Text} = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [, dispatch] = useContext(MyUserContext);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [form] = Form.useForm();

  const validateLoginForm = (values) => {
    const errors = {};
    const cleanData = {};

    const username = values?.username || "";
    cleanData.username = cleanWhitespace(username);

    if (!cleanData.username) {
      errors.username = "Tên đăng nhập không được để trống!";
    } else if (cleanData.username.length < 3) {
      errors.username = "Tên đăng nhập phải có ít nhất 3 ký tự!";
    } else if (cleanData.username.length > 50) {
      errors.username = "Tên đăng nhập không được vượt quá 50 ký tự!";
    }

    const password = values?.password || "";
    cleanData.password = password;

    if (!cleanData.password) {
      errors.password = "Mật khẩu không được để trống!";
    } else if (cleanData.password.length < 3) {
      errors.password = "Mật khẩu phải có ít nhất 3 ký tự!";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      cleanData,
    };
  };

  const handleLogin = async (values) => {
    const {isValid, errors, cleanData} = validateLoginForm(values);

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      message.error(firstError);
      return;
    }
    try {
      setLoading(true);
      const res = await Apis.post(
        endpoints["login"],
        `grant_type=password&username=${cleanData.username}&password=${cleanData.password}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      cookies.save("token", res.data.access_token);
      cookies.save("refresh_token", res.data.refresh_token);
      const user = await authApis().get(endpoints["profile"]);
      console.log(user);
      dispatch({
        type: "login",
        payload: user.data,
      });

      message.success("Đăng nhập thành công!");
      const next = params.get("next");

      const roleRoutes = {
        admin: "/admin",
        specialist: "/specialist",
      };

      nav(next || roleRoutes[user.data.user_role] || "/");
    } catch (error) {
      console.error(error);
      message.error("Tên đăng nhập hoặc mật khẩu không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{background: "#f8fafb"}}
    >
      <div style={{width: "100%", maxWidth: 400}}>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow:
              "0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)",
            background: "#ffffff",
          }}
          bodyStyle={{padding: "40px 32px 32px 32px"}}
        >
          <div className="flex flex-col items-center mb-8 text-center">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#1890ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <BookOutlined style={{color: "#ffffff", fontSize: 22}} />
            </div>
            <Title
              level={3}
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#1890ff",
                fontSize: 22,
              }}
            >
              Management Syllabus System
            </Title>
          </div>

          <Form
            form={form}
            layout="vertical"
            size="large"
            onFinish={handleLogin}
            requiredMark={true}
          >
            <Form.Item
              name="username"
              label={
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    letterSpacing: "0.5px",
                  }}
                >
                  USERNAME
                </span>
              }
              rules={[
                {required: true, message: "Vui lòng nhập tên đăng nhập!"},
                {min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!"},
                {
                  validator: (_, value) =>
                    value && value.trim() === ""
                      ? Promise.reject(
                          new Error(
                            "Tên đăng nhập không được chỉ chứa khoảng trắng!",
                          ),
                        )
                      : Promise.resolve(),
                },
              ]}
              style={{marginBottom: 20}}
            >
              <CleanInput
                prefix={
                  <UserOutlined style={{color: "#9ca3af", marginRight: 8}} />
                }
                placeholder="Enter your username"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b7280",
                    letterSpacing: "0.5px",
                  }}
                >
                  PASSWORD
                </span>
              }
              rules={[
                {required: true, message: "Vui lòng nhập mật khẩu!"},
                {min: 3, message: "Mật khẩu phải có ít nhất 3 ký tự!"},
              ]}
              style={{marginBottom: 24}}
            >
              <Input.Password
                prefix={
                  <LockOutlined style={{color: "#9ca3af", marginRight: 8}} />
                }
                placeholder="••••••••"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item style={{marginBottom: 0}}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  fontWeight: 600,
                  height: 42,
                  borderRadius: 8,
                  fontSize: 14,
                  backgroundColor: "#1677ff",
                  boxShadow: "none",
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{margin: "24px 0 20px 0", borderColor: "#f3f4f6"}} />

          <div className="flex flex-col items-center gap-3">
            <Link
              to="/register"
              style={{color: "#6b7280", fontSize: 13, fontWeight: 500}}
              className="hover:text-blue-500 transition-colors"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Text style={{fontSize: 12, color: "#9ca3af"}}>
            © {new Date().getFullYear()} Syllabus Management System. University
            Faculty Administration Portal.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
