import React, { useState } from "react";
import {
  Button,
  Input,
  Tag,
  Badge,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  SendOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined,
  FileWordOutlined,
  ColumnHeightOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const SyncStatusTag = ({ status }) => {
  if (status === "syncing") {
    return (
      <Tag color="blue" icon={<LoadingOutlined spin />}>
        Đang đồng bộ ngầm...
      </Tag>
    );
  }
  if (status === "error") {
    return (
      <Tag color="red" icon={<CloseCircleOutlined />}>
        Lỗi đồng bộ
      </Tag>
    );
  }
  return (
    <Tag color="green" icon={<CheckCircleOutlined />}>
      Đã tự động lưu
    </Tag>
  );
};

const TemplateStudioHeader = ({
  templateName,
  version,
  publishedAt,
  isActive,
  syncStatus,
  actionLoading,
  canRollback,
  previewUrl,
  onBack,
  onReload,
  onSaveManual,
  onUpdateTemplateName,
  onOpenAddMainModal,
  onOpenHeaderFooterModal,
  onOpenBulkSpacingModal,
  onRollbackBulkSpacing,
  onOpenDocxPreview,
  onDownloadDocx,
  onPublish,
}) => {
  const [localName, setLocalName] = useState(templateName || "");

  const handleBlur = () => {
    if (localName.trim() === templateName) return;
    onUpdateTemplateName(localName.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.target.blur();
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-xs mb-6 border border-gray-200 space-y-3">
      {/* Hàng 1: Tiêu đề Template, Metadata & Nhóm nút Hành động (Lưu, Ban hành, Xem trước) */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            title="Quay lại danh sách"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 font-medium text-sm">Studio Template:</span>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="font-bold text-gray-800 text-lg border-none shadow-none bg-transparent hover:bg-gray-100 focus:bg-white px-2 py-0 rounded max-w-sm"
              placeholder="Tên đề cương mẫu..."
            />
            {version && (
              <Tag color="blue">
                {String(version).toLowerCase().startsWith("v")
                  ? version
                  : `v${version}`}
              </Tag>
            )}
            {publishedAt ? (
              <Badge status="success" text="Đã ban hành" />
            ) : (
              <Badge status="warning" text="Bản nháp (Draft)" />
            )}
            {isActive ? (
              <Tag color="success">Active</Tag>
            ) : (
              <Tag color="default">InActive</Tag>
            )}
            <SyncStatusTag status={syncStatus} />
          </div>
        </div>

        {/* Nhóm nút chính: Xem trước DOCX, Tải về, Lưu và Ban hành */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={onOpenDocxPreview}
            loading={actionLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Xem trước DOCX
          </Button>

          {previewUrl && (
            <Button
              icon={<DownloadOutlined />}
              onClick={onDownloadDocx}
            >
              Tải DOCX
            </Button>
          )}

          <Button
            icon={<SaveOutlined />}
            onClick={onSaveManual}
            loading={actionLoading}
          >
            Lưu thay đổi
          </Button>

          <Popconfirm
            title="Xác nhận Ban hành Đề cương mẫu?"
            description="Tất cả Giảng viên đang mở đề cương của Template này sẽ nhận thông báo cập nhật qua SSE."
            okText="Đồng ý ban hành"
            cancelText="Hủy"
            onConfirm={onPublish}
          >
            <Button
              type="primary"
              className="bg-green-600 hover:bg-green-700"
              icon={<SendOutlined />}
              loading={actionLoading}
            >
              Ban hành
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* Hàng 2: Thanh công cụ thiết kế (Thêm phần lớn, Header & Footer, Spacing, Tải lại) */}
      <div className="pt-2.5 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
        <p className="text-xs text-gray-400 m-0">
          Hệ thống Block-based Template Studio chuẩn NĐ 30/2020 &amp; Mẫu HCMOU
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip title="Tải lại dữ liệu">
            <Button icon={<ReloadOutlined />} onClick={onReload} disabled={actionLoading} />
          </Tooltip>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={onOpenAddMainModal}
            className="border-indigo-400 text-indigo-600 hover:bg-indigo-50"
          >
            Thêm Phần lớn
          </Button>

          <Button
            icon={<FileWordOutlined />}
            onClick={onOpenHeaderFooterModal}
          >
            Header &amp; Footer
          </Button>

          <Button
            icon={<ColumnHeightOutlined />}
            onClick={onOpenBulkSpacingModal}
          >
            Khoảng cách hàng loạt
          </Button>

          {canRollback && (
            <Button
              danger
              icon={<UndoOutlined />}
              onClick={onRollbackBulkSpacing}
            >
              Hoàn tác spacing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateStudioHeader;
