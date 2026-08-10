import React, {useEffect, useState} from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Tag,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  BuildOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {authApis, endpoints, springApi} from "../../config/Apis";
import {useNavigate} from "react-router-dom";

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const nav = useNavigate();

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(
        `${endpoints["templates"]}?page=${page}`,
      );
      if (res.status === 200) {
        if (page === 1) setTemplates(res.data.results);
        else setTemplates([...templates, ...res.data.results]);
        setHasNext(res.data.next !== null);
      }
    } catch (err) {
      message.error("Lỗi tải danh sách Template");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, [page]);

  const handleSave = async (values) => {
    try {
      if (values.id) {
        await authApis().patch(
          `${endpoints["templates"]}${values.id}/`,
          values,
        );
        message.success("Cập nhật thành công!");
      } else {
        const sourceId = values.source_template_id;
        await authApis().post(`${endpoints["templates"]}${sourceId}/clone/`, {
          new_name: values.name,
          new_version: values.version,
        });
        message.success("Tạo Template mới thành công từ Mẫu chuẩn!");
      }
      setIsModalVisible(false);
      setPage(1);
    } catch (err) {
      console.log(err);
      message.error("Có lỗi xảy ra, có thể do trùng Tên & Version!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(`${endpoints["templates"]}${id}/`);
      message.success("Xóa thành công!");
      setTemplates((prev) => prev.filter((item) => item.id !== id));
      if (templates.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  // Gọi API Clone Template
  const handleClone = async (id) => {
    try {
      await authApis().post(`${endpoints["templates"]}${id}/clone/`);
      message.success("Đã nhân bản Template thành công!");
      setPage(1);
      if (page === 1) loadTemplates();
    } catch (err) {
      message.error("Lỗi khi nhân bản!");
    }
  };

  // Gọi API Publish Template
  const handlePublish = async (id) => {
    try {
      const res = await springApi().post(endpoints["publish-template"](id));
      if (res.status === 200) message.success("Đã ban hành Template!");
      setPage(1);
    } catch (err) {
      console.log(err);
      message.error("Lỗi khi ban hành!");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", key: "id", width: 60},
    {title: "Tên Template", dataIndex: "name", key: "name"},
    {
      title: "Phiên bản",
      dataIndex: "version",
      key: "version",
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        let color =
          status === "Published"
            ? "green"
            : status === "Draft"
              ? "orange"
              : "default";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Sử dụng chính",
      dataIndex: "is_active",
      key: "is_active",
      width: 150,
      render: (isActive) =>
        isActive ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Active
          </Tag>
        ) : (
          <Tag color="warning" icon={<CloseCircleOutlined />}>
            InActive
          </Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            className="text-purple-600"
            icon={<BuildOutlined />}
            title="Xây dựng Form"
            onClick={() => nav(`/specialist/templates/${record.id}/builder`)}
          />
          <Button
            type="text"
            className="text-blue-500"
            icon={<EditOutlined />}
            title="Sửa thông tin"
            onClick={() => {
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            title="Nhân bản"
            onClick={() => handleClone(record.id)}
          />
          {record.is_active === false && (
            <Button
              type="text"
              className="text-green-600"
              icon={<CheckCircleOutlined />}
              title="Ban hành"
              onClick={() => handlePublish(record.id)}
            />
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            title="Xóa"
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-lg" />}
            onClick={() => nav("/specialist")}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <h2 className="text-xl font-bold text-gray-700 m-0">
            Quản lý Form Mẫu (Template)
          </h2>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({version: "v1.0"});
            setIsModalVisible(true);
          }}
        >
          Thêm Template
        </Button>
      </div>

      <Table
        dataSource={templates}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      {hasNext === true && (
        <div className="mt-4 flex justify-center">
          <Button
            type="default"
            loading={loading}
            onClick={() => setPage(page + 1)}
          >
            Tải thêm
          </Button>
        </div>
      )}

      {/* Modal Sửa/Thêm Thông Tin Cơ Bản */}
      <Modal
        title={form.getFieldValue("id") ? "Sửa Template" : "Thêm Template mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={500}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          {!form.getFieldValue("id") && (
            <Form.Item
              name="source_template_id"
              label="Nguồn tạo (Base Template)"
              rules={[
                {required: true, message: "Vui lòng chọn mẫu để nhân bản!"},
              ]}
            >
              <Select placeholder="-- Chọn Mẫu Chuẩn --">
                {templates.map((tpl) => (
                  <Select.Option key={tpl.id} value={tpl.id}>
                    {tpl.id === 1 ? `⭐ [Hệ thống] ${tpl.name}` : tpl.name} -{" "}
                    {tpl.version}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Tên Template"
            rules={[{required: true, message: "Vui lòng nhập tên Template"}]}
          >
            <Input placeholder="VD: Mẫu Đề cương Khoa CNTT..." />
          </Form.Item>

          <Form.Item
            name="version"
            label="Phiên bản (Version)"
            rules={[{required: true, message: "Vui lòng nhập version"}]}
          >
            <Input placeholder="VD: v1.0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateManagement;
