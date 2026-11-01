import React from "react";
import {Form, InputNumber, Row, Col, Input} from "antd";
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
  const labelOverrides = useSyllabusStore((state) => state.labelOverrides) || {};
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore((state) => state.updateCustomValue);

  const creditLabels = labelOverrides.credit || {};
  const creditCustomCols = customColumns.filter(
    (col) => col.table_code === "credit" && col.is_active !== false,
  );

  const totalCredits =
    Number(creditData.number_theory ?? 0) + Number(creditData.number_practice ?? 0);

  const handleFieldChange = (fieldName, val) => {
    updateLocalBlock(item.code, {
      reference_data: {
        ...creditData,
        [fieldName]: Number(val ?? 0),
      },
    });
  };

  const totalCols = STANDARD_FIELDS.length + creditCustomCols.length;
  const colSpan = Math.floor(24 / totalCols);

  const renderStandardField = (field, index) => {
    const isLast = index === totalCols - 1;
    const displayLabel = creditLabels[field.key] || field.fallbackLabel;

    return (
      <Col
        key={field.key}
        span={colSpan}
        className={`text-center flex flex-col items-center ${
          !isLast ? "border-r border-gray-200" : ""
        }`}
      >
        <Form.Item style={{marginBottom: 0}}>
          {field.isComputed ? (
            <InputNumber
              variant="borderless"
              readOnly
              controls={false}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800 cursor-default"
              value={totalCredits}
            />
          ) : (
            <InputNumber
              min={field.min ?? 0}
              variant="borderless"
              controls={true}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800"
              value={creditData[field.key] ?? 0}
              onChange={(val) => handleFieldChange(field.key, val)}
            />
          )}
        </Form.Item>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">
          {displayLabel}
        </div>
      </Col>
    );
  };

  const renderCustomField = (col, customIndex) => {
    const overallIndex = STANDARD_FIELDS.length + customIndex;
    const isLast = overallIndex === totalCols - 1;
    const val = customValues[col.id] ?? col.default_value ?? "";

    return (
      <Col
        key={col.id || col.column_key}
        span={colSpan}
        className={`text-center flex flex-col items-center ${
          !isLast ? "border-r border-gray-200" : ""
        }`}
      >
        <Form.Item style={{marginBottom: 0}}>
          {col.column_type === "int" || col.column_type === "decimal" ? (
            <InputNumber
              variant="borderless"
              controls={true}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800"
              value={val !== "" ? Number(val) : 0}
              onChange={(numVal) => updateCustomValue(col.id, numVal ?? 0)}
            />
          ) : (
            <Input
              variant="borderless"
              style={{width: 140, textAlign: "center"}}
              className="text-base font-normal text-gray-700"
              placeholder="Nhập nội dung..."
              value={val}
              onChange={(e) => updateCustomValue(col.id, e.target.value)}
            />
          )}
        </Form.Item>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center">
          {col.column_label}
        </div>
      </Col>
    );
  };

  return (
    <div className="py-6 px-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <Row gutter={16} justify="space-around" align="middle">
        {STANDARD_FIELDS.map(renderStandardField)}
        {creditCustomCols.map(renderCustomField)}
      </Row>
    </div>
  );
};

export default CreditEditor;
