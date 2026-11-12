import React, {useEffect, useState} from "react";
import {Table, Button, Modal, Form, Input, message, Space} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useNavigate} from "react-router-dom";
import CleanInput from "../../components/CleanInput";
import {cleanFormData} from "../../utils/stringUtils";

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadFaculties = async (currentPage = 1, query = "") => {
    setLoading(true);
    try {
      let url = `${endpoints["faculties"]}?page=${currentPage}`;
      if (query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }
      const res = await authApis().get(url);
      setFaculties(res.data.results || res.data || []);
      setTotal(res.data.count || (res.data.results ? res.data.results.length : 0));
      setPage(currentPage);
    } catch (err) {
      message.error("Lỗi tải danh sách Khoa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFaculties(1, searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSave = async (rawValues) => {
    const values = cleanFormData(rawValues);
    try {
      if (values.id) {
        await authApis().patch(endpoints["update-faculty"](values.id), values);
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["faculties"], values);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      loadFaculties(page, searchText);
    } catch (err) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(endpoints["update-faculty"](id));
      message.success("Xóa thành công!");
      loadFaculties();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", key: "id", width: 80},
    {title: "Tên Khoa", dataIndex: "name", key: "name", width: 280},
    {
      title: "Hành động",
      key: "action",
      width: 150,
      fixed: "right",
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

      <div className="mb-4 max-w-md">
        <CleanInput
          placeholder="Tìm kiếm khoa theo tên..."
          prefix={<SearchOutlined className="text-gray-400" />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        dataSource={faculties}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{x: 550}}
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          showTotal: (t) => `Tổng cộng ${t} khoa`,
          showSizeChanger: false,
          onChange: (p) => loadFaculties(p, searchText),
        }}
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
            <CleanInput placeholder="Nhập tên khoa..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FacultyManagement;
