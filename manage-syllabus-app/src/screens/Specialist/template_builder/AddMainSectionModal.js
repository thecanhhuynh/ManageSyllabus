import React from "react";
import { Modal, Form, Input } from "antd";

const AddMainSectionModal = ({ open, onClose, onAddSection, nextPosition }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const timestamp = Date.now();
      const newSection = {
        id: `main_sec_${timestamp}`,
        code: `MAIN_${nextPosition}_${timestamp}`,
        name: values.name.trim(),
        position: nextPosition,
        sub_sections: [],
      };
      onAddSection(newSection);
      form.resetFields();
      onClose();
    } catch {
      return;
    }
  };

  return (
    <Modal
      title={`Thêm Phần lớn mới (Mục ${nextPosition})`}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Thêm mới"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="name"
          label="Tên Phần lớn"
          rules={[{ required: true, message: "Vui lòng nhập tên phần lớn!" }]}
        >
          <Input placeholder="VD: THÔNG TIN CHUNG, MỤC TIÊU MÔN HỌC..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddMainSectionModal;
