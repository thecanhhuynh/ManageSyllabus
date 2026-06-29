import React, {useEffect, useState} from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  Tooltip,
  Progress,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useParams} from "react-router-dom";

const AssessmentReference = ({refPath}) => {
  const params = useParams();
  const syllabusId = params.syllabusId;
  const form = Form.useFormInstance();
  const [cloOptions, setCloOptions] = useState([]);

  const loadCLOOptions = async () => {
    try {
      const res = await authApis().get(endpoints["syllabus-clos"](syllabusId));

      const options = res.data.map((clo) => ({
        label: (
          <div className="flex flex-col border-b border-gray-50 pb-1">
            <span className="font-bold text-blue-600 text-xs">{clo.name}</span>
            <span
              className="text-gray-500 text-xs truncate max-w-[250px]"
              title={clo.content}
            >
              {clo.content}
            </span>
          </div>
        ),
        value: clo.id,
        tagLabel: clo.name,
      }));

      setCloOptions(options);
    } catch (error) {
      console.error("Lỗi tải danh sách CLO:", error);
    }
  };

  useEffect(() => {
    loadCLOOptions();
  }, [form.getFieldValue(refPath.slice(0, -2))]);

  const liveData = Form.useWatch(refPath, form) || [];
  const grandTotalWeight = liveData.reduce((sum, item) => {
    const methods = item?.assessment_methods || [];
    return (
      sum +
      methods.reduce((mSum, method) => mSum + (Number(method?.weight) || 0), 0)
    );
  }, 0);

  let status = "active";
  let strokeColor = "#3b82f6";
  if (grandTotalWeight === 100) {
    status = "success";
    strokeColor = "#10b981";
  } else if (grandTotalWeight > 100) {
    status = "exception";
    strokeColor = "#ef4444";
  }

  return (
    <div className="w-full">
      <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
            Tổng trọng số đánh giá học phần
          </span>
          <span
            className={`font-bold text-sm ${grandTotalWeight === 100 ? "text-green-600" : grandTotalWeight > 100 ? "text-red-500" : "text-blue-600"}`}
          >
            {grandTotalWeight}% / 100%
          </span>
        </div>
        <Progress
          percent={grandTotalWeight > 100 ? 100 : grandTotalWeight}
          strokeColor={strokeColor}
          showInfo={false}
          status={status}
          size="small"
        />
        {grandTotalWeight !== 100 && grandTotalWeight > 0 && (
          <div className="text-[11px] text-red-500 mt-2 italic font-medium">
            * Cảnh báo: Tổng trọng số phải bằng chính xác 100% để có thể lưu dữ
            liệu.
          </div>
        )}
      </div>
      <Form.List name={refPath}>
        {(assessmentFields) => (
          <div className="flex flex-col gap-6">
            {assessmentFields.map((assessmentField, index) => {
              const assessmentItem = liveData[assessmentField.name] || {};
              const typeName =
                assessmentItem?.type_assessment?.name ||
                `Loại đánh giá ${index + 1}`;

              const methods = assessmentItem?.assessment_methods || [];
              const totalWeight = methods.reduce(
                (sum, method) => sum + (Number(method?.weight) || 0),
                0,
              );

              return (
                <div
                  key={assessmentField.key}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <Form.Item name={[assessmentField.name, "id"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[assessmentField.name, "type_assessment", "id"]}
                    hidden
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[assessmentField.name, "type_assessment", "name"]}
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center">
                    <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                      {typeName}
                    </span>
                    <span
                      className={`text-[12px] font-bold px-3 py-1 rounded-full ${totalWeight > 0 ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      Tổng: {totalWeight}%
                    </span>
                  </div>

                  <div className="p-4">
                    <Form.List
                      name={[assessmentField.name, "assessment_methods"]}
                    >
                      {(methodFields, {add, remove}) => (
                        <div className="flex flex-col gap-3">
                          {methodFields.map((methodField) => (
                            <Row
                              key={methodField.key}
                              gutter={12}
                              className="items-end bg-gray-50/50 p-3 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors"
                            >
                              <Form.Item name={[methodField.name, "id"]} hidden>
                                <Input />
                              </Form.Item>

                              <Col span={7}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Phương pháp
                                </div>
                                <Form.Item
                                  {...methodField}
                                  name={[methodField.name, "name"]}
                                  rules={[
                                    {required: true, message: "Nhập tên"},
                                  ]}
                                  className="mb-0"
                                >
                                  <Input
                                    placeholder="VD: Thi tự luận"
                                    className="rounded-md text-[13px]"
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={5}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Thời gian
                                </div>
                                <Form.Item
                                  {...methodField}
                                  name={[methodField.name, "time"]}
                                  className="mb-0"
                                >
                                  <Input
                                    prefix={
                                      <ClockCircleOutlined className="text-gray-400" />
                                    }
                                    placeholder="VD: 60 phút"
                                    className="rounded-md text-[13px]"
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={4}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Trọng số
                                </div>
                                <Form.Item
                                  {...methodField}
                                  name={[methodField.name, "weight"]}
                                  rules={[{required: true, message: "Nhập %"}]}
                                  className="mb-0"
                                >
                                  <InputNumber
                                    min={0}
                                    max={100}
                                    addonAfter={<PercentageOutlined />}
                                    placeholder="0"
                                    className="w-full text-[13px] rounded-md"
                                  />
                                </Form.Item>
                              </Col>

                              <Col span={7}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Đánh giá CLO
                                </div>
                                <Form.Item
                                  {...methodField}
                                  name={[
                                    methodField.name,
                                    "course_learning_outcomes",
                                  ]}
                                  className="mb-0"
                                  getValueProps={(valueArray) => ({
                                    value:
                                      valueArray?.map((v) =>
                                        typeof v === "object" ? v.id : v,
                                      ) || [],
                                  })}
                                  getValueFromEvent={(selectedIds) =>
                                    selectedIds
                                      ? selectedIds.map((id) => ({id}))
                                      : []
                                  }
                                >
                                  <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="Chọn CLOs..."
                                    options={cloOptions}
                                    optionLabelProp="tagLabel"
                                    maxTagCount="responsive"
                                    className="w-full rounded-md"
                                  />
                                </Form.Item>
                              </Col>

                              <Col
                                span={1}
                                className="flex justify-center pb-1"
                              >
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(methodField.name)}
                                  className="opacity-40 group-hover:opacity-100 hover:bg-red-50"
                                />
                              </Col>
                            </Row>
                          ))}

                          <Button
                            type="dashed"
                            onClick={() => add()}
                            icon={<PlusOutlined />}
                            className="h-10 mt-2 border-gray-300 text-gray-500 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
                          >
                            Thêm phương pháp {typeName}
                          </Button>
                        </div>
                      )}
                    </Form.List>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Form.List>
    </div>
  );
};

export default AssessmentReference;
