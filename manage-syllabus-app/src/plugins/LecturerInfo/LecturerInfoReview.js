import React from "react";
import {Input, Row, Col} from "antd";
import {MailOutlined, BankOutlined} from "@ant-design/icons";

const LecturerInfoPreview = ({item}) => {
  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  return (
    <div className="w-full py-2 opacity-80 pointer-events-none">
      {CustomLabel}

      <Row gutter={[24, 12]}>
        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Họ và tên đệm
          </div>
          <Input
            disabled
            variant="borderless"
            value="Nguyễn Văn"
            className="p-0 text-sm font-medium text-gray-800"
          />
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Tên
          </div>
          <Input
            disabled
            variant="borderless"
            value="An"
            className="p-0 text-sm font-medium text-gray-800"
          />
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Email Address
          </div>
          <Input
            disabled
            variant="borderless"
            value="nguyenvanan@ou.edu.vn"
            prefix={<MailOutlined className="text-500 mr-1" />}
            className="p-0 text-sm font-medium text-blue-600"
          />
        </Col>

        <Col span={12}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Khoa / Đơn vị
          </div>
          <Input
            disabled
            variant="borderless"
            value="Khoa Công nghệ thông tin"
            className="p-0 text-sm font-medium text-gray-800"
          />
        </Col>

        <Col span={24}>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Văn phòng / Phòng làm việc
          </div>
          <Input
            disabled
            variant="borderless"
            value="Phòng A203"
            prefix={<BankOutlined className="text-gray-400 mr-1" />}
            className="p-0 text-sm font-medium text-gray-800"
          />
        </Col>
      </Row>
    </div>
  );
};

export default LecturerInfoPreview;
