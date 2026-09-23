import React, {useState} from "react";
import {Card, Form, Input, Button, Typography, message, Divider, Row, Col} from "antd";
import {UserOutlined, LockOutlined, MailOutlined, BookOutlined} from "@ant-design/icons";
import {useNavigate, Link} from "react-router-dom";
import Apis, {endpoints} from "../../config/Apis";

const {Title, Text} = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const validateInputs = (values) => {
    if (!values.username || !values.username.trim()) {
      message.error("Vui lòng nhập tên đăng nhập!");
      return false;
    }

    if (!values.email || !values.email.trim()) {
      message.error("Vui lòng nhập địa chỉ email!");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(values.email.trim())) {
      message.error("Định dạng email không hợp lệ!");
      return false;
    }

    if (!values.password) {
      message.error("Vui lòng nhập mật khẩu!");
      return false;
    }

    if (values.password.length < 6) {
      message.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return false;
    }

    if (values.password !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return false;
    }

    return true;
  };

  const handleRegister = async (values) => {
    if (!validateInputs(values)) return;

    try {
      setLoading(true);
      const payload = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        first_name: (values.first_name || "").trim(),
        last_name: (values.last_name || "").trim(),
      };

      const res = await Apis.post(endpoints.register, payload);

      if (res.status === 201) {
        message.success("Đăng ký tài khoản thành công! Đang chuyển hướng...");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }
    } catch (error) {
      const serverError = error.response?.data?.error;
      const errorMsg =
        typeof serverError === "string"
          ? serverError
          : "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      <div style={{width: "100%", maxWidth: 520}}>
        <div className="text-center mb-6">
          <div
            style={{
              width: 52,
              height: 52,
              backgroundColor: "#e6f4ff",
              color: "#1677ff",
              borderRadius: 14,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            <BookOutlined />
          </div>
          <Title
            level={3}
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#1f2937",
              letterSpacing: "-0.5px",
            }}
          >
            Đăng ký tài khoản
          </Title>
          <Text style={{color: "#6b7280", fontSize: 14, marginTop: 4, display: "block"}}>
            Hệ thống Quản lý và Biên soạn Đề cương
          </Text>
        </div>

        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
            padding: "12px 8px",
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            requiredMark={false}
            size="large"
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={<span style={{fontSize: 13, fontWeight: 600}}>Họ & Tên đệm</span>}
                  name="last_name"
                >
                  <Input placeholder="Nguyễn Văn" style={{borderRadius: 8, fontSize: 14}} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={<span style={{fontSize: 13, fontWeight: 600}}>Tên</span>}
                  name="first_name"
                >
                  <Input placeholder="An" style={{borderRadius: 8, fontSize: 14}} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span style={{fontSize: 13, fontWeight: 600}}>Tên đăng nhập</span>}
              name="username"
              rules={[{required: true, message: "Vui lòng nhập tên đăng nhập"}]}
            >
              <Input
                prefix={<UserOutlined style={{color: "#9ca3af", marginRight: 6}} />}
                placeholder="nguyenvanan"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{fontSize: 13, fontWeight: 600}}>Email</span>}
              name="email"
              rules={[
                {required: true, message: "Vui lòng nhập email"},
                {type: "email", message: "Email không hợp lệ"},
              ]}
            >
              <Input
                prefix={<MailOutlined style={{color: "#9ca3af", marginRight: 6}} />}
                placeholder="an.nv@university.edu.vn"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{fontSize: 13, fontWeight: 600}}>Mật khẩu</span>}
              name="password"
              rules={[{required: true, message: "Vui lòng nhập mật khẩu"}]}
            >
              <Input.Password
                prefix={<LockOutlined style={{color: "#9ca3af", marginRight: 6}} />}
                placeholder="Tối thiểu 6 ký tự"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{fontSize: 13, fontWeight: 600}}>Xác nhận mật khẩu</span>}
              name="confirmPassword"
              rules={[{required: true, message: "Vui lòng xác nhận mật khẩu"}]}
            >
              <Input.Password
                prefix={<LockOutlined style={{color: "#9ca3af", marginRight: 6}} />}
                placeholder="Nhập lại mật khẩu"
                style={{borderRadius: 8, fontSize: 14}}
              />
            </Form.Item>

            <Form.Item style={{marginTop: 8, marginBottom: 8}}>
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
                Đăng ký tài khoản
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{margin: "20px 0 16px 0", borderColor: "#f3f4f6"}} />

          <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
            <span>Đã có tài khoản?</span>
            <Link
              to="/login"
              style={{color: "#1677ff", fontWeight: 600}}
              className="hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
