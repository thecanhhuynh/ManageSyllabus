import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Upload } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('username', values.username);
        formData.append('password', values.password);
        if (values.avatar && values.avatar.length > 0) {
            formData.append('avatar', values.avatar[0].originFileObj);
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/register', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.status === 200) {
                message.success('Đăng ký thành công! Vui lòng đăng nhập.');
                navigate('/login');
            } else {
                message.error(response.data.err_msg || 'Đăng ký thất bại!');
            }
        } catch (error) {
            message.error('Lỗi kết nối đến Server!', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', flexDirection: 'column' }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: 40, textTransform: 'uppercase', textAlign: 'center' }}>
                Hệ Thống Quản Lý Đề Cương Môn Học
            </Title>
            <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Đăng Ký Tài Khoản</Title>

                <Form name="register_form" onFinish={onFinish} layout="vertical">
                    <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}>
                        <Input prefix={<IdcardOutlined />} placeholder="Họ và tên giảng viên" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="Email"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
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
                        rules={[{ required: true, message: 'Vui lòng chọn avatar!' }]}
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

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            Đăng Ký
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div >
    );
};

export default Register;




