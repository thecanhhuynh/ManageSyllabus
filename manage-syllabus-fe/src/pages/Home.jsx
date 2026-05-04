import React, { useState, useEffect, useContext } from 'react';
import { Card, Input, Select, Button, Table, Tag, Typography, Space, Row, Col, message } from 'antd';
import { SearchOutlined, BookOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../utils/context/AuthContext';
import axiosClient, { endpoints } from '../utils/Apis';

const { Title, Text } = Typography;

const Home = () => {
    const navigate = useNavigate();
    const [syllabuses, setSyllabuses] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [q, setQ] = useState('');
    const [facultyId, setFacultyId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState();
    const { user } = useContext(AuthContext);
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (text, record, index) => <Text type="secondary" strong>{index + 1}</Text>,
        },
        {
            title: 'Tên Đề cương',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Mã MH: {record.subject_id}</Text>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status) => (
                <Tag color="success" style={{ borderRadius: 12, padding: '2px 10px' }}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Cập nhật lần cuối',
            dataIndex: 'created_date',
            key: 'created_date',
            width: 200,
            render: (date) => <Text type="secondary">{date}</Text>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <Button color="primary" variant="outlined"
                    onClick={() => navigate(`/syllabus/${record.id}`)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    const loadSyllabuses = async (page = 1) => {
        try {
            setLoading(true);
            let url = `${endpoints["syllabuses"]}?page=${page}`;
            if (q) url = `${url}&q=${q}`;
            if (facultyId) url = `${url}&faculty_id=${facultyId}`;

            const res = await axiosClient.get(url);
            if (res.data.status === 200) {
                setSyllabuses(res.data.data);
                setPagination({
                    ...pagination,
                    current: page,
                    total: res.data.total
                });
            } else {
                message.error(res.data.err_msg);
            }

        } catch (error) {
            console.error('Lỗi khi tải đề cương:', error);
        } finally {
            setLoading(false);
        }
    }

    const loadFaculties = async () => {
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}/faculties`;
            const res = await axios.get(url);
            if (res.data.status === 200) {
                setFaculties(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách khoa:', error);
        }
    }

    useEffect(() => {
        let timer = setTimeout(() => {
            if (user) loadSyllabuses(1);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, q, facultyId]);

    useEffect(() => {
        loadFaculties();
    }, [user]);

    const handleTableChange = (newPagination) => {
        loadSyllabuses(newPagination.current);
    };

    return (
        <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header tạm thời (Cho biết chưa đăng nhập) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0 }}>
                        <BookOutlined style={{ marginRight: 10, color: '#1890ff' }} />
                        Tra cứu Đề cương
                    </Title>
                    {!user && (
                        <Space>
                            <Text>Bạn chưa đăng nhập?</Text>
                            <Button type="primary" onClick={() => navigate('/login')}>Đăng nhập ngay</Button>
                        </Space>
                    )}
                </div>

                {/* BỘ LỌC TÌM KIẾM (Thay cho Form search cũ) */}
                <Card variant={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Row gutter={[16, 16]} align="bottom">
                        <Col xs={24} md={12} lg={14}>
                            <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#595959' }}>Tìm kiếm Đề cương</div>
                            <Input
                                size="large"
                                placeholder="Nhập tên đề cương..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </Col>
                        <Col xs={24} md={8} lg={6}>
                            <Select
                                size="large"
                                style={{ width: '100%' }}
                                placeholder="Lọc theo Khoa"
                                allowClear
                                options={faculties.map(faculty => ({ key: faculty.id, label: faculty.name, value: faculty.id }))}
                                onChange={setFacultyId}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* BẢNG DỮ LIỆU */}
                <Card variant={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} styles={{ padding: 0 }}>
                    <Table
                        columns={columns}
                        dataSource={user ? syllabuses : []}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            placement: ['bottomCenter'],
                            showTotal: (total) => `Tổng cộng ${total} đề cương`
                        }}
                        onChange={handleTableChange}
                        locale={{
                            emptyText: !user ? (
                                <div style={{ padding: '40px 0' }}>
                                    <Text type="secondary" style={{ fontSize: 16 }}>Vui lòng đăng nhập để xem danh sách đề cương</Text>
                                    <br />
                                    <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
                                        Đi đến trang Đăng nhập
                                    </Button>
                                </div>
                            ) : "Chưa có đề cương nào."
                        }}
                    />
                </Card>

            </div>
        </div>
    );
};

export default Home;