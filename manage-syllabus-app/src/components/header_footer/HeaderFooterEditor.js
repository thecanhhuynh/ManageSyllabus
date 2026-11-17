import React, { useState, useEffect, useMemo } from "react";
import { Button, Space, message, Spin, Tag } from "antd";
import { isEqual } from "lodash";
import {
  SaveOutlined,
  ReloadOutlined,
  UndoOutlined,
  CloseOutlined,
  BankOutlined,
  EditOutlined,
} from "@ant-design/icons";
import HeaderFooterService from "../../services/headerFooterService";
import HeaderFormTab from "./HeaderFormTab";
import FooterFormTab from "./FooterFormTab";
import HeaderFooterPreview from "./HeaderFooterPreview";
import {
  DEFAULT_CONFIG,
  normalizeHeaderConfig,
  normalizeFooterConfig,
} from "./headerFooterDefaults";

export const HeaderFooterEditor = ({ templateId, onUpdated, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState("header");
  const [activeColIdx, setActiveColIdx] = useState(0);
  const [header, setHeader] = useState(DEFAULT_CONFIG.header);
  const [footer, setFooter] = useState(DEFAULT_CONFIG.footer);
  const [initialConfig, setInitialConfig] = useState(null);

  const loadData = async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      const res = await HeaderFooterService.getHeaderFooter(templateId);
      if (res) {
        const normHeader = normalizeHeaderConfig(res);
        const normFooter = normalizeFooterConfig(res);
        setHeader(normHeader);
        setFooter(normFooter);
        setInitialConfig({ header: normHeader, footer: normFooter });
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

  const isDirty = useMemo(() => {
    if (!initialConfig) return false;
    return !isEqual(header, initialConfig.header) || !isEqual(footer, initialConfig.footer);
  }, [header, footer, initialConfig]);

  const handleSave = async () => {
    if (!templateId || !isDirty) return;
    try {
      setSaving(true);
      const payload = { header, footer };
      await HeaderFooterService.updateHeaderFooter(templateId, payload);
      message.success("Lưu cấu hình Header/Footer thành công!");
      setInitialConfig({ header, footer });
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

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden rounded-xl">
      <div className="flex flex-wrap justify-between items-center gap-3 px-6 py-3.5 border-b border-gray-200 bg-white select-none">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-800 m-0">
              Quản lý Header & Footer Đề cương
            </h3>
            <Tag color="blue">Mẫu chuẩn HCMOU</Tag>
          </div>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            Tùy biến tiêu đề đơn vị, logo, phụ lục và bảng chữ ký số hóa kèm Live Preview chuẩn trang in A4
          </p>
        </div>

        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset} size="small">
            Khôi phục mặc định
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} size="small">
            Tải lại
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
            size="small"
          >
            Lưu cấu hình
          </Button>
          {onClose && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
              size="small"
              className="text-gray-400 hover:text-gray-600"
            />
          )}
        </Space>
      </div>

      <Spin spinning={loading} wrapperClassName="flex-1 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[78vh] max-h-[820px] overflow-hidden">
          <div className="w-full lg:w-[480px] xl:w-[500px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
            <div className="p-3.5 border-b border-gray-200 bg-white">
              <div className="grid grid-cols-2 p-1 bg-[#f0f2f5] rounded-lg border border-[#d9d9d9] gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("header")}
                  className={`py-2 px-3 text-sm rounded-[6px] transition-all flex items-center justify-center gap-2 w-full cursor-pointer select-none font-medium ${
                    activeTab === "header"
                      ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                      : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
                  }`}
                >
                  <BankOutlined className={activeTab === "header" ? "text-[#1677ff]" : "text-[#595959]"} />
                  <span>Header & Tiêu đề</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("footer")}
                  className={`py-2 px-3 text-sm rounded-[6px] transition-all flex items-center justify-center gap-2 w-full cursor-pointer select-none font-medium ${
                    activeTab === "footer"
                      ? "bg-white text-[#1677ff] border border-[#d9d9d9] shadow-xs"
                      : "bg-transparent text-[#595959] border border-transparent hover:text-[#1677ff]"
                  }`}
                >
                  <EditOutlined className={activeTab === "footer" ? "text-[#1677ff]" : "text-[#595959]"} />
                  <span>Footer & Bảng chữ ký</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "header" ? (
                <HeaderFormTab
                  header={header}
                  setHeader={setHeader}
                  onUploadLogo={handleUploadLogo}
                  onDeleteLogo={handleDeleteLogo}
                  uploadingLogo={uploadingLogo}
                />
              ) : (
                <FooterFormTab
                  footer={footer}
                  setFooter={setFooter}
                  activeColIdx={activeColIdx}
                  setActiveColIdx={setActiveColIdx}
                />
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-50/70 p-4 overflow-hidden">
            <HeaderFooterPreview
              header={header}
              footer={footer}
              activeTab={activeTab}
              activeColIdx={activeColIdx}
              onSelectColIdx={setActiveColIdx}
            />
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default HeaderFooterEditor;
