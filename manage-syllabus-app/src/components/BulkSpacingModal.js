import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Radio,
  Select,
  Divider,
  Row,
  Col,
  InputNumber,
  Checkbox,
  Button,
  message,
} from "antd";
import { EyeOutlined, CheckOutlined } from "@ant-design/icons";
import BlockService from "../services/blockService";

const BulkSpacingModal = ({
  open,
  templateId,
  mainSections = [],
  onApplied,
  onClose,
}) => {
  const [scope, setScope] = useState("all");
  const [scopeValue, setScopeValue] = useState(null);
  const [lineSpacing, setLineSpacing] = useState(2.0);
  const [spaceBefore, setSpaceBefore] = useState(4);
  const [spaceAfter, setSpaceAfter] = useState(4);
  const [overwrite, setOverwrite] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (open) return;
    setPreviewData(null);
    setScope("all");
    setScopeValue(null);
  }, [open]);

  useEffect(() => {
    setPreviewData(null);
  }, [scope, scopeValue, lineSpacing, spaceBefore, spaceAfter, overwrite]);

  const handleScopeChange = (e) => {
    setScope(e.target.value);
    setScopeValue(null);
    setPreviewData(null);
  };

  const getSpacingPayload = () => ({
    scope,
    scope_value: scopeValue,
    spacing: {
      line_spacing: lineSpacing,
      space_before_pt: spaceBefore,
      space_after_pt: spaceAfter,
    },
    overwrite,
  });

  const handleDryRun = async () => {
    if (!templateId) return;
    if (scope !== "all" && !scopeValue) {
      message.warning("Vui lòng chọn giá trị cho phạm vi.");
      return;
    }

    try {
      setPreviewLoading(true);
      const payload = { ...getSpacingPayload(), dry_run: true };
      const res = await BlockService.bulkSpacing(templateId, payload);
      setPreviewData(res);
      if (res?.updated_count === 0) {
        message.info("Không có sub-section nào khớp với phạm vi đã chọn.");
      }
    } catch {
      message.error("Không thể xem trước.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApply = async () => {
    if (!templateId) return;
    if (scope !== "all" && !scopeValue) {
      message.warning("Vui lòng chọn giá trị cho phạm vi.");
      return;
    }

    try {
      setApplyLoading(true);
      const payload = { ...getSpacingPayload(), dry_run: false };
      const res = await BlockService.bulkSpacing(templateId, payload);
      message.success(`Đã cập nhật khoảng cách cho ${res?.updated_count ?? 0} sub-section.`);
      if (onApplied) onApplied(res);
      onClose();
    } catch {
      message.error("Áp dụng thất bại.");
    } finally {
      setApplyLoading(false);
    }
  };

  const mainSectionOptions = (mainSections || []).map((ms) => ({
    value: ms.id,
    label: `${ms.position}. ${ms.name || ms.code}`,
  }));

  const blockTypeOptions = [
    { value: "text", label: "Text" },
    { value: "selection", label: "Selection" },
    { value: "reference", label: "Reference" },
    { value: "table", label: "Table" },
  ];

  return (
    <Modal
      title="📏 Khoảng cách hàng loạt"
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="preview"
          icon={<EyeOutlined />}
          onClick={handleDryRun}
          loading={previewLoading}
        >
          Xem trước
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckOutlined />}
          onClick={handleApply}
          loading={applyLoading}
        >
          Áp dụng
        </Button>,
      ]}
    >
      <Form layout="vertical">
        <Form.Item label="Phạm vi áp dụng">
          <Radio.Group value={scope} onChange={handleScopeChange}>
            <Radio value="all">Tất cả sub-section</Radio>
            <Radio value="main_section">Theo Main Section</Radio>
            <Radio value="block_type">Theo loại block</Radio>
          </Radio.Group>
        </Form.Item>

        {scope === "main_section" && (
          <Form.Item label="Chọn Main Section">
            <Select
              value={scopeValue}
              onChange={setScopeValue}
              options={mainSectionOptions}
              placeholder="Chọn mục lớn..."
            />
          </Form.Item>
        )}

        {scope === "block_type" && (
          <Form.Item label="Chọn loại block">
            <Select
              value={scopeValue}
              onChange={setScopeValue}
              options={blockTypeOptions}
              placeholder="Chọn loại block..."
            />
          </Form.Item>
        )}

        <Divider>Cấu hình khoảng cách</Divider>

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="Giãn dòng">
              <Select
                value={lineSpacing}
                onChange={setLineSpacing}
                options={[
                  { value: 1.0, label: "1.0" },
                  { value: 1.15, label: "1.15" },
                  { value: 1.5, label: "1.5" },
                  { value: 2.0, label: "2.0" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Trước (pt)">
              <InputNumber
                value={spaceBefore}
                onChange={(v) => setSpaceBefore(v ?? 0)}
                min={0}
                max={72}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sau (pt)">
              <InputNumber
                value={spaceAfter}
                onChange={(v) => setSpaceAfter(v ?? 0)}
                min={0}
                max={72}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Checkbox
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          >
            Ghi đè cấu hình hiện tại (bỏ chọn để chỉ áp dụng cho các field chưa cấu hình)
          </Checkbox>
        </Form.Item>
      </Form>

      {previewData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded max-h-64 overflow-y-auto">
          <div className="font-semibold text-sm mb-2 text-blue-900">
            Sẽ áp dụng cho {previewData.updated_count} sub-section:
          </div>
          <ul className="text-xs space-y-1">
            {(previewData.affected_blocks || []).map((b) => (
              <li key={b.id} className="text-gray-700">
                <span className="font-mono text-gray-500">[{b.code}]</span>{" "}
                <span className="font-medium">{b.name}</span>{" "}
                <span className="text-gray-400">({b.block_type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

export default BulkSpacingModal;
