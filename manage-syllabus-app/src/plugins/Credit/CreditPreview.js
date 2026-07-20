import React from "react";
import {Row, Col, InputNumber} from "antd";

const CreditPreview = ({item}) => {
  return (
    <div className="py-6 px-4 bg-gray-50/50 rounded-xl border border-gray-100 pointer-events-none opacity-80">
      {item.place_holder && (
        <div className="text-center mb-4 font-bold text-gray-500 uppercase">
          {item.place_holder}
        </div>
      )}
      <Row gutter={16} justify="space-around" align="middle">
        <Col
          span={8}
          className="text-center flex flex-col items-center border-r border-gray-200"
        >
          <InputNumber
            value={3}
            variant="borderless"
            className="text-3xl font-bold text-gray-800"
            disabled
            style={{width: 80, textAlign: "center"}}
          />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Lý thuyết (Tiết)
          </div>
        </Col>

        <Col
          span={8}
          className="text-center flex flex-col items-center border-r border-gray-200"
        >
          <InputNumber
            value={1}
            variant="borderless"
            className="text-3xl font-bold text-gray-800"
            disabled
            style={{width: 80, textAlign: "center"}}
          />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Thực hành (Tiết)
          </div>
        </Col>

        <Col span={8} className="text-center flex flex-col items-center">
          <InputNumber
            value={90}
            variant="borderless"
            className="text-3xl font-bold text-gray-800"
            disabled
            style={{width: 80, textAlign: "center"}}
          />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Tự học (Giờ)
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CreditPreview;
