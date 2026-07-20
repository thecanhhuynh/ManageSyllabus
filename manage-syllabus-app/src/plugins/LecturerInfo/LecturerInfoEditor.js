import React from "react";
import {Form, Input, Row, Col} from "antd";
import {MailOutlined, BankOutlined} from "@ant-design/icons";

const LecturerInfoEditor = ({item, basePath}) => {
  const refPath = [...basePath, "reference_data"];
  return (
    <div className="w-full py-2">
      <Row gutter={[24, 12]}>
        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Họ và tên đệm
          </div>
          <Form.Item name={[...refPath, "first_name"]} className="mb-0">
            <Input
              readOnly
              variant="borderless"
              className="p-0 text-sm font-medium text-gray-800"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Tên
          </div>
          <Form.Item name={[...refPath, "last_name"]} className="mb-0">
            <Input
              readOnly
              variant="borderless"
              className="p-0 text-sm font-medium text-gray-800"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Email Address
          </div>
          <Form.Item name={[...refPath, "email"]} className="mb-0">
            <Input
              readOnly
              variant="borderless"
              prefix={<MailOutlined className="text-blue-500 mr-1" />}
              className="p-0 text-sm font-medium text-blue-600"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Khoa / Đơn vị
          </div>
          <Form.Item name={[...refPath, "faculty"]} className="mb-0">
            <Input
              readOnly
              variant="borderless"
              className="p-0 text-sm font-medium text-gray-800"
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Văn phòng / Phòng làm việc
          </div>
          <Form.Item name={[...refPath, "room"]} className="mb-0">
            <Input
              readOnly
              variant="borderless"
              prefix={<BankOutlined className="text-gray-400 mr-1" />}
              placeholder="Chưa có thông tin phòng làm việc"
              className="p-0 text-sm font-medium text-gray-800"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default LecturerInfoEditor;
