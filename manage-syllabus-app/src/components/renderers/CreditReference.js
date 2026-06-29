import React from "react";
import {Form, InputNumber, Row, Col, Input} from "antd";

const CreditReference = ({refPath}) => {
  return (
    <div className="py-6 px-4 bg-gray-50/50 rounded-xl border border-gray-100">
      <Form.Item name={[...refPath, "id"]} hidden>
        <Input />
      </Form.Item>

      <Row gutter={16} justify="space-around" align="middle">
        <Col
          span={8}
          className="text-center flex flex-col items-center border-r border-gray-200"
        >
          <Form.Item
            name={[...refPath, "number_theory"]}
            style={{marginBottom: 0}}
          >
            <InputNumber
              min={0}
              variant="borderless"
              controls={true}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800"
            />
          </Form.Item>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Lý thuyết (Tiết)
          </div>
        </Col>

        <Col
          span={8}
          className="text-center flex flex-col items-center border-r border-gray-200"
        >
          <Form.Item
            name={[...refPath, "number_practice"]}
            style={{marginBottom: 0}}
          >
            <InputNumber
              min={0}
              variant="borderless"
              controls={true}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800"
            />
          </Form.Item>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Thực hành (Tiết)
          </div>
        </Col>

        <Col span={8} className="text-center flex flex-col items-center">
          <Form.Item
            name={[...refPath, "hour_self_study"]}
            style={{marginBottom: 0}}
          >
            <InputNumber
              min={0}
              variant="borderless"
              controls={true}
              style={{width: 80, textAlign: "center"}}
              className="text-3xl font-bold text-gray-800"
            />
          </Form.Item>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Tự học (Giờ)
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CreditReference;
