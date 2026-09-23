import React, {useContext, useEffect, useState} from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Badge,
  Modal,
  Form,
  Space,
  Typography,
  message,
  Popconfirm,
  Avatar,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {UserService} from "../../services/UserService";
import {MyUserContext} from "../../config/contexts/MyContext";

const {Title, Text} = Typography;
const {Option} = Select;

const getFacultyDisplayName = (lecturer, facultyList = []) => {
  if (!lecturer) return "Chưa có khoa";
  if (lecturer.faculty?.name) return lecturer.faculty.name;
  if (typeof lecturer.faculty === "number") {
    const matched = facultyList.find((f) => f.id === lecturer.faculty);
    if (matched?.name) return matched.name;
  }
  return "Chưa có khoa";
};

const UserManagement = () => {
  const [currentUser] = useContext(MyUserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [pagination, setPagination] = useState({current: 1, pageSize: 10, total: 0});
  const [filters, setFilters] = useState({q: "", user_role: "", is_active: ""});

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const res = await UserService.getUsers(page, currentFilters);
      const data = res.data;

      if (data && data.results) {
        setUsers(data.results);
        setPagination({
          current: page,
          pageSize: 10,
          total: data.count || data.results.length,
        });
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error("Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await UserService.getFaculties();
      const list = res.data?.results || res.data || [];
      setFaculties(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Không thể tải danh sách khoa:", error);
    }
  };

  useEffect(() => {
    fetchUsers(1, filters);
    fetchFaculties();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchUsers(newPagination.current, filters);
  };

  const handleFilterChange = (key, value) => {
    const updatedFilters = {...filters, [key]: value};
    setFilters(updatedFilters);
    fetchUsers(1, updatedFilters);
  };

  const handleOpenEdit = (userRecord) => {
    if (!userRecord) return;
    if (!faculties || faculties.length === 0) {
      fetchFaculties();
    }

    setEditingUser(userRecord);

    const rawFaculty = userRecord.lecturer?.faculty;
    const initialFacultyId = rawFaculty?.id ?? (typeof rawFaculty === "number" ? rawFaculty : undefined);

    form.setFieldsValue({
      first_name: userRecord.first_name || "",
      last_name: userRecord.last_name || "",
      email: userRecord.email || "",
      user_role: userRecord.user_role || "user",
      room: userRecord.lecturer?.room || "",
      faculty: initialFacultyId,
    });
    setEditModalVisible(true);
  };

  useEffect(() => {
    if (!editingUser) return;
    if (!editModalVisible) return;

    const rawFaculty = editingUser.lecturer?.faculty;
    const initialFacultyId = rawFaculty?.id ?? (typeof rawFaculty === "number" ? rawFaculty : undefined);

    form.setFieldsValue({
      first_name: editingUser.first_name || "",
      last_name: editingUser.last_name || "",
      email: editingUser.email || "",
      user_role: editingUser.user_role || "user",
      room: editingUser.lecturer?.room || "",
      faculty: initialFacultyId,
    });
  }, [editingUser, editModalVisible, form]);

  const handleUpdateSubmit = async (values) => {
    if (!editingUser) return;

    try {
      setUpdating(true);

      const payload = {
        first_name: values.first_name !== undefined ? values.first_name.trim() : "",
        last_name: values.last_name !== undefined ? values.last_name.trim() : "",
        email: values.email !== undefined ? values.email.trim() : "",
        user_role: values.user_role,
        room: values.room !== undefined ? values.room.trim() : "",
        faculty: values.faculty ? Number(values.faculty) : null,
      };

      const res = await UserService.updateUser(editingUser.id, payload);

      if (res.status !== 200) {
        message.error(`Cập nhật thất bại. Mã trạng thái: ${res.status}`);
        return;
      }

      const updatedData = res.data;
      const selectedFaculty = faculties.find((f) => f.id === payload.faculty);

      // 1. Ghi đè mảng state users ngay lập tức để UI cập nhật tức thì
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id !== editingUser.id) return u;

          const updatedFaculty = payload.faculty
            ? (updatedData.lecturer?.faculty || selectedFaculty || { id: payload.faculty })
            : null;

          return {
            ...u,
            ...updatedData,
            lecturer: {
              ...(u.lecturer || {}),
              ...(updatedData.lecturer || {}),
              room: payload.room,
              faculty: updatedFaculty,
            },
          };
        })
      );

      // 2. Đóng modal và reset form ngay sau khi cập nhật thành công
      setEditModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      message.success("Cập nhật thông tin người dùng thành công!");

      // 3. Đồng bộ lại dữ liệu nền với server
      fetchUsers(pagination.current, filters);
    } catch (error) {
      console.error("Cập nhật thất bại:", error);
      const errorData = error.response?.data;
      let errorMsg = "Cập nhật người dùng thất bại!";

      if (typeof errorData === "string") {
        errorMsg = errorData;
      } else if (errorData && typeof errorData === "object") {
        const details = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        if (details) {
          errorMsg = details;
        }
      }

      message.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeactivate = async (userRecord) => {
    if (!userRecord) return;

    if (userRecord.id === currentUser?.id) {
      message.error("Admin không thể tự vô hiệu hóa tài khoản của chính mình!");
      return;
    }

    try {
      await UserService.deactivateUser(userRecord.id);

      // 1. Loại bỏ ngay item vừa xóa khỏi mảng state để không để lại item "xác" trên UI
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userRecord.id));

      // 2. Giảm tổng số lượng hiển thị trong phân trang
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));

      message.success("Vô hiệu hóa tài khoản thành công!");
    } catch (error) {
      const errMsg = error.response?.data?.error || "Vô hiệu hóa tài khoản thất bại!";
      message.error(errMsg);
    }
  };

  const handleActivate = async (userRecord) => {
    if (!userRecord) return;

    try {
      await UserService.activateUser(userRecord.id);

      // Cập nhật trạng thái trực tiếp trên mảng state
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userRecord.id ? {...u, is_active: true, active: true} : u))
      );

      message.success("Kích hoạt lại tài khoản thành công!");
      fetchUsers(pagination.current, filters);
    } catch (error) {
      const errMsg = error.response?.data?.error || "Kích hoạt tài khoản thất bại!";
      message.error(errMsg);
    }
  };

  const roleTags = {
    admin: <Tag color="magenta">Admin</Tag>,
    specialist: <Tag color="purple">Specialist</Tag>,
    user: <Tag color="blue">Giảng viên / User</Tag>,
  };

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <Space orientation="horizontal" size={12}>
          <Avatar
            src={record.avatar}
            icon={<UserOutlined />}
            style={{backgroundColor: "#1677ff"}}
          />
          <div>
            <div style={{fontWeight: 600, color: "#1f2937"}}>
              {record.last_name || ""} {record.first_name || ""}
            </div>
            <Text type="secondary" style={{fontSize: 12}}>
              @{record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || <Text type="secondary">Chưa cập nhật</Text>,
    },
    {
      title: "Vai trò",
      dataIndex: "user_role",
      key: "user_role",
      render: (role) => roleTags[role] || <Tag>{role}</Tag>,
    },
    {
      title: "Khoa & Phòng",
      key: "department",
      render: (_, record) => {
        const facultyName = getFacultyDisplayName(record.lecturer, faculties);
        const room = record.lecturer?.room ? ` (${record.lecturer.room})` : "";
        return <Text style={{fontSize: 13}}>{facultyName}{room}</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) =>
        isActive ? (
          <Badge status="success" text={<span className="text-green-600 font-medium">Hoạt động</span>} />
        ) : (
          <Badge status="error" text={<span className="text-red-500 font-medium">Vô hiệu hóa</span>} />
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined style={{color: "#1677ff"}} />}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>

          {record.is_active ? (
            <Popconfirm
              title="Vô hiệu hóa tài khoản"
              description={`Bạn có chắc muốn vô hiệu hóa tài khoản ${record.username}?`}
              onConfirm={() => handleDeactivate(record)}
              okText="Vô hiệu hóa"
              cancelText="Hủy"
              okButtonProps={{danger: true}}
              disabled={record.id === currentUser?.id}
            >
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                disabled={record.id === currentUser?.id}
              >
                Vô hiệu hóa
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Kích hoạt tài khoản"
              description={`Kích hoạt lại tài khoản ${record.username}?`}
              onConfirm={() => handleActivate(record)}
              okText="Kích hoạt"
              cancelText="Hủy"
            >
              <Button type="text" icon={<CheckCircleOutlined style={{color: "#52c41a"}} />}>
                Kích hoạt
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Title level={3} style={{margin: 0, fontWeight: 700}}>
            Quản lý Người dùng
          </Title>
          <Text type="secondary">
            Xem danh sách, phân quyền và quản lý trạng thái tài khoản hệ thống
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchUsers(pagination.current, filters)}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Card bordered={false} className="shadow-sm rounded-xl">
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={10} md={10}>
            <Input
              placeholder="Tìm kiếm theo tên, username, email..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
            />
          </Col>
          <Col xs={12} sm={7} md={7}>
            <Select
              style={{width: "100%"}}
              placeholder="Lọc theo vai trò"
              allowClear
              value={filters.user_role || undefined}
              onChange={(val) => handleFilterChange("user_role", val || "")}
            >
              <Option value="admin">Admin</Option>
              <Option value="specialist">Specialist</Option>
              <Option value="user">Giảng viên / User</Option>
            </Select>
          </Col>
          <Col xs={12} sm={7} md={7}>
            <Select
              style={{width: "100%"}}
              placeholder="Lọc theo trạng thái"
              allowClear
              value={filters.is_active || undefined}
              onChange={(val) => handleFilterChange("is_active", val !== undefined ? val : "")}
            >
              <Option value="true">Đang hoạt động</Option>
              <Option value="false">Đã vô hiệu hóa</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={`Chỉnh sửa thông tin: ${editingUser?.username}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateSubmit} className="mt-4">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Họ & Tên đệm" name="last_name">
                <Input placeholder="Nguyễn Văn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên" name="first_name">
                <Input placeholder="An" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email"
            name="email"
            rules={[{type: "email", message: "Định dạng email không hợp lệ"}]}
          >
            <Input placeholder="user@university.edu.vn" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="user_role"
            rules={[{required: true, message: "Vui lòng chọn vai trò"}]}
          >
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="specialist">Specialist</Option>
              <Option value="user">Giảng viên / User</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Khoa" name="faculty">
            <Select placeholder="Chọn khoa trực thuộc" allowClear>
              {faculties.map((f) => (
                <Option key={f.id} value={f.id}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Phòng làm việc" name="room">
            <Input placeholder="Ví dụ: Phòng A101" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setEditModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={updating}>
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
