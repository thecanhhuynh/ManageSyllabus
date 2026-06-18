import React, {useState, useEffect} from "react";
import {Form, Input, Select, Button, Row, Col, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";

const {TextArea} = Input;

const ObjectiveOutcomeReference = ({refPath}) => {
  const [ploOptions, setPloOptions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const fetchPLOs = async () => {
    try {
      setIsFetching(true);
      const res = await authApis().get(
        endpoints["programme-learning-outcomes"],
      );
      const data = res.data;

      setPloOptions(
        data.map((plo) => ({
          label: (
            <Tooltip title={plo.description} placement="right">
              <span>
                {plo.name} - {plo.description.substring(0, 30)}...
              </span>
            </Tooltip>
          ),
          value: plo.id,
          tagLabel: plo.name,
        })),
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetching(false);
    }
  };
  useEffect(() => {
    fetchPLOs();
  }, []);

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
                maxHeight: "350px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "8px",
                marginBottom: fields.length > 0 ? "16px" : "0",
              }}
            >
              {fields.map((field, index) => (
                <Row
                  key={field.key}
                  gutter={12}
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
                      name={[field.name, "content"]}
                      label={
                        <span style={{fontWeight: 600, color: "#1890ff"}}>
                          CO{index + 1} - Nội dung Mục tiêu
                        </span>
                      }
                      rules={[
                        {required: true, message: "Vui lòng nhập nội dung"},
                      ]}
                      style={{marginBottom: 0}}
                    >
                      <TextArea
                        autoSize={{minRows: 3, maxRows: 5}}
                        placeholder="VD: Hiểu và trình bày được nguyên lý..."
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      {...field}
                      name={[field.name, "programme_learning_outcomes"]}
                      label="Thuộc PLO"
                      style={{marginBottom: 0}}
                      // Xử lý chuyển đổi array objects (API) <-> array IDs (Select mode multiple)
                      getValueProps={(valueArray) => ({
                        value: valueArray?.map((v) => v.id) || [],
                      })}
                      getValueFromEvent={(selectedIds) =>
                        selectedIds.map((id) => ({id}))
                      }
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="Chọn PLO..."
                        options={ploOptions}
                        loading={isFetching}
                        optionLabelProp="tagLabel" // Rút gọn chỉ hiển thị "PLO2" trên tag
                        maxTagCount="responsive" // Ẩn bớt nếu chọn quá nhiều
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
                Thêm Mục tiêu / Chuẩn đầu ra
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default ObjectiveOutcomeReference;
