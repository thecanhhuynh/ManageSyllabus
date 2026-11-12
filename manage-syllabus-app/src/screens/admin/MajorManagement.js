import React, {useEffect, useState} from "react";
import {Table, Button, Modal, Form, message, Space, Select} from "antd";
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

const MajorManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [facultyFilter, setFacultyFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadFaculties = async () => {
    try {
      const res = await authApis().get(endpoints["faculties"]);
      setFaculties(res.data.results || res.data || []);
    } catch (err) {
      message.error("Lỗi tải danh sách Khoa");
    }
  };

  const loadMajors = async (currentPage = 1, query = "", faculty = null) => {
    setLoading(true);
    try {
      let url = `${endpoints["majors"]}?page=${currentPage}`;
      if (query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }
      if (faculty) {
        url += `&faculty=${faculty}`;
      }
      const res = await authApis().get(url);
      setMajors(res.data.results || res.data || []);
      setTotal(res.data.count || (res.data.results ? res.data.results.length : 0));
      setPage(currentPage);
    } catch (err) {
      message.error("Lỗi tải danh sách chuyên ngành");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMajors(1, searchText, facultyFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, facultyFilter]);

  const handleSave = async (rawValues) => {
    const values = cleanFormData(rawValues);
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
    {title: "ID", dataIndex: "id", key: "id", width: 70},
    {title: "Tên chuyên ngành", dataIndex: "name", key: "name", width: 220},
    {title: "Mã chuyên ngành", dataIndex: "code", key: "code", width: 140},
    {
      title: "Khoa",
      dataIndex: "faculty",
      key: "faculty",
      width: 180,
      render: (faculty) => (faculty ? faculty.name : "N/A"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 130,
      fixed: "right",
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

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="max-w-md flex-1">
          <CleanInput
            placeholder="Tìm kiếm chuyên ngành theo tên..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Select
          placeholder="Lọc theo Khoa"
          allowClear
          style={{width: 220}}
          value={facultyFilter}
          onChange={(val) => setFacultyFilter(val)}
        >
          {faculties.map((f) => (
            <Select.Option key={f.id} value={f.id}>
              {f.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Table
        dataSource={majors}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{x: 740}}
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          showTotal: (t) => `Tổng cộng ${t} chuyên ngành`,
          showSizeChanger: false,
          onChange: (p) => loadMajors(p, searchText, facultyFilter),
        }}
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
            rules={[
              {required: true, message: "Vui lòng nhập mã chuyên ngành"},
              {
                pattern: /^[A-Z0-9_-]{2,20}$/,
                message: "Mã chuyên ngành chỉ gồm chữ in hoa, số, gạch nối hoặc gạch dưới (2-20 ký tự)",
              },
            ]}
          >
            <CleanInput placeholder="VD: CNTT, KHMT, HTTT" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên chuyên ngành"
            rules={[
              {required: true, message: "Vui lòng nhập tên chuyên ngành"},
            ]}
          >
            <CleanInput placeholder="Nhập tên chuyên ngành..." />
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
