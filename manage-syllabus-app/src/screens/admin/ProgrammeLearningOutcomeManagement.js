import {Button, Form, message, Modal, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import CleanInput from "../../components/CleanInput";
import {cleanFormData} from "../../utils/stringUtils";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const ProgrammeLearningOutcomeManagement = () => {
  const [plos, setPlos] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadPLOs = async (currentPage = 1, query = "") => {
    try {
      setLoading(true);
      let url = `${endpoints["programme-learning-outcomes"]}?page=${currentPage}`;
      if (query.trim()) {
        url += `&q=${encodeURIComponent(query.trim())}`;
      }
      const res = await authApis().get(url);
      if (res.status === 200) {
        setPlos(res.data.results || res.data || []);
        setTotal(res.data.count || (res.data.results ? res.data.results.length : 0));
        setPage(currentPage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPLOs(1, searchText);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSave = async (rawValues) => {
    const values = cleanFormData(rawValues);
    const cleanName = (values.name || "").trim().toLowerCase();
    const isDuplicate = plos.some(
      (item) => item.id !== values.id && (item.name || "").trim().toLowerCase() === cleanName
    );
    if (isDuplicate) {
      return message.error(`Chuẩn đầu ra "${values.name}" đã tồn tại trong danh sách!`);
    }

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
      width: 70,
      render: (text, record, index) => index + 1,
    },
    {title: "Tên PLO", dataIndex: "name", key: "name", width: 160},
    {title: "Mô tả", dataIndex: "description", key: "description", width: 380},
    {
      title: "Hành động",
      key: "action",
      width: 120,
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

      <div className="mb-4 max-w-md">
        <CleanInput
          placeholder="Tìm kiếm chuẩn đầu ra (PLO)..."
          prefix={<SearchOutlined className="text-gray-400" />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        dataSource={plos}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{x: 730}}
        pagination={{
          current: page,
          pageSize: 10,
          total: total,
          showTotal: (t) => `Tổng cộng ${t} chuẩn đầu ra`,
          showSizeChanger: false,
          onChange: (p) => loadPLOs(p, searchText),
        }}
      />

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
            rules={[
              {required: true, message: "Vui lòng nhập tên PLO"},
              {
                pattern: /^[A-Za-z0-9._-]+$/,
                message: "Tên PLO chỉ gồm chữ, số, dấu chấm, gạch nối hoặc gạch dưới (VD: PLO1, PLO1.1)",
              },
            ]}
          >
            <CleanInput placeholder="VD: PLO1 hoặc PLO1.1" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{required: true, message: "Vui lòng nhập mô tả"}]}
          >
            <CleanInput.TextArea rows={4} placeholder="Nhập mô tả chi tiết..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProgrammeLearningOutcomeManagement;
