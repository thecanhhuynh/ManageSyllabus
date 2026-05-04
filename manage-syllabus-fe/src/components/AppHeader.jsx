import React, { useContext, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, Form, message, Modal, Input, Upload } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UploadOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../utils/context/AuthContext';
import axiosClient, { endpoints } from '../utils/Apis';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout, updateUser } = useContext(AuthContext);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [form] = Form.useForm();

  const getMenuItems = () => {
    const items = [
      { key: '/', icon: <HomeOutlined />, label: 'Trang chủ' }
    ];
    if (user && user.user_role === 'ADMIN') {
      items.push({ key: '/admin/users', icon: <UserOutlined />, label: 'Quản lý Người dùng' });
      items.push({ key: '/admin/subjects', icon: <BookOutlined />, label: 'Quản lý Môn học' });
    }

    if (user && user.user_role === 'SPECIALIST') {
      items.push({ key: '/specialist', icon: <DashboardOutlined />, label: 'Khu vực Chuyên viên' });
      items.push({ key: '/specialist/editor', icon: <FileTextOutlined />, label: 'Soạn thảo Mẫu' });
    }

    if (user && user.user_role === 'USER') {
      items.push({ key: '/my-syllabuses', icon: <FileTextOutlined />, label: 'Đề cương của tôi' });
    }

    return items;
  };

  const handleUpdateProfile = async (values) => {
    setLoadingProfile(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('email', values.email);
    formData.append('room', values.room);
    if (values.avatar && values.avatar.length > 0) {
      formData.append('avatar', values.avatar[0].originFileObj);
    }
    try {
      const url = `${endpoints["profile"]}`;
      const res = await axiosClient.put(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      if (res.data.status == 200) {
        message.success(res.data.msg);
        setIsProfileVisible(false);
        updateUser({ avatar: res.data.avatar_url });
      } else {
        message.error(res.data.err_msg || 'Cập nhật thông tin thất bại!');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
      message.error('Có lỗi xảy ra khi cập nhật thông tin cá nhân!');
    } finally {
      setLoadingProfile(false);
    }
  }

  const userDropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: async () => {
        setIsProfileVisible(true);
        setFetchingProfile(true);
        try {
          const url = `${endpoints["profile"]}`;
          const res = await axiosClient.get(url);
          if (res.data.status === 200) {
            const userData = res.data.data;
            let avatarFormat = [];

            if (userData.avatar && typeof userData.avatar === 'string') {
              avatarFormat = [
                {
                  uid: '-1',
                  name: 'avatar.png',
                  status: 'done',
                  url: userData.avatar,
                }
              ];
            }
            userData.avatar = avatarFormat;

            form.setFieldsValue(userData);
          }
          else {
            message.error(res.data.err_msg || 'Không thể tải thông tin cá nhân!');
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin cá nhân:', error);
          message.error('Có lỗi xảy ra khi tải thông tin cá nhân!');
        } finally {
          setFetchingProfile(false);
        }
      }
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: 'red' }} />,
      label: <Text type="danger">Đăng xuất</Text>,
      onClick: () => {
        logout();
        console.log('Đã đăng xuất');
        navigate('/login');
      }
    },
  ];

  return (
    <Header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#fff', // Màu nền trắng
      boxShadow: '0 2px 8px #f0f1f2',
      padding: '0 20px',
      position: 'sticky', // Cố định Header trên cùng
      top: 0,
      zIndex: 1000,
      width: '100%'
    }}>
      {/* KHU VỰC LOGO TÊN HỆ THỐNG */}
      <div
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: 40 }}
        onClick={() => navigate('/')}
      >
        {/* Nếu có file logo thì dùng thẻ img, ở đây dùng chữ */}
        <div style={{
          background: '#1890ff', color: '#fff', fontWeight: 'bold',
          padding: '4px 12px', borderRadius: 4, marginRight: 10, fontSize: 16
        }}>
          Syllabus
        </div>
        <Text strong style={{ fontSize: 16, display: { xs: 'none', sm: 'block' } }}>
          Hệ Thống Quản Lý Đề Cương
        </Text>
      </div>

      {/* KHU VỰC MENU ĐIỀU HƯỚNG BÊN TRÁI */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]} // Tự động highlight menu đang đứng
        items={getMenuItems()}
        onClick={(e) => navigate(e.key)} // Chuyển trang khi click
        style={{ flex: 1, borderBottom: 'none', fontWeight: 500 }}
      />

      {/* KHU VỰC NÚT ĐĂNG NHẬP HOẶC AVATAR BÊN PHẢI */}
      <div>
        {user ? (
          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={user.avatar} icon={!user.avatar && <UserOutlined />} />
              <Text strong>{user.name}</Text>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="text" onClick={() => navigate('/register')}>Đăng ký</Button>
            <Button type="primary" onClick={() => navigate('/login')}>Đăng nhập</Button>
          </Space>
        )}
      </div>
      <Modal
        title="Cập nhật Thông tin cá nhân"
        open={isProfileVisible}
        onCancel={() => setIsProfileVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loadingProfile}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        {/* Nếu đang fetch API thì hiển thị chữ Đang tải, fetch xong mới hiện Form */}
        {fetchingProfile ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>Đang tải thông tin...</div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleUpdateProfile} style={{ marginTop: 20 }}>

            {/* THÔNG TIN TỪ BẢNG USER */}
            <Form.Item
              label="Họ và tên"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input placeholder="Nhập họ tên mới" size="large" />
            </Form.Item>

            {/* THÔNG TIN TỪ BẢNG LECTURER */}
            <Form.Item
              label="Email liên hệ (Dành cho giảng viên)"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input placeholder="Nhập email" size="large" />
            </Form.Item>
            <Form.Item
              label="Phòng làm việc (Dành cho giảng viên)"
              name="room"
              rules={[
                { required: true, message: 'Vui lòng nhập phòng làm việc!' },
              ]}
            >
              <Input placeholder="Nhập phòng làm việc" size="large" />
            </Form.Item>

            <Form.Item
              label="Ảnh đại diện (Avatar)"
              name="avatar"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (!e) return [];
                if (Array.isArray(e)) return e;
                if (e.fileList) return e.fileList;
                return [];
              }}
            >
              <Upload beforeUpload={() => false} listType="picture" maxCount={1} accept="image/*">
                <Button icon={<UploadOutlined />}>Đổi Avatar</Button>
              </Upload>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Header>

  );
};

export default AppHeader;