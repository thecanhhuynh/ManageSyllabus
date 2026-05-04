
import React, { useContext, useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../utils/context/AuthContext';

const { Title } = Typography;
const Login = () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, values);

            if (response.data.status === 200) {
                message.success('Đăng nhập thành công!');
                localStorage.setItem('access_token', response.data.token);
                // console.info('Access token received:', response.data.token);
                const userData = {
                    name: response.data.name,
                    email: response.data.email,
                    user_role: response.data.role,
                    avatar: response.data.avatar
                };
                console.log('User data received on login:', userData);
                login(userData);
                if (response.data.role === 'SPECIALIST') navigate('/specialist');
                else if (response.data.role === 'ADMIN') navigate('/admin');
                else navigate('/');
            } else {
                message.error(response.data.err_msg || 'Đăng nhập thất bại!');
            }
        } catch (error) {
            message.error('Lỗi kết nối đến Server!', error.message);
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5', flexDirection: 'column' }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: 40, textTransform: 'uppercase', textAlign: 'center' }}>
                Hệ Thống Quản Lý Đề Cương Môn Học
            </Title>
            <Card style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Đăng Nhập</Title>

                <Form name="login_form" onFinish={onFinish} layout="vertical">
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            Đăng Nhập
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                    </div>
                </Form>
            </Card>
        </div>
    )
}

export default Login;