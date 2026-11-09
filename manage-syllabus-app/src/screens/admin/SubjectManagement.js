import React, {useEffect, useState} from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useNavigate} from "react-router-dom";

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["subjects"]);
      setSubjects(res.data.results || res.data);
    } catch (err) {
      message.error("Lỗi tải danh sách Khoa");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreditChange = (changedValues, allValues) => {
    if (!changedValues.credit) return;
    if (
      changedValues.credit.number_theory === undefined &&
      changedValues.credit.number_practice === undefined
    ) {
      return;
    }
    const theory = Number(allValues?.credit?.number_theory || 0);
    const practice = Number(allValues?.credit?.number_practice || 0);
    form.setFieldsValue({
      credit: {
        hour_self_study: theory * 30 + practice * 15,
      },
    });
  };

  const handleSave = async (values) => {
    const theory = Number(values?.credit?.number_theory || 0);
    const practice = Number(values?.credit?.number_practice || 0);
    if (theory + practice <= 0) {
      message.error("Tổng số tín chỉ lý thuyết và thực hành phải lớn hơn 0!");
      return;
    }

    try {
      if (values.id) {
        await authApis().patch(endpoints["update-subject"](values.id), values);
        message.success("Cập nhật thành công!");
      } else {
        await authApis().post(endpoints["subjects"], values);
        message.success("Thêm mới thành công!");
      }
      setIsModalVisible(false);
      loadSubjects();
    } catch (err) {
      const errMsg = err?.response?.data?.credit || err?.response?.data?.code || "Có lỗi xảy ra!";
      message.error(typeof errMsg === "string" ? errMsg : "Có lỗi xảy ra!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApis().delete(endpoints["update-subject"](id));
      message.success("Xóa thành công!");
      loadSubjects();
    } catch (err) {
      message.error("Lỗi xóa dữ liệu!");
    }
  };

  const columns = [
    {title: "Mã môn", dataIndex: "code", key: "code", width: 150},
    {title: "Tên môn học", dataIndex: "name", key: "name"},
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-lg" />}
            onClick={() => nav("/admin")}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
          />
          <h2 className="text-xl font-bold text-gray-700 m-0">
            Quản lý Môn học
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
          Thêm môn học
        </Button>
      </div>

      <Table
        dataSource={subjects}
        columns={columns}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={form.getFieldValue("id") ? "Sửa môn học" : "Thêm môn học"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={handleCreditChange}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name={["credit", "id"]} hidden>
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="Mã môn học"
              rules={[
                {required: true, message: "Vui lòng nhập mã môn học"},
                {
                  pattern: /^[A-Z0-9_-]{2,20}$/,
                  message: "Mã môn chỉ gồm chữ in hoa, số, dấu gạch nối hoặc gạch dưới (2-20 ký tự)",
                },
              ]}
            >
              <Input placeholder="VD: CS101, MATH_01" />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên môn học"
              rules={[{required: true, message: "Vui lòng nhập tên môn học"}]}
            >
              <Input placeholder="Nhập tên môn học..." />
            </Form.Item>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase">
              Thông tin tín chỉ
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                name={["credit", "number_theory"]}
                label="Lý thuyết"
                rules={[{required: true, message: "Nhập số TC"}]}
              >
                <InputNumber className="w-full" min={0} placeholder="VD: 3" />
              </Form.Item>

              <Form.Item
                name={["credit", "number_practice"]}
                label="Thực hành"
                dependencies={[["credit", "number_theory"]]}
                rules={[
                  {required: true, message: "Nhập số TC"},
                  ({getFieldValue}) => ({
                    validator() {
                      const t = Number(getFieldValue(["credit", "number_theory"]) || 0);
                      const p = Number(getFieldValue(["credit", "number_practice"]) || 0);
                      if (t + p <= 0) {
                        return Promise.reject(new Error("Tổng số TC phải > 0"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber className="w-full" min={0} placeholder="VD: 1" />
              </Form.Item>

              <Form.Item
                name={["credit", "hour_self_study"]}
                label="Giờ tự học"
                rules={[{required: true, message: "Nhập số giờ"}]}
              >
                <InputNumber className="w-full" min={0} placeholder="VD: 90" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectManagement;
