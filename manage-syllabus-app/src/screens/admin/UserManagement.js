import React, {useContext, useEffect, useState} from "react";
import {
  Table,
  Card,
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
import CleanInput from "../../components/CleanInput";
import {cleanFormData} from "../../utils/stringUtils";

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
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `Tổng cộng ${total} người dùng`,
    showSizeChanger: false,
  });
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
          showTotal: (total) => `Tổng cộng ${total} người dùng`,
          showSizeChanger: false,
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
      faculty_role: editingUser.lecturer?.faculty_role || "lecturer",
      room: editingUser.lecturer?.room || "",
      faculty: initialFacultyId,
    });
  }, [editingUser, editModalVisible, form]);

  const handleUpdateSubmit = async (values) => {
    if (!editingUser) return;

    const executeUpdate = async () => {
      try {
        setUpdating(true);

        const payload = cleanFormData({
          first_name: values.first_name || "",
          last_name: values.last_name || "",
          email: values.email || "",
          user_role: values.user_role,
          faculty_role: values.faculty_role || "lecturer",
          room: values.room || "",
          faculty: values.faculty ? Number(values.faculty) : null,
        });

        const res = await UserService.updateUser(editingUser.id, payload);

        if (res.status !== 200) {
          message.error(`Cập nhật thất bại. Mã trạng thái: ${res.status}`);
          return;
        }

        const updatedData = res.data;
        const selectedFaculty = faculties.find((f) => f.id === payload.faculty);

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

        setEditModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        message.success("Cập nhật thông tin người dùng thành công!");

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

    const oldRole = editingUser.lecturer?.faculty_role || "lecturer";
    const isDemotingLeader =
      (oldRole === "dean" || oldRole === "vice_dean") &&
      values.faculty_role !== "dean" &&
      values.faculty_role !== "vice_dean";

    if (isDemotingLeader) {
      Modal.confirm({
        title: "Xác nhận hạ quyền Lãnh đạo Khoa",
        content: `Người dùng ${editingUser.last_name} ${editingUser.first_name} đang giữ chức vụ Lãnh đạo Khoa. Việc hạ quyền có thể làm gián đoạn quyền duyệt các đề cương đang chờ phê duyệt. Bạn có chắc chắn muốn hạ quyền?`,
        okText: "Tiếp tục hạ quyền",
        okType: "danger",
        cancelText: "Hủy",
        onOk: () => executeUpdate(),
      });
      return;
    }

    await executeUpdate();
  };

  const handleDeactivate = async (userRecord) => {
    if (!userRecord) return;

    if (userRecord.id === currentUser?.id) {
      message.error("Admin không thể tự vô hiệu hóa tài khoản của chính mình!");
      return;
    }

    try {
      await UserService.deactivateUser(userRecord.id);

      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userRecord.id));

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
      width: 220,
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
      width: 180,
      render: (email) => email || <Text type="secondary">Chưa cập nhật</Text>,
    },
    {
      title: "Vai trò",
      dataIndex: "user_role",
      key: "user_role",
      width: 120,
      render: (role) => roleTags[role] || <Tag>{role}</Tag>,
    },
    {
      title: "Chức vụ",
      key: "faculty_role",
      width: 140,
      render: (_, record) => {
        const role = record.lecturer?.faculty_role || "lecturer";
        const map = {
          dean: { text: "Trưởng khoa", color: "volcano" },
          vice_dean: { text: "Phó trưởng khoa", color: "orange" },
          head_of_dept: { text: "Trưởng bộ môn", color: "cyan" },
          lecturer: { text: "Giảng viên", color: "blue" },
        };
        const info = map[role] || map.lecturer;
        return (
          <Tag color={info.color} style={{ fontWeight: 500 }}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: "Khoa & Phòng",
      key: "department",
      width: 180,
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
      width: 130,
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
      width: 140,
      fixed: "right",
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
            <CleanInput
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
          scroll={{x: 1110}}
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
              <Form.Item
                label="Họ & Tên đệm"
                name="last_name"
                rules={[{required: true, message: "Vui lòng nhập họ & tên đệm!"}]}
              >
                <CleanInput placeholder="Nguyễn Văn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên"
                name="first_name"
                rules={[{required: true, message: "Vui lòng nhập tên!"}]}
              >
                <CleanInput placeholder="An" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Email"
            name="email"
            rules={[{type: "email", message: "Định dạng email không hợp lệ"}]}
          >
            <CleanInput placeholder="user@university.edu.vn" />
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

          <Form.Item label="Chức vụ trong Khoa" name="faculty_role">
            <Select placeholder="Chọn chức vụ">
              <Option value="dean">Trưởng khoa (Có quyền phê duyệt)</Option>
              <Option value="vice_dean">Phó trưởng khoa (Có quyền phê duyệt)</Option>
              <Option value="head_of_dept">Trưởng bộ môn</Option>
              <Option value="lecturer">Giảng viên biên soạn</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Khoa"
            name="faculty"
            dependencies={["faculty_role"]}
            rules={[
              ({getFieldValue}) => ({
                validator(_, value) {
                  const role = getFieldValue("faculty_role");
                  if (["dean", "vice_dean"].includes(role) && !value) {
                    return Promise.reject(
                      new Error("Lãnh đạo Khoa (Trưởng/Phó khoa) bắt buộc phải chọn Khoa trực thuộc!"),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Select placeholder="Chọn khoa trực thuộc" allowClear>
              {faculties.map((f) => (
                <Option key={f.id} value={f.id}>
                  {f.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Phòng làm việc" name="room">
            <CleanInput placeholder="Ví dụ: Phòng A101" />
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
