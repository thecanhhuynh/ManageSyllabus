import {Button, Form, Input, message, Modal, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const ProgrammeLearningOutcomeManagement = () => {
  const [plos, setPlos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadPLOs = async () => {
    try {
      setLoading(true);
      const res = await authApis().get(
        `${endpoints["programme-learning-outcomes"]}?page=${page}`,
      );
      if (res.status === 200) {
        if (page === 1) setPlos(res.data.results);
        else setPlos([...plos, ...res.data.results]);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPLOs();
  }, [page]);

  const handleSave = async (values) => {
    try {
      if (values.id) {
        await authApis().patch(
          `${endpoints["programme-learning-outcomes"]}${values.id}/`,
          values,
        );
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["programme-learning-outcomes"], values);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      loadPLOs();
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(
        `${endpoints["programme-learning-outcomes"]}${id}/`,
      );
      message.success("Xóa thành công!");
      loadPLOs();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {
      title: "ID",
      key: "index",
      width: 80,
      render: (text, record, index) => index + 1,
    },
    {title: "Tên PLO", dataIndex: "name", key: "name", width: 150},
    {title: "Mô tả", dataIndex: "description", key: "description"},
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            className="text-blue-500"
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-lg" />}
            onClick={() => nav("/admin")}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <h2 className="text-xl font-bold text-gray-700 m-0">
            Quản lý Chuẩn đầu ra (PLO)
          </h2>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Thêm PLO
        </Button>
      </div>

      <Table
        dataSource={plos}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <div className="mt-4 flex justify-center">
        <Button
          type="primary"
          loading={loading}
          onClick={() => setPage(page + 1)}
        >
          Tải thêm
        </Button>
      </div>

      <Modal
        title={form.getFieldValue("id") ? "Sửa PLO" : "Thêm PLO"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="id" hidden></Form.Item>
          <Form.Item
            name="name"
            label="Tên PLO"
            rules={[{required: true, message: "Vui lòng nhập tên PLO"}]}
          >
            <Input placeholder="VD: PLO1" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{required: true, message: "Vui lòng nhập mô tả"}]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả chi tiết..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProgrammeLearningOutcomeManagement;
