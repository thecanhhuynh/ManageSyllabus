import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { authApis, endpoints } from "../../../config/Apis";
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

const DEFAULT_TABLE_SCHEMA = {
  firstColumnHeader: "Tiêu đề hàng",
  columns: [
    { id: "c_1", headerName: "Cột 1", field: "c_1" },
    { id: "c_2", headerName: "Cột 2", field: "c_2" },
    { id: "c_3", headerName: "Cột 3", field: "c_3" },
  ],
  rows: [
    { id: "r_1", rowTitle: "Hàng 1", customHeight: 60, c_1: "", c_2: "", c_3: "" },
    { id: "r_2", rowTitle: "Hàng 2", customHeight: 60, c_1: "", c_2: "", c_3: "" },
    { id: "r_3", rowTitle: "Hàng 3", customHeight: 60, c_1: "", c_2: "", c_3: "" },
  ],
};

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
  const [groupsList, setGroupsList] = useState(attributeGroups);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickValues, setQuickValues] = useState("");
  const [creatingQuick, setCreatingQuick] = useState(false);

  useEffect(() => {
    setGroupsList(attributeGroups);
  }, [attributeGroups]);

  const handleQuickCreate = async () => {
    const name = quickName.trim();
    if (!name) {
      message.warning("Vui lòng nhập tên nhóm danh mục!");
      return;
    }
    setCreatingQuick(true);
    try {
      const vals = quickValues.split("\n").map((v) => v.trim()).filter(Boolean);
      const res = await authApis().post(endpoints["attribute-groups"], {
        name,
        values: vals,
      });
      message.success(`Đã tạo nhóm "${name}" thành công!`);
      const newGroup = res.data;
      setGroupsList((prev) => [...prev, newGroup]);
      form.setFieldValue("attribute_group_id", newGroup.id);
      setQuickModalOpen(false);
      setQuickName("");
      setQuickValues("");
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.error || "Lỗi tạo nhóm danh mục!");
    } finally {
      setCreatingQuick(false);
    }
  };

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
            label={
              <div className="flex items-center justify-between w-full" style={{ minWidth: 260 }}>
                <span>Nguồn dữ liệu danh mục</span>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setQuickModalOpen(true)}
                  style={{ padding: 0, height: "auto", fontSize: 12, marginLeft: 16 }}
                >
                  Tạo nhóm mới
                </Button>
              </div>
            }
            rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
          >
            <Select placeholder="Chọn danh mục hệ thống...">
              {groupsList.map((g) => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {selectedType === "table" && (
          <Form.Item
            name="table_schema"
            className="mb-0"
            initialValue={DEFAULT_TABLE_SCHEMA}
          >
            <TableSchemaBuilder />
          </Form.Item>
        )}
      </Form>

      <Modal
        title="Tạo nhanh nhóm danh mục lựa chọn"
        open={quickModalOpen}
        onOk={handleQuickCreate}
        onCancel={() => setQuickModalOpen(false)}
        confirmLoading={creatingQuick}
        okText="Tạo & Chọn"
        cancelText="Hủy"
        destroyOnClose
      >
        <div className="py-2 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tên nhóm danh mục <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="VD: Hình thức thực tập..."
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Các giá trị tùy chọn (Mỗi dòng 1 giá trị)
            </label>
            <Input.TextArea
              rows={4}
              placeholder={"VD:\nTrực tiếp tại doanh nghiệp\nLàm việc từ xa (Remote)\nTại phòng thí nghiệm"}
              value={quickValues}
              onChange={(e) => setQuickValues(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default CustomSubSectionModal;
