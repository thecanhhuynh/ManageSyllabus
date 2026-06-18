import React from "react";
import {Form, InputNumber, Row, Col} from "antd";

const CreditReference = ({refPath}) => {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
      }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={[...refPath, "number_theory"]}
            label="Số TC Lý thuyết"
            style={{marginBottom: 0}}
          >
            <InputNumber min={0} style={{width: "100%"}} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={[...refPath, "number_practice"]}
            label="Số TC Thực hành"
            style={{marginBottom: 0}}
          >
            <InputNumber min={0} style={{width: "100%"}} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={[...refPath, "hour_self_study"]}
            label="Giờ tự học"
            style={{marginBottom: 0}}
          >
            <InputNumber min={0} style={{width: "100%"}} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default CreditReference;
