import React, { useState, useEffect } from "react";
import { Tabs, Button, Space, message, Spin } from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import HeaderFooterService from "../services/headerFooterService";
import HeaderFormTab from "./header_footer/HeaderFormTab";
import FooterFormTab from "./header_footer/FooterFormTab";
import HeaderFooterPreview from "./header_footer/HeaderFooterPreview";
import {
  DEFAULT_CONFIG,
  normalizeHeaderConfig,
  normalizeFooterConfig,
} from "./header_footer/headerFooterDefaults";

const HeaderFooterEditor = ({ templateId, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [header, setHeader] = useState(DEFAULT_CONFIG.header);
  const [footer, setFooter] = useState(DEFAULT_CONFIG.footer);

  const loadData = async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      const res = await HeaderFooterService.getHeaderFooter(templateId);
      if (res) {
        setHeader(normalizeHeaderConfig(res));
        setFooter(normalizeFooterConfig(res));
      }
    } catch {
      message.error("Không thể tải cấu hình Header/Footer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const handleSave = async () => {
    if (!templateId) return;
    try {
      setSaving(true);
      const payload = { header, footer };
      await HeaderFooterService.updateHeaderFooter(templateId, payload);
      message.success("Lưu cấu hình Header/Footer thành công!");
      if (onUpdated) onUpdated(payload);
    } catch {
      message.error("Lưu cấu hình Header/Footer thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setHeader(DEFAULT_CONFIG.header);
    setFooter(DEFAULT_CONFIG.footer);
    message.info("Đã khôi phục cấu hình Header/Footer mặc định");
  };

  const handleUploadLogo = async (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file hình ảnh (PNG, JPG, WEBP)!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 <= 5;
    if (!isLt5M) {
      message.error("Dung lượng file tối đa là 5MB!");
      return false;
    }

    try {
      setUploadingLogo(true);
      const res = await HeaderFooterService.uploadLogo(templateId, file);
      if (res?.logo_url) {
        setHeader((prev) => ({ ...prev, logo_url: res.logo_url }));
        message.success("Tải lên logo thành công!");
      }
    } catch {
      message.error("Tải lên logo thất bại");
    } finally {
      setUploadingLogo(false);
    }
    return false;
  };

  const handleDeleteLogo = async () => {
    try {
      setUploadingLogo(true);
      await HeaderFooterService.deleteLogo(templateId);
      setHeader((prev) => ({ ...prev, logo_url: null }));
      message.success("Đã xóa logo");
    } catch {
      message.error("Xóa logo thất bại");
    } finally {
      setUploadingLogo(false);
    }
  };

  const tabItems = [
    {
      key: "header",
      label: "🏠 Header & Tiêu đề",
      children: (
        <HeaderFormTab
          header={header}
          setHeader={setHeader}
          onUploadLogo={handleUploadLogo}
          onDeleteLogo={handleDeleteLogo}
          uploadingLogo={uploadingLogo}
        />
      ),
    },
    {
      key: "footer",
      label: "📄 Footer & Chữ ký",
      children: <FooterFormTab footer={footer} setFooter={setFooter} />,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
      {/* Top action header */}
      <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-800 m-0">
            ⚙️ Cấu hình Header & Footer (Chuẩn Mẫu HCMOU - Mục 8.3)
          </h3>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            Tùy biến logo, tiêu ngữ đơn vị, tiêu đề đề cương và bảng chữ ký kèm Live Preview
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Tải lại
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            Khôi phục mặc định
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            Lưu cấu hình
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* Split-view: Left (Form) - Right (Live Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* Cột trái: Form điều khiển */}
          <div className="overflow-y-auto pr-1">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              type="card"
            />
          </div>

          {/* Cột phải: Live Preview */}
          <div className="overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 bg-slate-50/50 p-4 rounded-lg">
            <HeaderFooterPreview
              header={header}
              footer={footer}
              activeTab={activeTab}
            />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default HeaderFooterEditor;
