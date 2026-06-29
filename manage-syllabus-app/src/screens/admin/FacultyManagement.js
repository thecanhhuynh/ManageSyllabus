import React, {useEffect, useState} from "react";
import {Table, Button, Modal, Form, Input, message, Space} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useNavigate} from "react-router-dom";

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();
  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["faculties"]);
      setFaculties(res.data.results || res.data);
    } catch (err) {
      message.error("Lỗi tải danh sách Khoa");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleSave = async (values) => {
    try {
      if (values.id) {
        await authApis().patch(endpoints["update-faculty"](values.id), values);
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["faculties"], values);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      fetchFaculties();
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(endpoints["update-faculty"](id));
      message.success("Xóa thành công!");
      fetchFaculties();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", key: "id", width: 80},
    {title: "Tên Khoa", dataIndex: "name", key: "name"},
    {
      title: "Hành động",
      key: "action",
      width: 150,
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
            disabled
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-lg" />}
            onClick={() => nav("/admin")}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <h2 className="text-xl font-bold text-gray-700 m-0">Quản lý Khoa</h2>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setIsModalVisible(true);
          }}
          className="h-9 px-4 rounded-lg"
        >
          Thêm Khoa
        </Button>
      </div>

      <Table
        dataSource={faculties}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={form.getFieldValue("id") ? "Sửa Khoa" : "Thêm Khoa"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên Khoa"
            rules={[{required: true, message: "Vui lòng nhập tên khoa"}]}
          >
            <Input placeholder="Nhập tên khoa..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacultyManagement;
