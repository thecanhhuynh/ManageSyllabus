import React, { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";

const COLUMN_TYPE_OPTIONS = [
  { label: "Văn bản (text)", value: "text" },
  { label: "Số nguyên (int)", value: "int" },
  { label: "Số thực (float)", value: "float" },
  { label: "Đúng / Sai (boolean)", value: "boolean" },
  { label: "Ngày tháng (date)", value: "date" },
];

export const CustomColumnModal = ({
  open,
  editingColumn,
  levelOptions,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const isNested = Boolean(levelOptions);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    if (editingColumn) {
      form.setFieldsValue({
        column_label: editingColumn.column_label,
        column_type: editingColumn.column_type,
        default_value: editingColumn.default_value,
        level: editingColumn.level || "root",
      });
      return;
    }
    form.setFieldsValue({
      column_label: "",
      column_type: "text",
      default_value: "",
      level: "root",
    });
  }, [open, editingColumn, form]);

  const handleFinish = (values) => {
    onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={editingColumn ? "Chỉnh sửa cột tùy biến" : "Thêm cột tùy biến"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingColumn ? "Cập nhật" : "Tạo"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="column_label"
          label="Tên / Nhãn cột"
          rules={[{ required: true, message: "Vui lòng nhập tên cột" }]}
        >
          <Input placeholder="VD: Số buổi, Ghi chú GV..." />
        </Form.Item>
        {isNested && (
          <Form.Item
            name="level"
            label="Tầng áp dụng"
            initialValue="root"
            rules={[{ required: true, message: "Vui lòng chọn tầng áp dụng" }]}
          >
            <Select options={levelOptions} />
          </Form.Item>
        )}
        <Form.Item name="default_value" label="Giá trị mặc định">
          <Input placeholder="VD: 15, 0, Chưa có..." />
        </Form.Item>
        <Form.Item
          name="column_type"
          label="Kiểu dữ liệu"
          initialValue="text"
        >
          <Select options={COLUMN_TYPE_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomColumnModal;
