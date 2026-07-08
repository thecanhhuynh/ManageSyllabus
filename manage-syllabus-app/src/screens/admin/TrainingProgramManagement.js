import React, {useEffect, useState} from "react";
import {Table, Button, Modal, Form, Input, message, Space, Select} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  InfoOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useNavigate} from "react-router-dom";

const TrainingProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const [majors, setMajors] = useState([]);

  const loadMajors = async () => {
    try {
      const res = await authApis().get(endpoints["majors"]);
      setMajors(res.data.results);
    } catch (err) {
      message.error("Lỗi tải danh sách Chuyên ngành");
    }
  };

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["training-programs"]);
      setPrograms(res.data.results);
    } catch (err) {
      message.error("Lỗi tải danh sách CTDT");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPrograms();
    loadMajors();
  }, []);

  const handleSave = async (values) => {
    try {
      const selectedMajor = majors.find((m) => m.id === values.major);

      const payload = {
        name: values.name,
        academic_year: values.academic_year,
        major: selectedMajor,
        inherit_from_id: values.inherit_from_id || null,
      };
      console.log(payload);
      if (values.id) {
        await authApis().patch(
          endpoints["update-training-program"](values.id),
          payload,
        );
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["training-programs"], payload);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      loadPrograms();
    } catch (err) {
      console.log(err);
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(endpoints["update-training-program"](id));
      message.success("Xóa thành công!");
      loadPrograms();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", key: "id", width: 80},
    {title: "Tên chương trình", dataIndex: "name", key: "name"},
    {title: "Năm học", dataIndex: "academic_year", key: "academic_year"},
    {
      title: "Chuyên ngành",
      dataIndex: "major",
      key: "major",
      render: (major) => (major ? major.name : "N/A"),
    },
    {
      title: "Khoa",
      key: "faculty",
      render: (_, record) =>
        record.major?.faculty?.name ? record.major.faculty.name : "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            onClick={() =>
              nav(`/admin/training-programs/${record.id}/syllabuses`)
            }
            type="text"
            className="text-blue-500"
            icon={<InfoOutlined />}
          />
          <Button
            type="text"
            className="text-blue-500"
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                ...record,
                major: record.major?.id,
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
            Quản lý Chương trình đào tạo
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
          Thêm CTĐT
        </Button>
      </div>

      <Table
        dataSource={programs}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={
          form.getFieldValue("id")
            ? "Sửa chương trình đào tạo"
            : "Thêm chương trình đào tạo"
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="id" hidden></Form.Item>

          <Form.Item
            name="name"
            label="Tên chương trình đào tạo"
            rules={[{required: true, message: "Vui lòng nhập tên CTĐT"}]}
          >
            <Input placeholder="VD: CTĐT-KHMT 2024..." />
          </Form.Item>

          <Form.Item
            name="academic_year"
            label="Năm học"
            rules={[{required: true, message: "Vui lòng nhập năm học"}]}
          >
            <Input type="number" placeholder="VD: 2024" />
          </Form.Item>

          <Form.Item
            name="major"
            label="Chuyên ngành"
            rules={[{required: true, message: "Vui lòng chọn chuyên ngành"}]}
          >
            <Select placeholder="Chọn chuyên ngành">
              {majors.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {!form.getFieldValue("id") && (
            <Form.Item
              name="inherit_from_id"
              label="Kế thừa đề cương từ CTĐT cũ (Tùy chọn)"
              tooltip="Nếu chọn, tất cả đề cương của CTĐT này sẽ được copy sang CTĐT mới"
            >
              <Select
                placeholder="Chọn CTĐT muốn kế thừa"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {programs
                  .filter((p) => p.id !== form.getFieldValue("id"))
                  .map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name} - {p.academic_year}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingProgramManagement;
