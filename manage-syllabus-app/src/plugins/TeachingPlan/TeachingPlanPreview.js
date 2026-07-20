import React from "react";
import {Collapse, Row, Col, Tag, Input, InputNumber, Select} from "antd";

const {Panel} = Collapse;
const {TextArea} = Input;

const TeachingPlanPreview = ({item}) => {
  const groups = [
    {
      name: "Lý thuyết",
      sessions: [
        {
          session_no: 1,
          content: "Giới thiệu học phần và tổng quan môn học",
          offline: "Giảng bài, thảo luận",
          online: "Quiz trên LMS",
          selfStudy: "Đọc chương 1",
          offlineHours: 2,
          onlineHours: 1,
          selfStudyHours: 3,
          clos: ["CLO1", "CLO2"],
          assessments: ["Quiz"],
          materials: ["Giáo trình chính"],
        },
      ],
    },
    {
      name: "Thực hành",
      sessions: [
        {
          session_no: 2,
          content: "Lập trình thuật toán cơ bản",
          offline: "Coding tại phòng máy",
          online: "Video hướng dẫn",
          selfStudy: "Làm bài tập",
          offlineHours: 3,
          onlineHours: 1,
          selfStudyHours: 4,
          clos: ["CLO3"],
          assessments: ["Lab"],
          materials: ["Slide", "Source code"],
        },
      ],
    },
  ];

  return (
    <div className="w-full opacity-80 pointer-events-none">
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div
            key={group.name}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                {group.name}
              </span>
            </div>

            <div className="p-4">
              <Collapse
                defaultActiveKey={["0"]}
                className="bg-transparent border-none"
              >
                {group.sessions.map((session, index) => (
                  <Panel
                    key={index}
                    header={
                      <span className="font-bold text-blue-600">
                        Buổi học {session.session_no}
                      </span>
                    }
                    className="mb-3 bg-gray-50/40 border border-gray-200 rounded-lg shadow-sm"
                  >
                    <Row gutter={16}>
                      <Col span={3}>
                        <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Buổi số
                        </div>
                        <InputNumber
                          value={session.session_no}
                          disabled
                          className="w-full"
                        />
                      </Col>

                      <Col span={21}>
                        <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">
                          Nội dung giảng dạy
                        </div>
                        <TextArea
                          value={session.content}
                          autoSize={{minRows: 2}}
                          disabled
                        />
                      </Col>
                    </Row>

                    <Row gutter={16} className="mt-4">
                      {[
                        {
                          title: "HĐ trên lớp (Offline)",
                          color: "text-blue-600",
                          activity: session.offline,
                          hour: session.offlineHours,
                        },
                        {
                          title: "HĐ trực tuyến (Online)",
                          color: "text-green-600",
                          activity: session.online,
                          hour: session.onlineHours,
                        },
                        {
                          title: "Tự học",
                          color: "text-purple-600",
                          activity: session.selfStudy,
                          hour: session.selfStudyHours,
                        },
                      ].map((box) => (
                        <Col span={8} key={box.title}>
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                            <div
                              className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${box.color}`}
                            >
                              {box.title}
                            </div>

                            <TextArea
                              value={box.activity}
                              disabled
                              autoSize={{minRows: 2}}
                            />

                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">
                                Số giờ
                              </span>

                              <InputNumber
                                disabled
                                value={box.hour}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    <div className="border-t border-gray-100 mt-5 pt-4">
                      <Row gutter={16}>
                        <Col span={8}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Đáp ứng CLOs
                          </div>

                          <Select
                            mode="multiple"
                            disabled
                            value={session.clos}
                            options={session.clos.map((i) => ({
                              label: i,
                              value: i,
                            }))}
                          />
                        </Col>

                        <Col span={8}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Đánh giá
                          </div>

                          <Select
                            mode="multiple"
                            disabled
                            value={session.assessments}
                            options={session.assessments.map((i) => ({
                              label: i,
                              value: i,
                            }))}
                          />
                        </Col>

                        <Col span={8}>
                          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Tài liệu học tập
                          </div>

                          <Select
                            mode="multiple"
                            disabled
                            value={session.materials}
                            options={session.materials.map((i) => ({
                              label: i,
                              value: i,
                            }))}
                          />
                        </Col>
                      </Row>
                    </div>
                  </Panel>
                ))}
              </Collapse>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeachingPlanPreview;
