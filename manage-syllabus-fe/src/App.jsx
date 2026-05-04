import { Button, Layout, Result } from 'antd';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserManagement from './pages/admin/UserManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import Home from './pages/Home';
import AppHeader from './components/AppHeader';
import { Content, Footer } from 'antd/es/layout/layout';
import { AuthProvider } from './utils/reducers/AuthProvider';
import axios from 'axios';

axios.defaults.withCredentials = true;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      {/* Outlet là nơi React Router "bơm" nội dung của từng trang vào */}
      <Content style={{ background: '#f5f7fa' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        Quản lý Đề cương Môn học ©2026 Created by Canh
      </Footer>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            {/* Thêm các route khác vào đây */}
            <Route path="/admin" element={<Home />} />
            <Route path="/admin/subjects" element={<SubjectManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            {/* <Route path="/specialist" element={<SpecialistDashboard />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;