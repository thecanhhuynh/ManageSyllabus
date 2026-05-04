import { message, Typography, Avatar, Button, Tag, Input, Table, Card, Space, Row, Col, Form, Modal, Select, Upload } from "antd";
import axiosClient, { endpoints } from "../../utils/Apis";
import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, LockOutlined, MailOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const UserManagement = () => {
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: import.meta.env.VITE_PAGE_SIZE,
        total: 0,
    });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    const loadRoles = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get(endpoints["roles"]);
            if (res.data.status === 200) {
                setRoles(res.data.data);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách vai trò!', error.message);
            console.error('Load roles error:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const loadUsers = async (page = 1) => {
        try {
            setLoading(true);
            let url = `${endpoints["users"]}?page=${page}`;
            if (q) url = `${url}&q=${q}`;
            const res = await axiosClient.get(url);
            if (res.data.status === 200) {
                setUsers(res.data.data);
                setPagination({
                    ...pagination,
                    current: page,
                    total: res.data.total
                });
            } else {
                message.error(res.data.err_msg);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách người dùng!', error.message);
            console.error('Load users error:', error);
        } finally {
            setLoading(false);
        }
    }

    const handAddClick = () => {
        setEditingUser(null);
        form.resetFields();
        setIsModalVisible(true);
    }

    const handleEditClick = (values) => {
        setEditingUser(values);
        form.setFieldsValue({
            username: values.username,
            name: values.name,
            role: values.role,
        })
        setIsModalVisible(true);
    }

    const handleModalSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();

            if (values.name) formData.append('name', values.name);
            if (values.username) formData.append('username', values.username);
            if (values.role) formData.append('role', values.role);
            if (values.password) formData.append('password', values.password);
            if (values.email) formData.append('email', values.email);

            if (values.avatar && values.avatar.length > 0) {
                formData.append('avatar', values.avatar[0].originFileObj);
            }
            let res;
            if (editingUser) {
                res = await axiosClient.patch(endpoints["user_details"](editingUser.id), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            else {
                res = await axiosClient.post(endpoints["users"], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            if (res.data.status === 200 || res.data.status === 201) {
                message.success(res.data.msg);
                setIsModalVisible(false);
                loadUsers(pagination.current);
            }
            else {
                message.error(res.data.err_msg);
            }
        } catch (error) {
            message.error('Lỗi khi lưu thông tin người dùng!', error.message);
            console.error('Save user error:', error);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let timer = setTimeout(() => {
            loadUsers(1);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    useEffect(() => {
        loadRoles();
    }, []);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            align: 'center',
        },
        {
            title: 'Tài khoản (Username)',
            dataIndex: 'username',
            key: 'username',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Họ và Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Vai trò (Role)',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                // Tô màu Tag tùy theo Role cho đẹp mắt
                let color = 'default';
                if (role === 'ADMIN') color = 'red';
                if (role === 'SPECIALIST') color = 'blue';
                if (role === 'USER') color = 'green';
                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            title: 'Active',
            dataIndex: 'active',
            key: 'active',
            render: (active) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Avatar',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 80,
            align: 'center',
            render: (avatar, record) => (
                <Avatar
                    src={avatar}
                    alt={record.username}
                >
                    {!avatar && record.username?.charAt(0).toUpperCase()}
                </Avatar>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 200,
            align: 'center',
            render: (record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} style={{ color: '#1890ff' }} onClick={() => handleEditClick(record)}>
                        Sửa
                    </Button>
                    {record.role !== 'ADMIN' && (
                        <Button type="text" danger icon={<DeleteOutlined />}>
                            Khóa
                        </Button>
                    )}
                </Space>
            ),
        },
    ];
    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý Người dùng</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handAddClick}>
                    Thêm Người dùng
                </Button>
            </div>
            <Card variant={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col style={{ width: '100%' }}>
                        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#595959' }}>Tìm kiếm Người dùng</div>
                        <Input size="large"
                            placeholder="Tìm theo tên hoặc username..."
                            prefix={<SearchOutlined />}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            allowClear
                        />
                    </Col>
                </Row>
            </Card>

            <Card variant={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showTotal: (total) => `Tổng ${total} user`,
                        placement: ['bottomCenter']
                    }}
                    onChange={(newPagination) => loadUsers(newPagination.current)}
                />
            </Card>
            <Modal
                title={editingUser ? "Chỉnh sửa Người dùng" : "Thêm Người dùng mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()} // Bấm OK sẽ trigger hàm onFinish của Form
                confirmLoading={loading}
                okText="Lưu thông tin"
                cancelText="Hủy"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleModalSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Họ và Tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input placeholder="Ví dụ: Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        {/* Nếu đang sửa thì không cho đổi Username */}
                        <Input placeholder="Ví dụ: nguyenvana" disabled={!!editingUser} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: !editingUser, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Email"
                            size="large"
                        />
                    </Form.Item>
                    {/* Mẹo nhỏ: Mật khẩu bắt buộc khi Thêm, nhưng không bắt buộc khi Sửa */}
                    <Form.Item
                        name="password"
                        label={editingUser ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
                        rules={[{ required: !editingUser, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu..." />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        rules={[
                            { required: !editingUser, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="avatar"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => {
                            if (Array.isArray(e)) return e;
                            return e && e.fileList;
                        }}
                        rules={[{ required: !editingUser, message: 'Vui lòng chọn avatar!' }]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            listType="picture"
                            maxCount={1}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />}>Chọn Avatar</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Vai trò (Role)"
                        rules={[{ required: !editingUser, message: 'Vui lòng chọn vai trò!' }]}
                    >
                        <Select
                            placeholder="Chọn vai trò"
                            options={roles.map(role => ({ label: role.name, value: role.name }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default UserManagement;