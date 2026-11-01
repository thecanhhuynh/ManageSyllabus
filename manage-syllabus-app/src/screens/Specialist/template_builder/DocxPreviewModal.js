import React from "react";
import { Modal, Button } from "antd";
import { FileWordOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";

const DocxPreviewModal = ({
  open,
  onClose,
  previewUrl,
  hasRendered,
  actionLoading,
  onRenderDocx,
  onDownloadDocx,
  docxContainerRef,
}) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      width="90vw"
      centered
      zIndex={1100}
      style={{ top: 20 }}
      styles={{ body: { height: "82vh", padding: "12px", overflow: "hidden" } }}
      title={
        <div className="flex items-center justify-between pr-8">
          <span className="font-bold text-gray-800 flex items-center gap-2">
            <FileWordOutlined className="text-blue-600" />
            Bản xem trước đề cương DOCX
          </span>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onDownloadDocx}
            disabled={!previewUrl}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Tải xuống DOCX
          </Button>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={onDownloadDocx}
          disabled={!previewUrl}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Tải xuống DOCX
        </Button>,
      ]}
    >
      <div style={{ height: "72vh" }}>
        {!hasRendered && !actionLoading && (
          <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed border-gray-300">
            <FileWordOutlined className="text-4xl text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 font-medium">
              Chưa có bản xem trước DOCX.
            </p>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={onRenderDocx}
              loading={actionLoading}
            >
              Render DOCX ngay
            </Button>
          </div>
        )}
        <div
          className={`docx-preview-scroll-container ${!hasRendered ? "hidden" : "block"}`}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "700px",
            maxHeight: "800px",
            overflow: "auto",
            padding: "20px",
            backgroundColor: "#f0f2f5",
            boxSizing: "border-box",
          }}
        >
          <div
            ref={docxContainerRef}
            className="docx-preview-container"
            style={{
              margin: "0 auto",
              width: "max-content",
              minWidth: "100%",
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DocxPreviewModal;
