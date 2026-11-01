import React from "react";
import { Modal, Form, Input, Select } from "antd";
import TableSchemaBuilder from "../TableSchemaBuilder";

const REFERENCE_OPTIONS = [
  { value: "lecturer_info", label: "Phụ trách môn học (Giảng viên)" },
  { value: "credit", label: "Thông tin số tín chỉ" },
  { value: "requirement_subject", label: "Môn học điều kiện" },
  { value: "objectives_and_outcomes", label: "Mục tiêu môn học" },
  { value: "course_learning_outcomes", label: "Chuẩn đầu ra môn học (CLO)" },
  { value: "clo_plo_matrix", label: "Ma trận CLO - PLO" },
  { value: "learning_material", label: "Tài liệu học tập" },
  { value: "assessment_method", label: "Phương pháp đánh giá" },
  { value: "teaching_schedule", label: "Kế hoạch giảng dạy" },
];

const CustomSubSectionModal = ({
  isOpen,
  onClose,
  onAdd,
  attributeGroups = [],
  sectionId,
  currentLength,
}) => {
  const [form] = Form.useForm();
  const selectedType = Form.useWatch("type", form);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const timestamp = Date.now();
      const code = values.type === "reference" && values.reference_code
        ? values.reference_code
        : `CUSTOM_${values.type.toUpperCase()}_${timestamp}`;

      const newSubSection = {
        id: `custom_sub_${timestamp}`,
        code,
        type: values.type,
        name: values.place_holder,
        place_holder: values.place_holder,
        position: currentLength + 1,
        ...(values.type === "selection" && {
          attribute_group_id: values.attribute_group_id,
        }),
        ...(values.type === "table" && { table_schema: values.table_schema }),
      };

      onAdd(sectionId, newSubSection);
      onClose();
      form.resetFields();
    } catch {
      return;
    }
  };

  return (
    <Modal
      title="Thêm tiểu mục tùy chỉnh"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Thêm mới"
      cancelText="Hủy"
      destroyOnClose
      width={1000}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="place_holder"
          label="Tên tiêu đề hiển thị"
          rules={[{ required: true, message: "Vui lòng nhập tên tiêu đề!" }]}
        >
          <Input placeholder="VD: Tài liệu tham khảo, Thông tin giảng viên..." />
        </Form.Item>

        <Form.Item
          name="type"
          label="Loại dữ liệu"
          rules={[{ required: true, message: "Vui lòng chọn loại dữ liệu!" }]}
        >
          <Select placeholder="Chọn loại...">
            <Select.Option value="text">Văn bản (Nhập liệu tự do)</Select.Option>
            <Select.Option value="selection">Lựa chọn (Dropdown danh mục)</Select.Option>
            <Select.Option value="table">Bảng tùy biến (Grid)</Select.Option>
            <Select.Option value="reference">Bảng tham chiếu hệ thống (Reference)</Select.Option>
          </Select>
        </Form.Item>

        {selectedType === "reference" && (
          <Form.Item
            name="reference_code"
            label="Mẫu bảng chuẩn hệ thống"
            rules={[{ required: true, message: "Vui lòng chọn mẫu chuẩn!" }]}
          >
            <Select placeholder="Chọn mẫu tham chiếu..." options={REFERENCE_OPTIONS} />
          </Form.Item>
        )}

        {selectedType === "selection" && (
          <Form.Item
            name="attribute_group_id"
            label="Nguồn dữ liệu danh mục"
            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
          >
            <Select placeholder="Chọn danh mục hệ thống...">
              {attributeGroups.map((g) => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {selectedType === "table" && (
          <Form.Item name="table_schema" className="mb-0">
            <TableSchemaBuilder />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default CustomSubSectionModal;
