import React from "react";
import {Form, Input, Row, Col} from "antd";

const LecturerInfoReference = ({refPath}) => {
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
        <Col span={12}>
          <Form.Item name={[...refPath, "first_name"]} label="Họ và tên đệm">
            <Input readOnly variant="filled" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={[...refPath, "last_name"]} label="Tên">
            <Input readOnly variant="filled" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={[...refPath, "email"]}
            label="Email"
            style={{marginBottom: 0}}
          >
            <Input readOnly variant="filled" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={[...refPath, "faculty"]}
            label="Khoa/Đơn vị phụ trách"
            style={{marginBottom: 0}}
          >
            <Input readOnly variant="filled" />
          </Form.Item>
        </Col>

        <Col span={24} style={{marginTop: 16}}>
          <Form.Item
            name={[...refPath, "room"]}
            label="Phòng làm việc (nếu có)"
            style={{marginBottom: 0}}
          >
            <Input
              readOnly
              variant="filled"
              placeholder="Chưa có thông tin phòng làm việc"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default LecturerInfoReference;
