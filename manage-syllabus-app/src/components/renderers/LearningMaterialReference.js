import React from "react";
import {Form, Input, Select, Button, Row, Col} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";

const LearningMaterialReference = ({refPath}) => {
  // Bạn có thể fetch danh sách loại tài liệu từ API giống như các phần trước
  // Ở đây tạo tạm mảng tĩnh dựa trên dữ liệu JSON của bạn
  const materialTypeOptions = [
    {label: "Sách giáo trình", value: "Sách giáo trình"},
    {label: "Sách tham khảo", value: "Sách tham khảo"},
    {label: "Tài liệu trực tuyến", value: "Tài liệu trực tuyến"},
    {label: "Khác", value: "Khác"},
  ];

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
      }}
    >
      <Form.List name={refPath}>
        {(fields, {add, remove}) => (
          <>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "8px",
                marginBottom: fields.length > 0 ? "16px" : "0",
              }}
            >
              {fields.map((field) => (
                <Row
                  key={field.key}
                  gutter={12}
                  align="bottom"
                  style={{
                    marginBottom: 12,
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "6px",
                  }}
                >
                  <Col span={14}>
                    <Form.Item
                      {...field}
                      name={[field.name, "name"]}
                      label="Tên tài liệu / Sách"
                      rules={[
                        {required: true, message: "Vui lòng nhập tên tài liệu"},
                      ]}
                      style={{marginBottom: 0}}
                    >
                      <Input placeholder="VD: Introduction to Algorithms - CLRS" />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      {...field}
                      name={[field.name, "type_name"]}
                      label="Loại tài liệu"
                      rules={[{required: true, message: "Vui lòng chọn loại"}]}
                      style={{marginBottom: 0}}
                    >
                      <Select
                        options={materialTypeOptions}
                        placeholder="Chọn phân loại..."
                      />
                    </Form.Item>
                  </Col>

                  <Col span={2} style={{textAlign: "center"}}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Col>
                </Row>
              ))}
            </div>

            <Form.Item style={{marginBottom: 0}}>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Thêm tài liệu học tập
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default LearningMaterialReference;
