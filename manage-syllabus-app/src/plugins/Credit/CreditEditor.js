import React from "react";
import {Form, InputNumber, Row, Col, Input} from "antd";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const CreditEditor = ({item, basePath}) => {
  const refPath = [...basePath, "reference_data"];
  const CREDIT_FIELDS = [
    {
      key: "number_theory",
      label: "Lý thuyết (Tiết)",
      min: 0,
    },
    {
      key: "number_practice",
      label: "Thực hành (Tiết)",
      min: 0,
    },
    {
      key: "hour_self_study",
      label: "Tự học (Giờ)",
      min: 0,
    },
  ];

  const creditData = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.reference_data ?? {},
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  const handleFieldChange = (fieldName, val) => {
    updateLocalBlock(item.code, {
      reference_data: {
        ...creditData,
        [fieldName]: Number(val ?? 0),
      },
    });
  };

  const colSpan = Math.floor(24 / CREDIT_FIELDS.length);
  return (
    <div className="py-6 px-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <Row gutter={16} justify="space-around" align="middle">
        {CREDIT_FIELDS.map((field, index) => {
          const isLast = index === CREDIT_FIELDS.length - 1;
          return (
            <Col
              key={field.key}
              span={colSpan}
              className={`text-center flex flex-col items-center ${
                !isLast ? "border-r border-gray-200" : ""
              }`}
            >
              <Form.Item style={{marginBottom: 0}}>
                <InputNumber
                  min={field.min ?? 0}
                  variant="borderless"
                  controls={true}
                  style={{width: 80, textAlign: "center"}}
                  className="text-3xl font-bold text-gray-800"
                  value={creditData[field.key] ?? 0}
                  onChange={(val) => handleFieldChange(field.key, val)}
                />
              </Form.Item>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {field.label}
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default CreditEditor;
