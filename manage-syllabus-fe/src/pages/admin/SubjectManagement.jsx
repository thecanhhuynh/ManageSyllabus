import { Button, Card, Col, Form, Input, InputNumber, message, Modal, Row, Space, Table, Typography } from "antd";
import axiosClient, { endpoints } from "../../utils/Apis";
import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";


const { Title, Text } = Typography;
const SubjectManagement = () => {

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: import.meta.env.VITE_PAGE_SIZE,
        total: 0,
    });

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [form] = Form.useForm();


    const loadSubjects = async (page = 1) => {
        try {
            setLoading(true);
            let url = `${endpoints["subjects"]}?page=${page}`;
            if (q) url = `${url}&q=${q}`;
            const res = await axiosClient.get(url);
            if (res.data.status === 200) {
                setSubjects(res.data.data);
                setPagination({
                    ...pagination,
                    current: page,
                    total: res.data.total
                });
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách môn học!', error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleModalSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();
            if (!editingSubject) formData.append('id', values.id);
            if (values.name) formData.append('name', values.name);
            if (values.credit) {
                formData.append('number_theory', values.credit.number_theory || 0);
                formData.append('number_practice', values.credit.number_practice || 0);
                formData.append('hour_self_study', values.credit.hour_self_study || 0);
            }
            let res;
            if (editingSubject) {
                res = await axiosClient.patch(endpoints["subject_details"](editingSubject.id), formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            else {
                res = await axiosClient.post(endpoints["subjects"], formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            if (res.data.status === 200 || res.data.status === 201) {
                message.success(res.data.msg);
                setIsModalVisible(false);
                loadSubjects(pagination.current);
            }
            else {
                message.error(res.data.err_msg);
            }
        } catch (error) {
            message.error('Lỗi khi lưu thông tin môn học!', error.message);
            console.error('Save subject error:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const handAddClick = () => {
        setEditingSubject(null);
        form.resetFields();
        setIsModalVisible(true);
    }

    const handleEditClick = (values) => {
        setEditingSubject(values);
        form.setFieldsValue({
            id: values.id,
            name: values.name,
            credit: {
                number_theory: values.credit?.number_theory || 0,
                number_practice: values.credit?.number_practice || 0,
                hour_self_study: values.credit?.hour_self_study || 0,
            }
        })
        setIsModalVisible(true);
    }

    useEffect(() => {
        let timer = setTimeout(() => {
            loadSubjects(1);
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            align: 'center',
        },
        {
            title: 'Tên môn học',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Tín chỉ (LT - TH)',
            key: 'credit',
            width: 150,
            align: 'center',
            render: (record) => {
                if (!record.credit) return <Text type="secondary">Chưa cập nhật</Text>;

                const theory = record.credit.number_theory;
                const practice = record.credit.number_practice;

                const totalCredit = theory + practice;

                return (
                    <div style={{ textAlign: 'center' }}>
                        <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                            {totalCredit}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            ({theory} LT - {practice} TH)
                        </Text>
                    </div>
                );
            }
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
                    <Button type="text" danger icon={<DeleteOutlined />}>
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];
    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý Môn học</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handAddClick}>
                    Thêm Môn học
                </Button>
            </div>
            <Card variant={false} style={{ marginBottom: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col style={{ width: '100%' }}>
                        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#595959' }}>Tìm kiếm Môn học</div>
                        <Input size="large"
                            placeholder="Tìm theo tên"
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
                    dataSource={subjects}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showTotal: (total) => `Tổng ${total} môn học`,
                        placement: ['bottomCenter']
                    }}
                    onChange={(newPagination) => loadSubjects(newPagination.current)}
                />
            </Card>
            <Modal
                title={editingSubject ? "Chỉnh sửa Môn học" : "Thêm Môn học mới"}
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
                        name="id"
                        label="Mã môn học"
                        rules={[{ required: !editingSubject, message: 'Vui lòng nhập mã môn học!' }]}
                        required
                    >
                        <Input placeholder="Ví dụ: ITEC1234" readOnly={!!editingSubject} />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Tên môn học"
                        rules={[{ required: !editingSubject, message: 'Vui lòng nhập tên môn học!' }]}
                        required
                    >
                        <Input placeholder="Ví dụ: Toán Học" />
                    </Form.Item>

                    <Form.Item label="Tín chỉ (Lý thuyết (tín chi) - Thực hành (tín chi) - Tự học (Giờ))" style={{ marginBottom: 0 }} required>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    name={['credit', 'number_theory']}
                                    rules={[{ required: !editingSubject, message: 'Nhập tín chỉ Lý thuyết!' }]}
                                >
                                    <InputNumber
                                        placeholder="Lý thuyết"
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name={['credit', 'number_practice']}
                                    rules={[{ required: !editingSubject, message: 'Nhập tín chỉ Thực hành!' }]}
                                >
                                    <InputNumber
                                        placeholder="Thực hành"
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name={['credit', 'hour_self_study']}
                                    rules={[{ required: !editingSubject, message: 'Nhập giờ tự học!' }]}
                                >
                                    <InputNumber
                                        placeholder="Giờ tự học"
                                        style={{ width: '100%' }}
                                        min={1}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SubjectManagement;