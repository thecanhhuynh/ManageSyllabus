import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {
  Button,
  Input,
  message,
  Typography,
  Card,
  Divider,
  Spin,
  Popconfirm,
  Form,
  Select,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import {DndContext, closestCenter} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

import {authApis, endpoints} from "../../config/Apis";
import {getPlugin} from "../../plugins/Registry";
import TableSchemaBuilder from "./TableSchemaBuilder";
import TextPreview from "../../plugins/Text/TextPreview";

const {Title} = Typography;
const useTemplateManager = (id) => {
  const [loading, setLoading] = useState(false);
  const [templateMeta, setTemplateMeta] = useState({name: "", version: ""});
  const [sections, setSections] = useState([]);
  const [attributeGroups, setAttributeGroups] = useState([]);

  useEffect(() => {
    loadTemplateData();
    loadAttrGroups();
  }, [id]);

  const loadTemplateData = async () => {
    setLoading(true);
    try {
      const res = await authApis().get(`${endpoints["templates"]}${id}/`);
      setTemplateMeta({name: res.data.name, version: res.data.version});
      setSections(res.data.main_sections || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu Template!");
    }
    setLoading(false);
  };

  const loadAttrGroups = async () => {
    try {
      const res = await authApis().get(endpoints["attribute-groups"]);
      setAttributeGroups(res.data.results || res.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh mục", error);
    }
  };

  const removeMainSection = (sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const removeSubSection = (sectionId, subId) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const filtered = sec.sub_sections.filter((sub) => sub.id !== subId);
          const updated = filtered.map((sub, index) => ({
            ...sub,
            position: index + 1,
          }));
          return {...sec, sub_sections: updated};
        }
        return sec;
      }),
    );
  };

  const updateSubSectionField = (sectionId, subId, field, value) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            sub_sections: sec.sub_sections.map((sub) => {
              if (sub.id === subId) {
                if (field === "name")
                  return {...sub, name: value, place_holder: value};
                return {...sub, [field]: value};
              }
              return sub;
            }),
          };
        }
        return sec;
      }),
    );
  };

  const addCustomSubSection = (sectionId, newSubSection) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {...sec, sub_sections: [...sec.sub_sections, newSubSection]};
        }
        return sec;
      }),
    );
  };

  const handleDragEnd = (event, sectionId) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const oldIndex = sec.sub_sections.findIndex(
            (sub) => sub.id === active.id,
          );
          const newIndex = sec.sub_sections.findIndex(
            (sub) => sub.id === over.id,
          );
          const newSubSections = arrayMove(
            sec.sub_sections,
            oldIndex,
            newIndex,
          );

          return {
            ...sec,
            sub_sections: newSubSections.map((sub, idx) => ({
              ...sub,
              position: idx + 1,
            })),
          };
        }
        return sec;
      }),
    );
  };

  const saveTemplate = async () => {
    try {
      await authApis().put(`${endpoints["templates"]}${id}/`, {
        name: templateMeta.name,
        version: templateMeta.version,
        main_sections: sections,
      });
      message.success("Đã lưu cấu hình Template!");
    } catch (error) {
      message.error("Lỗi khi lưu Template!");
    }
  };

  return {
    loading,
    templateMeta,
    sections,
    attributeGroups,
    removeMainSection,
    removeSubSection,
    updateSubSectionField,
    addCustomSubSection,
    handleDragEnd,
    saveTemplate,
  };
};

const SortableWrapper = ({id, children}) => {
  const {attributes, listeners, setNodeRef, transform, transition} =
    useSortable({id});
  const style = {transform: CSS.Transform.toString(transform), transition};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-2 text-gray-400 hover:text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"
      >
        <DragOutlined />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
};

const SubSectionCard = ({
  sub,
  sectionId,
  attributeGroups,
  onUpdate,
  onRemove,
}) => {
  const Plugin = getPlugin(sub.type, sub.code);
  const DynamicPreview = Plugin ? Plugin.Preview : null;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg flex flex-col gap-4 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Mục {sub.position} - Tiêu đề hiển thị
            </div>
            <Input
              value={sub.name}
              onChange={(e) =>
                onUpdate(sectionId, sub.id, "name", e.target.value)
              }
              className="font-medium"
            />
          </div>
        </div>

        {sub.type === "selection" && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">
              Nguồn dữ liệu (Attribute Group){" "}
              <span className="text-red-500">*</span>
            </div>
            <Select
              value={sub.attribute_group_id || null}
              placeholder="Chọn bộ dữ liệu..."
              style={{width: "100%"}}
              onChange={(val) =>
                onUpdate(sectionId, sub.id, "attribute_group_id", val)
              }
              status={!sub.attribute_group_id ? "error" : ""}
            >
              {attributeGroups.map((group) => (
                <Select.Option key={group.id} value={group.id}>
                  {group.name}
                </Select.Option>
              ))}
            </Select>
            {!sub.attribute_group_id && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ Cần chọn nguồn dữ liệu!
              </div>
            )}
          </div>
        )}

        <Popconfirm
          title="Ẩn/Xóa trường dữ liệu này?"
          onConfirm={() => onRemove(sectionId, sub.id)}
        >
          <Button danger type="dashed" icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      </div>

      <div
        className={`p-3 bg-gray-50 border rounded-md mt-1 ${sub.type !== "text" ? "pointer-events-none opacity-80" : ""}`}
      >
        {sub.type === "text" ? (
          <TextPreview
            item={sub}
            onUpdateField={(field, val) =>
              onUpdate(sectionId, sub.id, field, val)
            }
          />
        ) : DynamicPreview ? (
          <DynamicPreview item={sub} />
        ) : (
          <div className="text-center text-gray-400 p-4 border border-dashed rounded bg-gray-100 font-medium">
            🚧 Đang chờ lắp Plugin tĩnh cho: {sub.type} - {sub.code}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomSubSectionModal = ({
  isOpen,
  onClose,
  onAdd,
  attributeGroups,
  sectionId,
  currentLength,
}) => {
  const [form] = Form.useForm();
  const selectedType = Form.useWatch("type", form);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const timestamp = Date.now();
      const typeMapping = {
        text: "text",
        selection: "selection",
        table: "table",
      };

      const newSubSection = {
        id: `custom_sub_${timestamp}`,
        code: `CUSTOM_${values.type.toUpperCase()}_${timestamp}`,
        type: typeMapping[values.type] || values.type,
        name: values.place_holder,
        place_holder: values.place_holder,
        position: currentLength + 1,
        ...(values.type === "selection" && {
          attribute_group_id: values.attribute_group_id,
        }),
        ...(values.type === "table" && {table_schema: values.table_schema}),
      };

      onAdd(sectionId, newSubSection);
      onClose();
      form.resetFields();
    } catch (error) {
      console.log("Validate Failed:", error);
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
          label="Tên tiêu đề"
          rules={[{required: true}]}
        >
          <Input placeholder="VD: Tài liệu tham khảo ngoài..." />
        </Form.Item>

        <Form.Item name="type" label="Loại dữ liệu" rules={[{required: true}]}>
          <Select placeholder="Chọn loại...">
            <Select.Option value="text">Văn bản (Nhập liệu)</Select.Option>
            <Select.Option value="selection">Lựa chọn (Dropdown)</Select.Option>
            <Select.Option value="table">Bảng (Grid)</Select.Option>
          </Select>
        </Form.Item>

        {selectedType === "selection" && (
          <Form.Item
            name="attribute_group_id"
            label="Nguồn dữ liệu"
            rules={[{required: true}]}
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

const TemplateBuilder = () => {
  const {id} = useParams();
  const nav = useNavigate();

  const {
    loading,
    templateMeta,
    sections,
    attributeGroups,
    removeMainSection,
    removeSubSection,
    updateSubSectionField,
    addCustomSubSection,
    handleDragEnd,
    saveTemplate,
  } = useTemplateManager(id);

  const [activeSectionId, setActiveSectionId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleOpenAddModal = (sectionId) => {
    setActiveSectionId(sectionId);
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = (sectionId, newSubSection) => {
    addCustomSubSection(sectionId, newSubSection);
    message.success("Đã thêm tiểu mục tùy chỉnh!");
  };

  if (loading)
    return (
      <div className="text-center p-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => nav(-1)}
          />
          <Title level={4} className="!m-0">
            Tinh chỉnh Template:{" "}
            <span className="text-blue-600">{templateMeta.name}</span>
          </Title>
        </div>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveTemplate}>
          Lưu Cấu Hình
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {sections.map((section, index) => (
          <Card
            key={section.id}
            title={
              <span className="font-bold text-lg">
                Mục {index + 1}: {section.name}
              </span>
            }
            extra={
              <Popconfirm
                title="Xóa toàn bộ mục này?"
                onConfirm={() => removeMainSection(section.id)}
              >
                <Button danger icon={<DeleteOutlined />} type="text" />
              </Popconfirm>
            }
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, section.id)}
            >
              <SortableContext
                items={section.sub_sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {section.sub_sections.map((sub) => (
                    <SortableWrapper key={sub.id} id={sub.id}>
                      <SubSectionCard
                        sub={sub}
                        sectionId={section.id}
                        attributeGroups={attributeGroups}
                        onUpdate={updateSubSectionField}
                        onRemove={removeSubSection}
                      />
                    </SortableWrapper>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Divider dashed />
            <div className="text-gray-400 text-sm text-center">
              (Chỉ cho phép xóa hoặc đổi tên nhãn từ mẫu gốc. Không hỗ trợ thêm
              Form tự do để đảm bảo đồng bộ hệ thống)
            </div>
            <Button
              type="dashed"
              block
              onClick={() => handleOpenAddModal(section.id)}
              className="mt-4 border-blue-300 text-blue-500 hover:bg-blue-50"
            >
              + Thêm tiểu mục tùy chỉnh
            </Button>
          </Card>
        ))}
      </div>

      <CustomSubSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSuccess}
        sectionId={activeSectionId}
        attributeGroups={attributeGroups}
        currentLength={
          sections.find((s) => s.id === activeSectionId)?.sub_sections
            ?.length || 0
        }
      />
    </div>
  );
};

export default TemplateBuilder;
