import React from "react";
import {Form, InputNumber, Row, Col, Input, Tag} from "antd";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const STANDARD_FIELDS = [
  {
    key: "credit_total",
    fallbackLabel: "Tổng số/Total",
    isComputed: true,
  },
  {
    key: "number_theory",
    fallbackLabel: "Lý thuyết/Theory",
    isComputed: false,
    min: 0,
  },
  {
    key: "number_practice",
    fallbackLabel: "Thực hành/Practice",
    isComputed: false,
    min: 0,
  },
  {
    key: "hour_self_study",
    fallbackLabel: "Số giờ tự học/Self-study",
    isComputed: false,
    min: 0,
  },
];

const CreditEditor = ({item}) => {
  const creditData = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.reference_data ?? {},
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);
  const labelOverrides =
    useSyllabusStore((state) => state.labelOverrides) || {};
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore(
    (state) => state.updateCustomValue,
  );

  const creditLabels = labelOverrides.credit || {};
  const creditCustomCols = customColumns.filter(
    (col) => col.table_code === "credit" && col.is_active !== false,
  );

  const totalCredits =
    Number(creditData.number_theory ?? 0) +
    Number(creditData.number_practice ?? 0);

  const handleFieldChange = (fieldName, val) => {
    updateLocalBlock(item.code, {
      reference_data: {
        ...creditData,
        [fieldName]: Number(val ?? 0),
      },
    });
  };

  const renderStandardField = (field, index) => {
    const isLast = index === STANDARD_FIELDS.length - 1;
    const displayLabel = creditLabels[field.key] || field.fallbackLabel;

    return (
      <Col
        key={field.key}
        flex="1"
        className={`flex flex-col items-center justify-center text-center px-1.5 py-0.5 ${
          !isLast ? "border-r border-gray-200/70" : ""
        }`}
      >
        <div className="h-7 w-full flex items-center justify-center text-center">
          <Form.Item
            style={{
              marginBottom: 0,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {field.isComputed ? (
              <InputNumber
                variant="borderless"
                readOnly
                controls={false}
                style={{textAlign: "center"}}
                className="credit-value-input text-base font-semibold text-gray-800 cursor-default text-center"
                value={totalCredits}
              />
            ) : (
              <InputNumber
                min={field.min ?? 0}
                variant="borderless"
                controls={false}
                style={{textAlign: "center"}}
                className="credit-value-input text-base font-semibold text-gray-800 text-center"
                value={creditData[field.key] ?? 0}
                onChange={(val) => handleFieldChange(field.key, val)}
              />
            )}
          </Form.Item>
        </div>
        <div className="min-h-[18px] w-full flex items-start justify-center text-center mt-0.5">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider text-center leading-tight">
            {displayLabel}
          </span>
        </div>
      </Col>
    );
  };

  const renderCustomField = (col) => {
    const val = customValues[col.id] ?? col.default_value ?? "";
    const isNumber = col.column_type === "int" || col.column_type === "decimal";

    return (
      <Col xs={24} md={12} key={col.id || col.column_key}>
        <div className="bg-white p-2.5 rounded-lg border border-gray-200/90 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between h-full">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span
              className="text-xs font-semibold text-gray-700 truncate"
              title={col.column_label}
            >
              {col.column_label}
            </span>
            <Tag
              color={isNumber ? "blue" : "default"}
              className="text-[10px] m-0 px-1.5 py-0 leading-tight flex-shrink-0"
            >
              {col.column_type === "int"
                ? "Số nguyên"
                : col.column_type === "decimal"
                  ? "Thập phân"
                  : "Đoạn văn"}
            </Tag>
          </div>
          <div>
            {isNumber ? (
              <InputNumber
                className="w-full text-sm"
                size="small"
                placeholder={`Nhập ${col.column_label.toLowerCase()}...`}
                value={val !== "" ? Number(val) : undefined}
                onChange={(numVal) => updateCustomValue(col.id, numVal ?? 0)}
              />
            ) : (
              <Input.TextArea
                autoSize={{minRows: 2, maxRows: 4}}
                className="w-full text-xs text-gray-700 rounded-md"
                placeholder={`Nhập ${col.column_label.toLowerCase()}...`}
                value={val}
                onChange={(e) => updateCustomValue(col.id, e.target.value)}
              />
            )}
          </div>
        </div>
      </Col>
    );
  };

  return (
    <div className="credit-stat-container w-full">
      {/* 4 CHỈ SỐ CỐT LÕI (Loại bỏ khung xám thừa, hiển thị trực tiếp và tinh gọn trên nền card) */}
      <Row
        align="stretch"
        className="w-full flex-nowrap m-0 py-2"
      >
        {STANDARD_FIELDS.map(renderStandardField)}
      </Row>

      {/* CÁC CỘT TÙY BIẾN */}
      {creditCustomCols.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Thông tin bổ sung ({creditCustomCols.length}/10 mục)
            </span>
          </div>
          <Row gutter={[10, 10]}>{creditCustomCols.map(renderCustomField)}</Row>
        </div>
      )}

      {totalCredits <= 0 && (
        <div className="text-[11px] text-amber-600 mt-2 text-center italic font-medium">
          * Lưu ý: Tổng số tín chỉ học phần cần lớn hơn 0 theo quy định đào tạo.
        </div>
      )}
    </div>
  );
};

export default CreditEditor;
