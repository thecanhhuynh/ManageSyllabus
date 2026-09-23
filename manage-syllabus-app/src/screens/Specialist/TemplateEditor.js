import React, {useEffect, useState, useMemo} from "react";
import {DocumentEditor} from "@onlyoffice/document-editor-react";
import {authApis} from "../../config/Apis";
import {useNavigate, useParams} from "react-router-dom";
import {
  Button,
  Input,
  message,
  Space,
  Tooltip,
  Typography,
  Collapse,
  Modal,
} from "antd";
import MySpinner from "../../components/MySpinner";
import {
  CopyOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  TableOutlined,
  FontColorsOutlined,
  EyeOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const {Text, Title} = Typography;
const {Panel} = Collapse;
const ONLYOFFICE_SERVER_URL = "http://localhost:8082/";

const TemplateEditor = () => {
  const params = useParams();
  const currentId = params.id;
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [fields, setFields] = useState({
    SCALAR: [],
    TABLE_FIXED: [],
    TABLE_DYNAMIC: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State cho Preview Modal
  const [previewConfig, setPreviewConfig] = useState(null);

  const fetchData = async () => {
    try {
      const [configRes, fieldsRes] = await Promise.all([
        authApis().get(`/templates/${currentId}/onlyoffice-config/`),
        authApis().get(`/templates/${currentId}/control-fields/`),
      ]);

      console.log("=== DEBUG API CONFIG ===", configRes.data);
      console.log("=== DEBUG API FIELDS ===", fieldsRes.data);

      const docConfig = {
        ...configRes.data,
        editorConfig: {
          ...configRes.data.editorConfig,
          customization: {
            ...configRes.data.editorConfig?.customization,
            plugins: false,
          },
        },
      };

      setConfig(docConfig);

      // Xử lý an toàn dữ liệu trả về
      const apiFields = fieldsRes.data || {};
      setFields({
        SCALAR: apiFields.SCALAR || [],
        TABLE_FIXED: apiFields.TABLE_FIXED || [],
        TABLE_DYNAMIC: apiFields.TABLE_DYNAMIC || [],
      });
    } catch (err) {
      console.error("Lỗi fetch data:", err);
      message.error("Lỗi khi tải dữ liệu template!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentId && currentId !== "undefined") {
      fetchData();
    }
  }, [currentId]);

  const handleCopyScalar = async (tag, label) => {
    const token = `[[${tag}]]`;
    try {
      await navigator.clipboard.writeText(token);
      message.success(
        <span>
          Đã copy thẻ <b>{label}</b>. Hãy nhấn Ctrl+V để dán.
        </span>,
      );
    } catch (err) {
      message.error("Lỗi khi copy. Trình duyệt không hỗ trợ.");
    }
  };

  const handleCopyTable = async (field) => {
    const {tag, schema, label} = field;

    // Khởi tạo HTML Table với font chuẩn
    let headerHtml = `<tr style="background-color: #e8e8e8; font-weight: bold; text-align: center;">`;
    let loopHtml = `<tr>`;

    if (Array.isArray(schema) && schema.length > 0) {
      schema.forEach((col) => {
        const colLabel = col.label || col.key;
        headerHtml += `<td style="border: 1px solid #000; padding: 5px;">${colLabel}</td>`;
        loopHtml += `<td style="border: 1px solid #000; padding: 5px;">[[ROW.${col.key}]]</td>`;
      });
    } else {
      headerHtml += `<td style="border: 1px solid #000; padding: 5px;">Nội dung</td>`;
      loopHtml += `<td style="border: 1px solid #000; padding: 5px;">[[ROW.content]]</td>`;
    }

    headerHtml += `</tr>`;
    loopHtml += `</tr>`;

    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #000; font-family: 'Times New Roman', serif; font-size: 12pt;">
        ${headerHtml}
        ${loopHtml}
      </table>
      <p><br/></p>
    `;

    try {
      const blobHtml = new Blob([tableHtml], {type: "text/html"});
      const blobText = new Blob([`[Bảng: ${tag}]`], {type: "text/plain"});
      const clipboardItem = new window.ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText,
      });
      await navigator.clipboard.write([clipboardItem]);
      message.success(
        <span>
          Đã copy bảng <b>{label}</b>. Hãy nhấn Ctrl+V để dán.
        </span>,
      );
    } catch (err) {
      message.warning(
        "Trình duyệt chặn ghi HTML. Vui lòng chạy trên localhost hoặc HTTPS.",
      );
    }
  };

  // =====================================================================
  // HÀM XEM TRƯỚC (PREVIEW)
  // =====================================================================
  const handlePreview = async () => {
    try {
      message.loading({
        content: "Đang giả lập kết xuất dữ liệu...",
        key: "preview_msg",
      });

      // Gọi API POST /preview/ mới tạo ở Backend
      const response = await authApis().post(
        `/templates/${currentId}/preview/`,
        {
          // Tùy chọn: Truyền syllabus_id nếu muốn test dữ liệu của 1 môn cụ thể
          // syllabus_id: 1
        },
      );

      setPreviewConfig(response.data); // Chứa config CHỈ ĐỌC (View mode)
      message.success({
        content: "Đã tạo bản xem trước thành công!",
        key: "preview_msg",
      });
    } catch (err) {
      message.error({
        content: "Không thể kết xuất bản xem thử!",
        key: "preview_msg",
      });
    }
  };

  // =====================================================================
  // LỌC DỮ LIỆU TÌM KIẾM
  // =====================================================================
  const filteredFields = useMemo(() => {
    const keyword = search.toLowerCase();
    const filterArr = (arr) =>
      arr?.filter(
        (item) =>
          item.tag.toLowerCase().includes(keyword) ||
          item.label.toLowerCase().includes(keyword),
      ) || [];

    return {
      SCALAR: filterArr(fields.SCALAR),
      TABLE_FIXED: filterArr(fields.TABLE_FIXED),
      TABLE_DYNAMIC: filterArr(fields.TABLE_DYNAMIC),
    };
  }, [fields, search]);

  if (loading) return <MySpinner message="Đang tải trình soạn thảo..." />;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR DANH MỤC THẺ */}
      <div
        style={{
          width: 350,
          borderRight: "1px solid #e8e8e8",
          background: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* HEADER SIDEBAR */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid #f0f0f0",
            background: "#fff",
          }}
        >
          <Space orientation="vertical" style={{width: "100%"}} size="middle">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/specialist/templates")}
              >
                Trở về
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={handlePreview}
              >
                Xem trước
              </Button>
            </div>

            <div>
              <Title level={5} style={{margin: 0}}>
                Danh mục Thẻ dữ liệu
              </Title>
              <Text type="secondary" style={{fontSize: 12}}>
                Quản lý các trường tự động điền
              </Text>
            </div>

            <div
              style={{
                padding: 10,
                backgroundColor: "#e6f7ff",
                borderRadius: 4,
                border: "1px solid #91d5ff",
                fontSize: 13,
              }}
            >
              <b style={{color: "#096dd9"}}>
                <InfoCircleOutlined /> Hướng dẫn:
              </b>
              <br />
              Bấm <b>Sao chép</b> ở thẻ bên dưới, click chuột vào văn bản rồi
              bấm phím <b>Ctrl + V</b> để dán.
            </div>

            <Input
              prefix={<SearchOutlined style={{color: "#bfbfbf"}} />}
              placeholder="Tìm kiếm mã thẻ hoặc tên..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Space>
        </div>

        {/* DANH SÁCH THẺ (COLLAPSE) */}
        <div style={{flex: 1, overflowY: "auto", padding: 12}}>
          <Collapse
            defaultActiveKey={["1", "2"]}
            expandIconPosition="end"
            ghost
          >
            {/* NHÓM 1: SCALAR */}
            <Panel
              header={<strong style={{color: "#333"}}>Thẻ văn bản đơn</strong>}
              key="1"
            >
              {filteredFields.SCALAR.length > 0 ? (
                filteredFields.SCALAR.map((f) => (
                  <div
                    key={f.tag}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{display: "flex", flexDirection: "column"}}>
                      <span style={{fontSize: "13px", fontWeight: 500}}>
                        {f.label}
                      </span>
                      <Text type="secondary" style={{fontSize: 11}}>
                        <FontColorsOutlined /> {f.tag}
                      </Text>
                    </div>
                    <Tooltip title="Copy mã thẻ">
                      <Button
                        type="text"
                        icon={<CopyOutlined style={{color: "#1890ff"}} />}
                        onClick={() => handleCopyScalar(f.tag, f.label)}
                      />
                    </Tooltip>
                  </div>
                ))
              ) : (
                <Text type="secondary">Không có thẻ nào</Text>
              )}
            </Panel>

            {/* NHÓM 2: TABLE FIXED */}
            <Panel
              header={
                <strong style={{color: "#333"}}>Bảng dữ liệu (Hệ thống)</strong>
              }
              key="2"
            >
              {filteredFields.TABLE_FIXED.length > 0 ? (
                filteredFields.TABLE_FIXED.map((f) => (
                  <div
                    key={f.tag}
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      backgroundColor: "#fff",
                      border: "1px solid #d9d9d9",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "500",
                        marginBottom: 4,
                        fontSize: "13px",
                      }}
                    >
                      {f.label}
                    </div>
                    <Text
                      type="secondary"
                      style={{fontSize: 11, display: "block", marginBottom: 8}}
                    >
                      Mã: {f.tag}
                    </Text>
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      block
                      icon={<TableOutlined />}
                      onClick={() => handleCopyTable(f)}
                    >
                      Sao chép cả bảng
                    </Button>
                  </div>
                ))
              ) : (
                <Text type="secondary">Không có bảng hệ thống</Text>
              )}
            </Panel>

            {/* NHÓM 3: TABLE DYNAMIC */}
            <Panel
              header={
                <strong style={{color: "#333"}}>Bảng tự định nghĩa</strong>
              }
              key="3"
            >
              {filteredFields.TABLE_DYNAMIC.length > 0 ? (
                filteredFields.TABLE_DYNAMIC.map((f) => (
                  <div
                    key={f.tag}
                    style={{
                      marginBottom: 12,
                      padding: 10,
                      backgroundColor: "#f6ffed",
                      border: "1px dashed #b7eb8f",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "500",
                        marginBottom: 4,
                        fontSize: "13px",
                        color: "#389e0d",
                      }}
                    >
                      {f.label}
                    </div>
                    <Text
                      type="secondary"
                      style={{fontSize: 11, display: "block", marginBottom: 8}}
                    >
                      Mã: {f.tag}
                    </Text>
                    <Button
                      type="default"
                      size="small"
                      block
                      icon={<TableOutlined style={{color: "#52c41a"}} />}
                      onClick={() => handleCopyTable(f)}
                    >
                      Sao chép khung bảng
                    </Button>
                  </div>
                ))
              ) : (
                <Text type="secondary">Chưa có bảng động nào</Text>
              )}
            </Panel>
          </Collapse>
        </div>
      </div>

      {/* VÙNG CHỨA ONLYOFFICE EDITOR */}
      <div style={{flex: 1, height: "100%", position: "relative"}}>
        {config ? (
          <DocumentEditor
            id="docxEditor"
            documentServerUrl={ONLYOFFICE_SERVER_URL}
            config={config}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Text type="secondary">Không thể nạp cấu hình tài liệu</Text>
          </div>
        )}
      </div>

      {/* MODAL XEM TRƯỚC (PREVIEW) */}
      <Modal
        title={<b>Xem trước Mẫu Đề cương (Chỉ đọc)</b>}
        open={!!previewConfig}
        onCancel={() => setPreviewConfig(null)}
        width="85vw"
        footer={null}
        destroyOnClose
        style={{top: 20}}
      >
        {previewConfig && (
          <div style={{height: "80vh"}}>
            <DocumentEditor
              id="previewEditor"
              documentServerUrl={ONLYOFFICE_SERVER_URL}
              config={previewConfig}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TemplateEditor;
