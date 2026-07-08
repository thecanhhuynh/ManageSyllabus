import React, {useEffect, useState} from "react";
import {Table, Button, Modal, Form, Input, message, Space, Select} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useNavigate} from "react-router-dom";

const MajorManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadFaculties = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["faculties"]);
      setFaculties(res.data.results);
    } catch (err) {
      message.error("Lỗi tải danh sách Khoa");
    }
    setLoading(false);
  };

  const loadMajors = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["majors"]);
      setMajors(res.data.results);
    } catch (err) {
      message.error("Lỗi tải danh sách chuyên ngành");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMajors();
    loadFaculties();
  }, []);

  const handleSave = async (values) => {
    try {
      const faculty = faculties.find((f) => f.id === values.faculty);

      const payload = {
        id: values.id,
        name: values.name,
        code: values.code,
        faculty: {
          id: faculty.id,
          name: faculty.name,
        },
      };
      console.log(payload);
      if (values.id) {
        await authApis().patch(endpoints["update-major"](values.id), payload);
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["majors"], payload);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      loadMajors();
    } catch (err) {
      console.log(err);
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(endpoints["update-major"](id));
      message.success("Xóa thành công!");
      loadMajors();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", key: "id", width: 80},
    {title: "Tên môn học", dataIndex: "name", key: "name"},
    {title: "Mã chuyên ngành", dataIndex: "code", key: "code"},
    {
      title: "Khoa",
      dataIndex: "faculty",
      key: "faculty",
      render: (faculty) => (faculty ? faculty.name : "N/A"),
    },
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
              form.setFieldsValue({
                ...record,
                faculty: record.faculty?.id,
              });
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
            Quản lý Chuyên ngành
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
          Thêm chuyên ngành
        </Button>
      </div>

      <Table
        dataSource={majors}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={
          form.getFieldValue("id") ? "Sửa chuyên ngành" : "Thêm chuyên ngành"
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="id" hidden></Form.Item>
          <Form.Item
            name="code"
            label="Mã chuyên ngành"
            rules={[{required: true, message: "Vui lòng nhập mã chuyên ngành"}]}
          >
            <Input placeholder="Nhập mã chuyên ngành" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên chuyên ngành"
            rules={[
              {required: true, message: "Vui lòng nhập tên chuyên ngành"},
            ]}
          >
            <Input placeholder="Nhập tên chuyên ngành..." />
          </Form.Item>
          <Form.Item
            name="faculty"
            label="Khoa"
            rules={[{required: true, message: "Vui lòng chọn khoa"}]}
          >
            <Select placeholder="Chọn khoa">
              {faculties.map((faculty) => (
                <Select.Option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MajorManagement;
