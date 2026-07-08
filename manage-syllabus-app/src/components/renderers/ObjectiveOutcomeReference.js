import React, {useState, useEffect} from "react";
import {Form, Input, Select, Button, Row, Col, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined, HolderOutlined} from "@ant-design/icons";
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
      const data = res.data.results;

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
    <div className="w-full">
      <Form.List name={refPath}>
        {(fields, {add, remove}) => (
          <>
            <div className="flex flex-col gap-3 mb-4">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 group hover:border-blue-300 transition-all"
                >
                  <Form.Item name={[field.name, "id"]} hidden>
                    <Input />
                  </Form.Item>

                  <Row gutter={16} align="top">
                    <Col span={13}>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2 h-6">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px]">
                          CO-{index + 1}
                        </span>
                        Nội dung mục tiêu
                      </div>
                      <Form.Item
                        {...field}
                        name={[field.name, "content"]}
                        rules={[
                          {required: true, message: "Vui lòng nhập nội dung"},
                        ]}
                        className="mb-0"
                      >
                        <TextArea
                          autoSize={{minRows: 2, maxRows: 4}}
                          placeholder="VD: Phân tích và đánh giá độ phức tạp..."
                          className="rounded-md text-sm"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={10}>
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 h-6">
                        <span className="text-gray-400">≈</span> Chuẩn đầu ra
                        (PLO)
                      </div>
                      <Form.Item
                        {...field}
                        name={[field.name, "programme_learning_outcomes"]}
                        className="mb-0"
                        getValueProps={(valueArray) => ({
                          value: valueArray?.map((v) => v.id) || [],
                        })}
                        getValueFromEvent={(selectedIds) =>
                          selectedIds ? selectedIds.map((id) => ({id})) : []
                        }
                      >
                        <Select
                          mode="multiple"
                          allowClear
                          placeholder="Chọn PLO..."
                          options={ploOptions}
                          loading={isFetching}
                          optionLabelProp="tagLabel"
                          maxTagCount="responsive"
                          className="w-full rounded-md"
                        />
                      </Form.Item>
                    </Col>

                    <Col span={1} className="flex justify-center pb-1 mt-7">
                      <Tooltip title="Xóa mục tiêu này">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined className="text-base" />}
                          onClick={() => remove(field.name)}
                          className="opacity-40 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                        />
                      </Tooltip>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>

            <Button
              type="dashed"
              onClick={() => add({})}
              block
              icon={<PlusOutlined />}
              className="h-10 border-gray-300 text-gray-600 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
            >
              Thêm Mục tiêu môn học (CO)
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default ObjectiveOutcomeReference;
