import React from "react";
import {Input, Select, Button, Row, Col, InputNumber, Progress} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const AssessmentPreview = ({item}) => {
  return (
    <div className="w-full opacity-80 pointer-events-none">
      {item.place_holder && (
        <div className="mb-4 font-bold text-gray-500 uppercase tracking-wider">
          {item.place_holder}
        </div>
      )}

      {/* Khối Progress Bar ảo */}
      <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-bold text-gray-600 uppercase">
            Tổng trọng số đánh giá
          </span>
          <span className="font-bold text-sm text-blue-600">50% / 100%</span>
        </div>
        <Progress percent={50} showInfo={false} status="active" size="small" />
      </div>

      {/* Khối Giao diện mẫu */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center">
          <span className="text-[12px] font-bold text-gray-600 uppercase">
            Đánh giá quá trình (Mẫu)
          </span>
          <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600">
            Tổng: 50%
          </span>
        </div>

        <div className="p-4">
          <Row
            gutter={12}
            className="items-end bg-gray-50/50 p-3 rounded-lg border border-gray-100 mb-3"
          >
            <Col span={7}>
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Phương pháp
              </div>
              <Input
                value="Thi tự luận (Ví dụ)"
                className="rounded-md text-[13px]"
                disabled
              />
            </Col>
            <Col span={5}>
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Thời gian
              </div>
              <Input
                prefix={<ClockCircleOutlined />}
                value="60 phút"
                className="rounded-md text-[13px]"
                disabled
              />
            </Col>
            <Col span={4}>
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Trọng số
              </div>
              <InputNumber
                value={50}
                addonAfter={<PercentageOutlined />}
                className="w-full text-[13px] rounded-md"
                disabled
              />
            </Col>
            <Col span={7}>
              <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                Đánh giá CLO
              </div>
              <Select
                mode="multiple"
                value={["CLO1.1"]}
                className="w-full rounded-md"
                disabled
              />
            </Col>
            <Col span={1} className="flex justify-center pb-1">
              <Button type="text" danger icon={<DeleteOutlined />} disabled />
            </Col>
          </Row>

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            className="h-10 border-gray-300 text-gray-500 w-full"
            disabled
          >
            Thêm phương pháp đánh giá
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentPreview;
