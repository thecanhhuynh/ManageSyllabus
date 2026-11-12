import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  message,
  Space,
  Tag,
  Popconfirm,
  Card,
  Typography,
  List,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  TagsOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { authApis, endpoints } from "../../config/Apis";
import { useNavigate } from "react-router-dom";
import CleanInput from "../../components/CleanInput";
import { cleanWhitespace } from "../../utils/stringUtils";

const { Title, Text } = Typography;

const AttributeGroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [groupModal, setGroupModal] = useState({ open: false, record: null });
  const [valuesModal, setValuesModal] = useState({ open: false, group: null });
  const [newValueName, setNewValueName] = useState("");
  const [addingValue, setAddingValue] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [editValueName, setEditValueName] = useState("");

  const [form] = Form.useForm();
  const nav = useNavigate();

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApis().get(endpoints["attribute-groups"]);
      const list = res.data?.results || res.data || [];
      setGroups(list);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải danh sách nhóm thuộc tính!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleOpenGroupModal = (record = null) => {
    setGroupModal({ open: true, record });
    if (record) {
      form.setFieldsValue({ name: record.name });
      return;
    }
    form.resetFields();
  };

  const handleSaveGroup = async () => {
    try {
      const values = await form.validateFields();
      const name = cleanWhitespace(values.name);

      if (groupModal.record) {
        await authApis().patch(
          endpoints["attribute-group-detail"](groupModal.record.id),
          { name }
        );
        message.success("Cập nhật nhóm danh mục thành công!");
      } else {
        const rawVals = values.initial_values || "";
        const initialValues = rawVals
          .split("\n")
          .map((v) => cleanWhitespace(v))
          .filter(Boolean);

        await authApis().post(endpoints["attribute-groups"], {
          name,
          values: initialValues,
        });
        message.success("Tạo nhóm danh mục mới thành công!");
      }

      setGroupModal({ open: false, record: null });
      loadGroups();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.error || "Lỗi khi lưu nhóm danh mục!");
    }
  };

  const handleDeleteGroup = async (id) => {
    try {
      await authApis().delete(endpoints["attribute-group-detail"](id));
      message.success("Đã xóa nhóm danh mục!");
      loadGroups();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xóa nhóm danh mục!");
    }
  };

  const handleOpenValuesModal = (group) => {
    setValuesModal({ open: true, group });
    setNewValueName("");
    setEditingValue(null);
  };

  const handleAddValue = async () => {
    const valText = cleanWhitespace(newValueName);
    if (!valText) {
      message.warning("Vui lòng nhập tên giá trị!");
      return;
    }
    if (!valuesModal.group?.id) return;

    setAddingValue(true);
    try {
      const res = await authApis().post(
        endpoints["attribute-group-values"](valuesModal.group.id),
        { name_value: valText }
      );
      message.success(`Đã thêm giá trị "${valText}"!`);
      setNewValueName("");

      const updatedVals = [...(valuesModal.group.attribute_values || []), res.data];
      const updatedGroup = { ...valuesModal.group, attribute_values: updatedVals };
      setValuesModal((prev) => ({ ...prev, group: updatedGroup }));

      setGroups((prev) =>
        prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
      );
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.error || "Lỗi khi thêm giá trị!");
    } finally {
      setAddingValue(false);
    }
  };

  const handleUpdateValue = async (valId) => {
    const newName = cleanWhitespace(editValueName);
    if (!newName) {
      message.warning("Tên giá trị không được để trống!");
      return;
    }

    try {
      const res = await authApis().patch(
        endpoints["attribute-group-value-detail"](valuesModal.group.id, valId),
        { name_value: newName }
      );
      message.success("Đã cập nhật tên giá trị!");
      setEditingValue(null);

      const updatedVals = (valuesModal.group.attribute_values || []).map((v) =>
        v.id === valId ? res.data : v
      );
      const updatedGroup = { ...valuesModal.group, attribute_values: updatedVals };
      setValuesModal((prev) => ({ ...prev, group: updatedGroup }));

      setGroups((prev) =>
        prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
      );
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.error || "Lỗi cập nhật giá trị!");
    }
  };

  const handleDeleteValue = async (valId) => {
    try {
      await authApis().delete(
        endpoints["attribute-group-value-detail"](valuesModal.group.id, valId)
      );
      message.success("Đã xóa giá trị!");

      const updatedVals = (valuesModal.group.attribute_values || []).filter(
        (v) => v.id !== valId
      );
      const updatedGroup = { ...valuesModal.group, attribute_values: updatedVals };
      setValuesModal((prev) => ({ ...prev, group: updatedGroup }));

      setGroups((prev) =>
        prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
      );
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi xóa giá trị!");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
    {
      title: "Tên nhóm danh mục lựa chọn",
      dataIndex: "name",
      key: "name",
      width: 260,
      render: (text) => <Text strong style={{ color: "#1e3a8a" }}>{text}</Text>,
    },
    {
      title: "Các giá trị tùy chọn (Options)",
      key: "values",
      minWidth: 260,
      render: (_, record) => {
        const vals = record.attribute_values || [];
        if (vals.length === 0) {
          return <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Chưa có giá trị nào</span>;
        }
        return (
          <Space wrap size={[4, 6]}>
            {vals.map((v) => (
              <Tag key={v.id} color="blue" style={{ borderRadius: 4 }}>
                {v.name_value}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Số lượng",
      key: "count",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Tag color="cyan">{(record.attribute_values || []).length} mục</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 240,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size="small" wrap={false}>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<TagsOutlined />}
            onClick={() => handleOpenValuesModal(record)}
          >
            Quản lý giá trị
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            title="Chỉnh sửa tên nhóm"
            onClick={() => handleOpenGroupModal(record)}
          />
          <Popconfirm
            title="Xóa nhóm danh mục này?"
            description="Lưu ý: Các tiểu mục đề cương đang dùng nhóm này có thể bị ảnh hưởng."
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} title="Xóa nhóm" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý Danh mục Lựa chọn (Selection Attributes)
          </Title>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenGroupModal(null)}
          style={{ fontWeight: 600 }}
        >
          Thêm nhóm mới
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="mb-4 max-w-md">
          <CleanInput
            placeholder="Tìm kiếm nhóm thuộc tính theo tên hoặc mã..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table
          rowKey="id"
          dataSource={groups.filter((g) => {
            if (!searchText.trim()) return true;
            const q = searchText.toLowerCase().trim();
            return (
              (g.name || "").toLowerCase().includes(q) ||
              (g.code || "").toLowerCase().includes(q)
            );
          })}
          columns={columns}
          loading={loading}
          scroll={{ x: 950 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng cộng ${total} nhóm thuộc tính`,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* Modal Thêm / Sửa Nhóm */}
      <Modal
        title={groupModal.record ? "Chỉnh sửa nhóm danh mục" : "Tạo nhóm danh mục lựa chọn mới"}
        open={groupModal.open}
        onOk={handleSaveGroup}
        onCancel={() => setGroupModal({ open: false, record: null })}
        okText={groupModal.record ? "Lưu thay đổi" : "Tạo nhóm"}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên nhóm danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên nhóm danh mục!" }]}
          >
            <CleanInput placeholder="VD: Hình thức thực tập, Phương thức kiểm tra..." />
          </Form.Item>

          {!groupModal.record && (
            <Form.Item
              name="initial_values"
              label="Các giá trị khởi tạo (Mỗi giá trị 1 dòng)"
            >
              <CleanInput.TextArea
                rows={4}
                placeholder={"Ví dụ:\nTrực tiếp tại doanh nghiệp\nLàm việc từ xa (Remote)\nThực tập tại phòng Lab"}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal Quản lý Giá trị con */}
      <Modal
        title={
          <span>
            <TagsOutlined className="mr-2 text-blue-600" />
            Quản lý giá trị:{" "}
            <strong style={{ color: "#1d4ed8" }}>{valuesModal.group?.name}</strong>
          </span>
        }
        open={valuesModal.open}
        onCancel={() => setValuesModal({ open: false, group: null })}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div className="py-2">
          <div className="flex gap-2 mb-4">
            <CleanInput
              placeholder="Nhập tên giá trị mới..."
              value={newValueName}
              onChange={(e) => setNewValueName(e.target.value)}
              onPressEnter={handleAddValue}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddValue}
              loading={addingValue}
            >
              Thêm giá trị
            </Button>
          </div>

          <List
            bordered
            size="small"
            style={{ maxHeight: 380, overflowY: "auto", paddingRight: 4 }}
            dataSource={valuesModal.group?.attribute_values || []}
            renderItem={(item) => (
              <List.Item
                actions={[
                  editingValue?.id === item.id ? (
                    <Space size="small" key="edit_actions">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleUpdateValue(item.id)}
                      >
                        Lưu
                      </Button>
                      <Button size="small" onClick={() => setEditingValue(null)}>
                        Hủy
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      size="small"
                      type="link"
                      icon={<EditOutlined />}
                      key="edit"
                      onClick={() => {
                        setEditingValue(item);
                        setEditValueName(item.name_value);
                      }}
                    >
                      Sửa
                    </Button>
                  ),
                  <Popconfirm
                    title="Xóa giá trị này?"
                    key="del"
                    onConfirm={() => handleDeleteValue(item.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button size="small" type="link" danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]}
              >
                {editingValue?.id === item.id ? (
                  <CleanInput
                    size="small"
                    value={editValueName}
                    onChange={(e) => setEditValueName(e.target.value)}
                    onPressEnter={() => handleUpdateValue(item.id)}
                    style={{ maxWidth: 300 }}
                    autoFocus
                  />
                ) : (
                  <Text>{item.name_value}</Text>
                )}
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AttributeGroupManagement;
