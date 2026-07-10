import React, {useState, useEffect} from "react";
import {
  Button,
  Input,
  message,
  Typography,
  Card,
  Space,
  Divider,
  Tag,
  Spin,
  Popconfirm,
  Form,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {useParams, useNavigate} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import TextRenderer from "../../components/renderers/TextRenderer";
import SelectionRenderer from "../../components/renderers/SelectionRenderer";
import ReferenceRenderer from "../../components/ReferenceRenderer";
const {Title} = Typography;

const TemplateBuilder = () => {
  const {id} = useParams(); // Lấy ID của template từ URL
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [templateMeta, setTemplateMeta] = useState({name: "", version: ""});
  const [sections, setSections] = useState([]);
  const [previewForm] = Form.useForm();
  // 1. GỌI API LOAD DỮ LIỆU TEMPLATE ĐÃ CLONE
  useEffect(() => {
    const fetchTemplateData = async () => {
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
    if (id) fetchTemplateData();
  }, [id]);

  // 2. CÁC HÀM TINH CHỈNH (TWEAK)
  const removeMainSection = (sectionId) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const removeSubSection = (sectionId, subId) => {
    setSections(
      sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            sub_sections: sec.sub_sections.filter((sub) => sub.id !== subId),
          };
        }
        return sec;
      }),
    );
  };

  const updateSubSectionLabel = (sectionId, subId, newLabel) => {
    setSections(
      sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            sub_sections: sec.sub_sections.map((sub) =>
              sub.id === subId ? {...sub, place_holder: newLabel} : sub,
            ),
          };
        }
        return sec;
      }),
    );
  };

  // 3. LƯU LẠI CẤU TRÚC ĐÃ TINH CHỈNH
  const handleSaveTweak = async () => {
    try {
      // Gửi toàn bộ cây dữ liệu đã sửa lên API (Cần chắc chắn serializer BE hỗ trợ update nested)
      await authApis().put(`${endpoints["templates"]}${id}/`, {
        name: templateMeta.name,
        version: templateMeta.version,
        main_sections: sections,
      });
      message.success("Đã lưu cấu hình Template!");
      nav("/admin/templates");
    } catch (error) {
      message.error("Lỗi khi lưu Template!");
    }
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
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveTweak}
        >
          Lưu Cấu Hình
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {sections.map((section, index) => (
          <Card
            key={section.id}
            title={
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-lg">
                  Mục {index + 1}: {section.code}
                </span>
                <Tag icon={<LockOutlined />} color="default">
                  Mã hệ thống: {section.code}
                </Tag>
              </div>
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
            <div className="space-y-4">
              {section.sub_sections.map((sub) => {
                return (
                  <div
                    key={sub.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg flex flex-col gap-4"
                  >
                    = {/* Cột Trái: Cấu hình */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag color="blue">{sub.type.toUpperCase()}</Tag>
                        <Tag
                          icon={<LockOutlined />}
                          color="gold"
                          title="Không thể sửa mã này để tránh lỗi hệ thống"
                        >
                          Code: {sub.code}
                        </Tag>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Tiêu đề hiển thị (Label / Placeholder)
                        </div>
                        <Input
                          value={sub.place_holder}
                          onChange={(e) =>
                            updateSubSectionLabel(
                              section.id,
                              sub.id,
                              e.target.value,
                            )
                          }
                          className="font-medium"
                        />
                      </div>
                    </div>
                    {/* Cột Phải: Xóa */}
                    <Popconfirm
                      title="Ẩn/Xóa trường dữ liệu này?"
                      onConfirm={() => removeSubSection(section.id, sub.id)}
                    >
                      <Button danger type="dashed" icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>
                    {/* KHU VỰC PREVIEW COMPONENT */}
                    <div className="p-3 bg-gray-50 border rounded-md pointer-events-none opacity-80 mt-3">
                      <Form form={previewForm}>
                        {sub.type === "text" && (
                          <TextRenderer item={sub} basePath={[]} />
                        )}
                        {sub.type === "selection" && (
                          <SelectionRenderer item={sub} basePath={[]} />
                        )}
                        {sub.type === "reference" && (
                          <ReferenceRenderer
                            item={{...sub, reference_code: sub.code}}
                            basePath={[]}
                          />
                        )}
                      </Form>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ĐÃ BỎ ĐI TOOLBOX THÊM MỚI PHỨC TẠP */}
            <Divider dashed />
            <div className="text-gray-400 text-sm text-center">
              (Chỉ cho phép xóa hoặc đổi tên nhãn từ mẫu gốc. Không hỗ trợ thêm
              Form tự do để đảm bảo đồng bộ hệ thống)
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateBuilder;
