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
  Modal,
  Upload,
  Space,
} from "antd";
import {
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  UploadOutlined,
  LockOutlined,
} from "@ant-design/icons";
import SignaturePadModal from "../../components/signature/SignaturePadModal";
import SignatureService from "../../services/signatureService";
import {resolveMediaUrl} from "../../utils/mediaUtils";
import {MyUserContext} from "../../config/contexts/MyContext";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import dayjs from "dayjs";

const {Title, Text} = Typography;

const FACULTY_ROLE_MAP = {
  dean: {label: "Trưởng khoa", color: "volcano"},
  vice_dean: {label: "Phó trưởng khoa", color: "orange"},
  head_of_dept: {label: "Trưởng bộ môn", color: "cyan"},
  lecturer: {label: "Giảng viên", color: "blue"},
};

const SYSTEM_ROLE_MAP = {
  admin: {label: "Quản trị viên", color: "error"},
  specialist: {label: "Chuyên viên", color: "purple"},
  user: {label: "Giảng viên / User", color: "blue"},
};

const User = () => {
  const [user, dispatch] = useContext(MyUserContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();
  const [faculties, setFaculties] = useState([]);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [signatureImgError, setSignatureImgError] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordForm] = Form.useForm();

  const canApprove = Boolean(
    user?.lecturer?.is_leader ||
    user?.is_superuser ||
    user?.user_role === "admin",
  );
  const facultyRoleInfo =
    FACULTY_ROLE_MAP[user?.lecturer?.faculty_role] || FACULTY_ROLE_MAP.lecturer;
  const systemRoleInfo =
    SYSTEM_ROLE_MAP[user?.user_role] || SYSTEM_ROLE_MAP.user;

  useEffect(() => {
    setSignatureImgError(false);
  }, [signatureUrl]);

  const loadUserSignature = async () => {
    try {
      setSignatureLoading(true);
      const data = await SignatureService.getUserSignature();
      setSignatureUrl(data?.signature_url || null);
    } catch (err) {
      console.error("Lỗi tải chữ ký:", err);
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleSaveSignature = async (sigData) => {
    try {
      setSignatureLoading(true);
      const res = await SignatureService.saveUserSignature(sigData);
      if (res?.signature_url) {
        setSignatureUrl(res.signature_url);
        message.success("Cập nhật chữ ký cá nhân thành công!");
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu chữ ký cá nhân!");
    } finally {
      setSignatureLoading(false);
      setSignatureModalOpen(false);
    }
  };

  const handleDeleteSignature = async () => {
    try {
      setSignatureLoading(true);
      await SignatureService.deleteUserSignature();
      setSignatureUrl(null);
      message.success("Đã xóa chữ ký cá nhân.");
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xóa chữ ký cá nhân!");
    } finally {
      setSignatureLoading(false);
    }
  };

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
    if (user) {
      loadUserSignature();
    }
  }, [user]);

  const startEdit = () => setEditing(true);
  const cancelEdit = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      const res = await authApis().post(endpoints["change-password"], {
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success(res.data?.message || "Đổi mật khẩu thành công!");
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (err) {
      const errMsg = err?.response?.data?.error || "Đổi mật khẩu thất bại!";
      message.error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    const isImage =
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/jpg" ||
      file.type === "image/webp";
    if (!isImage) {
      message.error("Vui lòng chọn tệp ảnh hợp lệ (PNG, JPG, WEBP)!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 <= 5;
    if (!isLt5M) {
      message.error("Kích thước ảnh đại diện tối đa là 5MB!");
      return false;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarUploading(true);
    try {
      const res = await authApis().patch(endpoints["profile"], formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      if (res.status === 200) {
        message.success("Cập nhật ảnh đại diện thành công!");
        dispatch({
          type: "login",
          payload: res.data,
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải lên ảnh đại diện!");
    } finally {
      setAvatarUploading(false);
    }
    return false;
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
          <div className="flex gap-2 items-center flex-wrap">
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
              color={systemRoleInfo.color}
              style={{borderRadius: 16, padding: "4px 12px", fontWeight: 500}}
            >
              {systemRoleInfo.label}
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
                  src={resolveMediaUrl(user.avatar)}
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

              <Upload
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={avatarUploading}
                  style={{marginBottom: 16}}
                >
                  Đổi ảnh đại diện
                </Button>
              </Upload>

              <div className="text-center w-full">
                <Title
                  level={4}
                  style={{margin: 0, fontWeight: 600, color: "#1f2937"}}
                >
                  {user.last_name} {user.first_name}
                </Title>
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  <Tag color={facultyRoleInfo.color} style={{fontWeight: 600}}>
                    {facultyRoleInfo.label}
                  </Tag>
                  {user.lecturer?.faculty?.name && (
                    <Tag color="default">{user.lecturer.faculty.name}</Tag>
                  )}
                </div>
                <div className="mt-2">
                  {canApprove ? (
                    <Tag
                      color="success"
                      icon={<SafetyCertificateOutlined />}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      Có thẩm quyền phê duyệt
                    </Tag>
                  ) : (
                    <Tag
                      color="default"
                      style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    >
                      Giảng viên biên soạn
                    </Tag>
                  )}
                </div>
              </div>

              <Divider style={{margin: "24px 0 16px 0"}} />

              <div className="w-full text-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Chữ ký cá nhân
                </div>
                {signatureUrl ? (
                  <div className="flex flex-col items-center">
                    <div
                      className="p-2 border border-dashed border-gray-300 rounded bg-gray-50 mb-3 flex items-center justify-center overflow-hidden"
                      style={{width: "100%", maxWidth: 200, height: 90}}
                    >
                      {signatureImgError ? (
                        <Text
                          type="secondary"
                          style={{fontSize: 12, textAlign: "center"}}
                        >
                          Ảnh chữ ký không tải được. Vui lòng đổi lại.
                        </Text>
                      ) : (
                        <img
                          src={resolveMediaUrl(signatureUrl)}
                          alt="Chữ ký"
                          onError={() => setSignatureImgError(true)}
                          style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        loading={signatureLoading}
                        onClick={() => setSignatureModalOpen(true)}
                      >
                        Đổi chữ ký
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={signatureLoading}
                        onClick={handleDeleteSignature}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 text-xs italic mb-2">
                      Chưa thiết lập chữ ký cá nhân
                    </div>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<EditOutlined />}
                      loading={signatureLoading}
                      onClick={() => setSignatureModalOpen(true)}
                    >
                      Thêm chữ ký
                    </Button>
                  </div>
                )}
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
                  <Space>
                    <Button
                      icon={<KeyOutlined />}
                      onClick={() => setPasswordModalOpen(true)}
                      style={{
                        borderRadius: 6,
                        borderColor: "#d1d5db",
                        color: "#374151",
                      }}
                    >
                      Đổi mật khẩu
                    </Button>
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
                  </Space>
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

                  <Row gutter={[32, 24]}>
                    <Col span={12}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Chức vụ trong Khoa
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        <Tag
                          color={facultyRoleInfo.color}
                          style={{fontWeight: 600}}
                        >
                          {facultyRoleInfo.label}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Thẩm quyền phê duyệt
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {canApprove ? (
                          <span style={{color: "#16a34a", fontWeight: 600}}>
                            ✓ Được phép phê duyệt đề cương
                          </span>
                        ) : (
                          <span style={{color: "#6b7280"}}>
                            Biên soạn (Cần Lãnh đạo Khoa duyệt)
                          </span>
                        )}
                      </div>
                    </Col>
                  </Row>

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
        <SignaturePadModal
          visible={signatureModalOpen}
          onCancel={() => setSignatureModalOpen(false)}
          onConfirm={handleSaveSignature}
          mode="profile"
          roleTitle="Cập nhật chữ ký cá nhân"
        />

        <Modal
          title={
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <KeyOutlined style={{color: "#1890ff"}} />
              <span>Đổi mật khẩu</span>
            </div>
          }
          open={passwordModalOpen}
          onCancel={() => {
            setPasswordModalOpen(false);
            passwordForm.resetFields();
          }}
          onOk={() => passwordForm.submit()}
          confirmLoading={passwordLoading}
          okText="Cập nhật mật khẩu"
          cancelText="Đóng"
          destroyOnClose
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            style={{marginTop: 16}}
          >
            <Form.Item
              name="old_password"
              label="Mật khẩu hiện tại"
              rules={[{required: true, message: "Vui lòng nhập mật khẩu hiện tại"}]}
            >
              <Input.Password prefix={<LockOutlined style={{color: "#9ca3af"}} />} placeholder="Nhập mật khẩu cũ" />
            </Form.Item>

            <Form.Item
              name="new_password"
              label="Mật khẩu mới"
              rules={[
                {required: true, message: "Vui lòng nhập mật khẩu mới"},
                {min: 8, message: "Mật khẩu mới phải có tối thiểu 8 ký tự"},
                {
                  pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một chữ số",
                },
                ({getFieldValue}) => ({
                  validator(_, value) {
                    if (value && getFieldValue("old_password") === value) {
                      return Promise.reject(new Error("Mật khẩu mới không được trùng với mật khẩu cũ!"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{color: "#9ca3af"}} />} placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường & số" />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="Xác nhận mật khẩu mới"
              dependencies={["new_password"]}
              rules={[
                {required: true, message: "Vui lòng xác nhận lại mật khẩu mới"},
                ({getFieldValue}) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{color: "#9ca3af"}} />} placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default User;
