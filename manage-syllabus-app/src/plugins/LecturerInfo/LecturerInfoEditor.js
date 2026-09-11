import React from "react";
import {Form, Input, Row, Col} from "antd";
import {MailOutlined, BankOutlined} from "@ant-design/icons";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const LecturerInfoEditor = ({item, basePath}) => {
  const refPath = [...basePath, "reference_data"];

  const LECTURER_FIELDS = [
    {
      key: "first_name",
      label: "Họ và tên đệm",
      span: 12,
      className: "p-0 text-sm font-medium text-gray-800",
    },
    {
      key: "last_name",
      label: "Tên",
      span: 12,
      className: "p-0 text-sm font-medium text-gray-800",
    },
    {
      key: "email",
      label: "Email Address",
      span: 12,
      prefix: <MailOutlined className="text-black-500 mr-1" />,
      className: "p-0 text-sm font-medium text-black-600",
    },
    {
      key: "faculty",
      label: "Khoa / Đơn vị",
      span: 12,
      className: "p-0 text-sm font-medium text-gray-800",
    },
    {
      key: "room",
      label: "Văn phòng / Phòng làm việc",
      span: 24,
      prefix: <BankOutlined className="text-gray-400 mr-1" />,
      placeholder: "Chưa có thông tin phòng làm việc",
      className: "p-0 text-sm font-medium text-gray-800",
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
      </Row>
    </div>
  );
};

export default LecturerInfoEditor;
