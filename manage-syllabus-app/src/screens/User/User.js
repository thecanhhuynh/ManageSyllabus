import React, {useContext, useEffect, useState} from "react";
import {
  Card,
  Avatar,
  Button,
  Form,
  Input,
  Row,
  Col,
  Typography,
  message,
  Select,
  Tag,
  Divider,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {MyUserContext} from "../../config/contexts/MyContext";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import dayjs from "dayjs";

const {Title, Text} = Typography;

const User = () => {
  const [user, dispatch] = useContext(MyUserContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        room: user.lecturer?.room || user.room,
        faculty: user.lecturer?.faculty?.id,
      });
    } else {
      form.resetFields();
    }
  }, [user, form, editing]);

  const loadFaculties = async () => {
    try {
      setLoading(true);
      const res = await authApis().get(
        `${endpoints["faculties"]}?page=${page}`,
      );
      if (res.status === 200) {
        if (page === 1) setFaculties(res.data.results);
        else setFaculties([...faculties, ...res.data.results]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculties();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [user]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    setSubmitLoading(true);
    try {
      const res = await authApis().patch(endpoints["profile"], values);

      if (res.status === 200) {
        message.success("Cập nhật thông tin thành công!");
        dispatch({
          type: "login",
          payload: res.data,
        });
        setEditing(false);
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi lưu thông tin!");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!user) {
    return <MySpinner message="Đang tải thông tin cá nhân..." />;
  }

  return (
    <div
      className="p-8"
      style={{background: "#f3f4f6", minHeight: "calc(100vh - 64px)"}}
    >
      <div style={{maxWidth: 1000, margin: "0 auto"}}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title
              level={3}
              style={{margin: 0, fontWeight: 700, color: "#111827"}}
            >
              Thông tin cá nhân
            </Title>
            <Text style={{color: "#6b7280", fontSize: 14}}>
              Quản lý thông tin cá nhân và tài khoản
            </Text>
          </div>
          <div className="flex gap-2">
            <Tag
              style={{
                borderRadius: 16,
                padding: "4px 12px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              ID: {user.username || "N/A"}
            </Tag>
            <Tag
              style={{
                borderRadius: 16,
                padding: "4px 12px",
                border: "none",
                background: "#e5e7eb",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Đã duyệt
            </Tag>
          </div>
        </div>

        <Card
          bordered={false}
          bodyStyle={{padding: 0}}
          style={{
            borderRadius: 12,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
        >
          <div className="flex flex-col md:flex-row">
            <div
              className="w-full md:w-1/3 p-8 flex flex-col items-center"
              style={{borderRight: "1px solid #f3f4f6", background: "#ffffff"}}
            >
              <div className="relative mb-4">
                <Avatar
                  size={140}
                  src={user.avatar}
                  style={{border: "2px solid #f3f4f6"}}
                >
                  {!user.avatar &&
                    (user.last_name ? user.last_name.charAt(0) : "U")}
                </Avatar>
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    backgroundColor: "#10b981",
                    borderRadius: "50%",
                    border: "4px solid #ffffff",
                  }}
                />
              </div>

              <div className="text-center w-full">
                <Title
                  level={4}
                  style={{margin: 0, fontWeight: 600, color: "#1f2937"}}
                >
                  {user.last_name} {user.first_name}
                </Title>
              </div>
            </div>

            <div className="w-full md:w-2/3 p-8 bg-white">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <UserOutlined style={{fontSize: 20, color: "#1f2937"}} />
                  <Title
                    level={4}
                    style={{margin: 0, fontWeight: 600, color: "#1f2937"}}
                  >
                    Thông tin tài khoản
                  </Title>
                </div>
                {!editing ? (
                  <Button
                    icon={<EditOutlined />}
                    onClick={startEdit}
                    style={{
                      borderRadius: 6,
                      borderColor: "#d1d5db",
                      color: "#374151",
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={cancelEdit} style={{borderRadius: 6}}>
                      Hủy
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => form.submit()}
                      loading={submitLoading}
                      style={{
                        borderRadius: 6,
                        background: "#111827",
                        borderColor: "#111827",
                      }}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </div>

              <Divider style={{margin: "0 0 32px 0", borderColor: "#f3f4f6"}} />

              {!editing ? (
                <div className="flex flex-col gap-8">
                  <Row gutter={[32, 24]}>
                    <Col span={12}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Họ và Tên
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {user.last_name} {user.first_name}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Email
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {user.email || "N/A"}
                      </div>
                    </Col>
                  </Row>

                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Khoa
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {user.lecturer?.faculty?.name || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Phòng liên hệ
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {user.lecturer?.room || "N/A"}
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-lg border border-gray-200 flex flex-wrap gap-8 bg-gray-50/50">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Tài khoản tạo
                      </div>
                      <div className="text-xs font-medium text-gray-800">
                        {dayjs(user.date_joined).format("MMMM D, YYYY")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Lần cuối đăng nhập
                      </div>
                      <div className="text-xs font-medium text-gray-800">
                        {dayjs(user.last_login).format("DD/MM/YYYY HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  size="large"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="last_name"
                        label={
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Last Name
                          </span>
                        }
                        rules={[{required: true, message: "Vui lòng nhập họ!"}]}
                      >
                        <Input style={{borderRadius: 6}} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="first_name"
                        label={
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            First Name
                          </span>
                        }
                        rules={[
                          {required: true, message: "Vui lòng nhập tên!"},
                        ]}
                      >
                        <Input style={{borderRadius: 6}} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="email"
                    label={
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Email Address
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        type: "email",
                        message: "Email không hợp lệ!",
                      },
                    ]}
                  >
                    <Input style={{borderRadius: 6}} />
                  </Form.Item>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="faculty"
                        label={
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Faculty Department
                          </span>
                        }
                      >
                        <Select
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          loading={loading}
                          options={faculties.map((f) => ({
                            value: f.id,
                            label: f.name,
                          }))}
                          style={{borderRadius: 6}}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="room"
                        label={
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Office Location / Room
                          </span>
                        }
                      >
                        <Input style={{borderRadius: 6}} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default User;
