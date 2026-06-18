import React from "react";
import {Form, Input, Button, Tabs, Row, Col} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import style from "./style.css";
const {TextArea} = Input;

const CourseLearningOutcomeReference = ({refPath}) => {
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
        {(coFields, {add: addCO, remove: removeCO}) => {
          const tabItems = coFields.map((coField, coIndex) => ({
            key: coField.key.toString(),
            label: <span style={{fontWeight: 600}}>CO{coIndex + 1}</span>,
            children: (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: "8px",
                }}
              >
                <Form.List name={[coField.name, "clos"]}>
                  {(cloFields, {add: addCLO, remove: removeCLO}) => (
                    <>
                      {cloFields.map((cloField, cloIndex) => (
                        <Row
                          key={cloField.key}
                          gutter={16}
                          style={{marginBottom: 12}}
                        >
                          <Col span={22}>
                            <Form.Item
                              {...cloField}
                              name={[cloField.name, "content"]}
                              label={
                                <span
                                  style={{fontWeight: 500, color: "#1890ff"}}
                                >
                                  CLO {coIndex + 1}.{cloIndex + 1}
                                </span>
                              }
                              rules={[
                                {
                                  required: true,
                                  message: "Vui lòng nhập nội dung CLO",
                                },
                              ]}
                              style={{marginBottom: 0}}
                            >
                              <TextArea
                                autoSize={{minRows: 2, maxRows: 4}}
                                placeholder="VD: Cài đặt thành công thuật toán..."
                              />
                            </Form.Item>
                          </Col>

                          <Col
                            span={2}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: "28px",
                            }}
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeCLO(cloField.name)}
                            />
                          </Col>
                        </Row>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => addCLO()}
                        block
                        icon={<PlusOutlined />}
                        style={{marginTop: 8}}
                      >
                        Thêm CLO cho CO{coIndex + 1}
                      </Button>
                    </>
                  )}
                </Form.List>

                <div style={{marginTop: 24, textAlign: "right"}}>
                  <Button
                    danger
                    type="text"
                    onClick={() => removeCO(coField.name)}
                  >
                    Xóa toàn bộ CO{coIndex + 1}
                  </Button>
                </div>
              </div>
            ),
          }));

          return (
            <>
              {coFields.length > 0 ? (
                // Gắn className "chrome-tabs" vào đây
                <Tabs className="chrome-tabs" type="card" items={tabItems} />
              ) : (
                <div
                  style={{textAlign: "center", padding: "20px", color: "#999"}}
                >
                  Chưa có Mục tiêu (CO) nào được thiết lập.
                </div>
              )}

              <Button
                type="primary"
                ghost
                onClick={() => addCO({clos: []})}
                style={{marginTop: 16}}
                icon={<PlusOutlined />}
              >
                Thêm Tab CO mới
              </Button>
            </>
          );
        }}
      </Form.List>
    </div>
  );
};

export default CourseLearningOutcomeReference;
