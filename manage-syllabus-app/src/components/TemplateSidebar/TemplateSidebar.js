// src/components/TemplateSidebar/TemplateSidebar.jsx
import React from "react";
import {Collapse, Button, message, Empty, Tooltip} from "antd";
import {CopyOutlined, TableOutlined} from "@ant-design/icons";
import {copyScalarToClipboard} from "./copyScalarToClipboard";
import {copyTableToClipboard} from "./copyTableToClipboard";
const {Panel} = Collapse;

export const TemplateSidebar = ({controlFields}) => {
  // controlFields có dạng: { SCALAR: [...], TABLE_FIXED: [...], TABLE_DYNAMIC: [...] }

  const handleCopyScalar = async (tag, label) => {
    const success = await copyScalarToClipboard(tag);
    if (success) {
      message.success(
        <span>
          Đã copy thẻ <b>{label}</b>. Hãy nhấn Ctrl+V để dán.
        </span>,
      );
    } else {
      message.error("Lỗi khi copy. Vui lòng thử lại.");
    }
  };

  const handleCopyTable = async (field) => {
    const success = await copyTableToClipboard(field.tag, field.schema);
    if (success) {
      message.success(
        <span>
          Đã copy bảng <b>{field.label}</b>. Hãy nhấn Ctrl+V để dán.
        </span>,
      );
    } else {
      message.warning(
        "Trình duyệt chặn quyền ghi HTML. Vui lòng đảm bảo web chạy trên localhost hoặc HTTPS.",
      );
    }
  };

  if (!controlFields || Object.keys(controlFields).length === 0) {
    return <Empty description="Chưa có dữ liệu thẻ" style={{marginTop: 20}} />;
  }

  return (
    <div style={{padding: "10px", height: "100%", overflowY: "auto"}}>
      <div
        style={{
          marginBottom: 15,
          padding: 10,
          backgroundColor: "#e6f7ff",
          borderRadius: 4,
          border: "1px solid #91d5ff",
        }}
      >
        <b style={{color: "#096dd9"}}>💡 Hướng dẫn:</b>
        <br />
        Bấm <b>Sao chép</b> ở thẻ bên dưới, sau đó click chuột vào trang Word và
        bấm <b>Ctrl + V</b> (hoặc Click chuột phải - Dán) để chèn.
      </div>

      <Collapse defaultActiveKey={["1", "2"]} expandIconPosition="right">
        {/* NHÓM 1: THẺ VĂN BẢN (SCALAR) */}
        <Panel
          header={<strong style={{color: "#333"}}>Thẻ văn bản đơn</strong>}
          key="1"
        >
          {controlFields.SCALAR?.length > 0 ? (
            controlFields.SCALAR.map((f) => (
              <div
                key={f.tag}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <Tooltip title={`Mã hệ thống: ${f.tag}`}>
                  <span style={{fontSize: "13px"}}>{f.label}</span>
                </Tooltip>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined style={{color: "#1890ff"}} />}
                  onClick={() => handleCopyScalar(f.tag, f.label)}
                >
                  Sao chép
                </Button>
              </div>
            ))
          ) : (
            <span style={{color: "#999"}}>Không có thẻ văn bản</span>
          )}
        </Panel>

        {/* NHÓM 2: BẢNG BIỂU HỆ THỐNG (FIXED TABLE) */}
        <Panel
          header={<strong style={{color: "#333"}}>Bảng biểu (Hệ thống)</strong>}
          key="2"
        >
          {controlFields.TABLE_FIXED?.length > 0 ? (
            controlFields.TABLE_FIXED.map((f) => (
              <div
                key={f.tag}
                style={{
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: "#fafafa",
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{fontWeight: "500", marginBottom: 8, fontSize: "13px"}}
                >
                  {f.label}
                </div>
                <Button
                  type="primary"
                  ghost
                  size="small"
                  block
                  icon={<TableOutlined />}
                  onClick={() => handleCopyTable(f)}
                >
                  Copy cả bảng
                </Button>
              </div>
            ))
          ) : (
            <span style={{color: "#999"}}>Không có bảng hệ thống</span>
          )}
        </Panel>

        {/* NHÓM 3: BẢNG TỰ ĐỊNH NGHĨA (DYNAMIC TABLE) */}
        <Panel
          header={<strong style={{color: "#333"}}>Bảng tự định nghĩa</strong>}
          key="3"
        >
          {controlFields.TABLE_DYNAMIC?.length > 0 ? (
            controlFields.TABLE_DYNAMIC.map((f) => (
              <div
                key={f.tag}
                style={{
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: "#f6ffed",
                  border: "1px dashed #b7eb8f",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontWeight: "500",
                    marginBottom: 8,
                    fontSize: "13px",
                    color: "#389e0d",
                  }}
                >
                  {f.label}
                </div>
                <Button
                  type="default"
                  size="small"
                  block
                  icon={<TableOutlined style={{color: "#52c41a"}} />}
                  onClick={() => handleCopyTable(f)}
                >
                  Copy bảng động
                </Button>
              </div>
            ))
          ) : (
            <span style={{color: "#999"}}>Không có bảng tự định nghĩa</span>
          )}
        </Panel>
      </Collapse>
    </div>
  );
};
