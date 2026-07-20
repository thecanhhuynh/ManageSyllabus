import React, {useEffect, useMemo, useState} from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  Collapse,
} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";

const {TextArea} = Input;
const {Panel} = Collapse;

const TeachingPlanEditor = ({item, basePath}) => {
  const refPath = useMemo(() => [...basePath, "reference_data"], [basePath]);
  const form = Form.useFormInstance();
  const params = useParams();
  const syllabusId = params.syllabusId;

  const [cloOptions, setCloOptions] = useState([]);
  const [assessmentOptions, setAssessmentOptions] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const [scheduleGroupOptions, setScheduleGroupOptions] = useState([]);

  useEffect(() => {
    if (!syllabusId) return;

    authApis()
      .get(endpoints["schedule-groups"])
      .then((res) => setScheduleGroupOptions(res.data))
      .catch(console.error);

    authApis()
      .get(endpoints["syllabus-clos"](syllabusId))
      .then((res) =>
        setCloOptions(
          res.data.map((clo) => ({label: clo.name, value: clo.id})),
        ),
      )
      .catch(console.error);

    authApis()
      .get(endpoints["syllabus-assessments"](syllabusId))
      .then((res) =>
        setAssessmentOptions(
          res.data.map((a) => ({label: a.name, value: a.id})),
        ),
      )
      .catch(console.error);

    authApis()
      .get(endpoints["syllabus-learning-materials"](syllabusId))
      .then((res) =>
        setMaterialOptions(res.data.map((m) => ({label: m.name, value: m.id}))),
      )
      .catch(console.error);
  }, [syllabusId]);

  useEffect(() => {
    if (scheduleGroupOptions.length === 0) return;

    const currentData = form.getFieldValue(refPath) || [];
    let isChanged = false;

    const isFlatData =
      currentData.length > 0 && currentData[0].session_no !== undefined;

    const syncedData = scheduleGroupOptions.map((sg) => {
      if (isFlatData) {
        const sessionsInGroup = currentData.filter(
          (session) =>
            String(session.schedule_group?.id || session.schedule_group_id) ===
            String(sg.id),
        );
        isChanged = true;
        return {
          schedule_group: {id: sg.id, name: sg.name},
          teaching_sessions: sessionsInGroup,
        };
      } else {
        const existingGroup = currentData.find(
          (item) => String(item?.schedule_group?.id) === String(sg.id),
        );
        if (existingGroup) return existingGroup;

        isChanged = true;
        return {
          schedule_group: {id: sg.id, name: sg.name},
          teaching_sessions: [],
        };
      }
    });

    if (isChanged || currentData.length !== syncedData.length) {
      form.setFieldValue(refPath, syncedData);
    }
  }, [scheduleGroupOptions, form, refPath]);

  const liveData = Form.useWatch(refPath, form) || [];

  return (
    <div className="w-full">
      <Form.List name={refPath}>
        {(groupFields) => (
          <div className="flex flex-col gap-6">
            {groupFields.map((groupField, idx) => {
              const groupData = liveData[groupField.name] || {};
              const groupName =
                groupData?.schedule_group?.name || `Nhóm lịch trình ${idx + 1}`;

              return (
                <div
                  key={groupField.key}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <Form.Item
                    name={[groupField.name, "schedule_group", "id"]}
                    hidden
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name={[groupField.name, "schedule_group", "name"]}
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                    <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                      {groupName}
                    </span>
                  </div>

                  <div className="p-4 w-full">
                    <Form.List name={[groupField.name, "teaching_sessions"]}>
                      {(sessionFields, {add, remove}) => (
                        <div className="flex flex-col gap-3 w-full">
                          <Collapse className="w-full bg-transparent border-none">
                            {sessionFields.map((sessionField, sIdx) => {
                              const sessionNo =
                                form.getFieldValue([
                                  ...refPath,
                                  groupField.name,
                                  "teaching_sessions",
                                  sessionField.name,
                                  "session_no",
                                ]) || sIdx + 1;

                              return (
                                <Panel
                                  header={
                                    <span className="font-bold text-blue-600">
                                      Buổi học {sessionNo}
                                    </span>
                                  }
                                  key={sessionField.key}
                                  extra={
                                    <DeleteOutlined
                                      className="text-red-400 hover:text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        remove(sessionField.name);
                                      }}
                                    />
                                  }
                                  className="mb-3 bg-gray-50/40 border border-gray-200 rounded-lg shadow-sm"
                                >
                                  <Form.Item
                                    name={[sessionField.name, "id"]}
                                    hidden
                                  >
                                    <Input />
                                  </Form.Item>

                                  <Row gutter={16}>
                                    <Col span={3}>
                                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Buổi số
                                      </div>
                                      <Form.Item
                                        name={[sessionField.name, "session_no"]}
                                        rules={[
                                          {required: true, message: "Bắt buộc"},
                                        ]}
                                        className="mb-0"
                                      >
                                        <InputNumber
                                          min={1}
                                          className="w-full rounded-md"
                                          placeholder="VD: 1"
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={21}>
                                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Nội dung giảng dạy
                                      </div>
                                      <Form.Item
                                        name={[sessionField.name, "content"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: "Bắt buộc nhập nội dung",
                                          },
                                        ]}
                                        className="mb-0"
                                      >
                                        <TextArea
                                          autoSize={{minRows: 1, maxRows: 4}}
                                          placeholder="Nhập nội dung bài giảng..."
                                          className="rounded-md text-sm"
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>

                                  <Row gutter={16} className="mt-4">
                                    <Col span={8}>
                                      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                                          HĐ trên lớp (Offline)
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "offline_activity",
                                          ]}
                                          className="mb-3"
                                        >
                                          <TextArea
                                            autoSize={{minRows: 2, maxRows: 4}}
                                            placeholder="Mô tả hoạt động..."
                                            className="rounded-md text-sm bg-gray-50/50"
                                          />
                                        </Form.Item>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                                            Số giờ:
                                          </span>
                                          <Form.Item
                                            name={[
                                              sessionField.name,
                                              "offline_hours",
                                            ]}
                                            className="mb-0 flex-1"
                                          >
                                            <InputNumber
                                              min={0}
                                              step={0.5}
                                              className="w-full rounded-md"
                                              placeholder="0"
                                            />
                                          </Form.Item>
                                        </div>
                                      </div>
                                    </Col>

                                    <Col span={8}>
                                      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                        <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">
                                          HĐ trực tuyến (Online)
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "online_activity",
                                          ]}
                                          className="mb-3"
                                        >
                                          <TextArea
                                            autoSize={{minRows: 2, maxRows: 4}}
                                            placeholder="Mô tả hoạt động..."
                                            className="rounded-md text-sm bg-gray-50/50"
                                          />
                                        </Form.Item>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                                            Số giờ:
                                          </span>
                                          <Form.Item
                                            name={[
                                              sessionField.name,
                                              "online_hours",
                                            ]}
                                            className="mb-0 flex-1"
                                          >
                                            <InputNumber
                                              min={0}
                                              step={0.5}
                                              className="w-full rounded-md"
                                              placeholder="0"
                                            />
                                          </Form.Item>
                                        </div>
                                      </div>
                                    </Col>

                                    <Col span={8}>
                                      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                        <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-2">
                                          Tự học
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "self_study_activity",
                                          ]}
                                          className="mb-3"
                                        >
                                          <TextArea
                                            autoSize={{minRows: 2, maxRows: 4}}
                                            placeholder="Mô tả hoạt động..."
                                            className="rounded-md text-sm bg-gray-50/50"
                                          />
                                        </Form.Item>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                                            Số giờ:
                                          </span>
                                          <Form.Item
                                            name={[
                                              sessionField.name,
                                              "self_study_hours",
                                            ]}
                                            className="mb-0 flex-1"
                                          >
                                            <InputNumber
                                              min={0}
                                              step={0.5}
                                              className="w-full rounded-md"
                                              placeholder="0"
                                            />
                                          </Form.Item>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>

                                  <div className="border-t border-gray-100 mt-5 pt-4">
                                    <Row gutter={16}>
                                      <Col span={8}>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                          Đáp ứng CLOs
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "course_learning_outcomes",
                                          ]}
                                          getValueProps={(val) => ({
                                            value:
                                              val?.map((v) =>
                                                typeof v === "object"
                                                  ? v.id
                                                  : v,
                                              ) || [],
                                          })}
                                          getValueFromEvent={(ids) =>
                                            ids ? ids.map((id) => ({id})) : []
                                          }
                                          className="mb-0"
                                        >
                                          <Select
                                            mode="multiple"
                                            allowClear
                                            options={cloOptions}
                                            placeholder="Chọn CLO..."
                                            className="w-full rounded-md"
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={8}>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                          Đánh giá (Assessments)
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "assessments",
                                          ]}
                                          getValueProps={(val) => ({
                                            value:
                                              val?.map((v) =>
                                                typeof v === "object"
                                                  ? v.id
                                                  : v,
                                              ) || [],
                                          })}
                                          getValueFromEvent={(ids) =>
                                            ids ? ids.map((id) => ({id})) : []
                                          }
                                          className="mb-0"
                                        >
                                          <Select
                                            mode="multiple"
                                            allowClear
                                            options={assessmentOptions}
                                            placeholder="Chọn phương pháp..."
                                            className="w-full rounded-md"
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={8}>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                          Tài liệu học tập
                                        </div>
                                        <Form.Item
                                          name={[
                                            sessionField.name,
                                            "learning_materials",
                                          ]}
                                          getValueProps={(val) => ({
                                            value:
                                              val?.map((v) =>
                                                typeof v === "object"
                                                  ? v.id
                                                  : v,
                                              ) || [],
                                          })}
                                          getValueFromEvent={(ids) =>
                                            ids ? ids.map((id) => ({id})) : []
                                          }
                                          className="mb-0"
                                        >
                                          <Select
                                            mode="multiple"
                                            allowClear
                                            options={materialOptions}
                                            placeholder="Chọn tài liệu..."
                                            className="w-full rounded-md"
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  </div>
                                </Panel>
                              );
                            })}
                          </Collapse>

                          <Button
                            type="dashed"
                            onClick={() =>
                              add({session_no: sessionFields.length + 1})
                            }
                            block
                            icon={<PlusOutlined />}
                            className="h-10 mt-2 border-gray-300 text-gray-500 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
                          >
                            Thêm buổi học ({groupName})
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

export default TeachingPlanEditor;
