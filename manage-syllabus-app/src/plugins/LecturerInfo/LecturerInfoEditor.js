import React from "react";
import {Form, Input, Row, Col} from "antd";
import {MailOutlined, BankOutlined} from "@ant-design/icons";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const LecturerInfoEditor = ({item, basePath}) => {
  const labelOverrides = useSyllabusStore((state) => state.labelOverrides) || {};
  const labels = labelOverrides.lecturer_info || {};
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore((state) => state.updateCustomValue);

  const lecturerCustomCols = customColumns.filter(
    (col) => col.table_code === "lecturer_info" && col.is_active !== false,
  );

  const LECTURER_FIELDS = [
    {
      key: "first_name",
      label: labels.col_fullname || "Họ và tên đệm",
      span: 12,
      className: "p-0 text-sm font-normal text-gray-800",
    },
    {
      key: "last_name",
      label: labels.col_name || "Tên",
      span: 12,
      className: "p-0 text-sm font-normal text-gray-800",
    },
    {
      key: "email",
      label: labels.col_email || "Email Address",
      span: 12,
      prefix: <MailOutlined className="text-gray-400 mr-1" />,
      className: "p-0 text-sm font-normal text-gray-700",
    },
    {
      key: "faculty",
      label: labels.col_workplace || "Khoa / Đơn vị",
      span: 12,
      className: "p-0 text-sm font-normal text-gray-800",
    },
    {
      key: "room",
      label: labels.col_room || "Văn phòng / Phòng làm việc",
      span: 24,
      prefix: <BankOutlined className="text-gray-400 mr-1" />,
      placeholder: "Chưa có thông tin phòng làm việc",
      className: "p-0 text-sm font-normal text-gray-800",
    },
  ];

  const lecturerData = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.reference_data ?? {},
  );

  return (
    <div className="w-full py-2">
      <Row gutter={[24, 12]}>
        {LECTURER_FIELDS.map((field) => (
          <Col key={field.key} span={field.span}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {field.label}
            </div>
            <Form.Item className="mb-0">
              <Input
                readOnly
                variant="borderless"
                value={lecturerData[field.key] ?? ""}
                prefix={field.prefix}
                placeholder={field.placeholder}
                className={field.className}
              />
            </Form.Item>
          </Col>
        ))}

        {lecturerCustomCols.map((col) => {
          const val = customValues[col.id] ?? col.default_value ?? "";
          return (
            <Col key={col.id} span={12}>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {col.column_label}
              </div>
              <Form.Item className="mb-0">
                <Input
                  placeholder={`Nhập ${col.column_label}...`}
                  value={val}
                  onChange={(e) => updateCustomValue(col.id, e.target.value)}
                  className="rounded-md text-sm font-normal text-gray-700"
                />
              </Form.Item>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default LecturerInfoEditor;
