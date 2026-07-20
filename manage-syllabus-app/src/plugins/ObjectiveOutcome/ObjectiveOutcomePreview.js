import React from "react";
import {Input, Select, Button, Row, Col, Tooltip} from "antd";
import {DeleteOutlined} from "@ant-design/icons";

const {TextArea} = Input;

const ObjectiveOutcomePreview = ({item}) => {
  const dummyData = [
    {
      id: 1,
      content: "Phân tích và đánh giá độ phức tạp của các thuật toán cơ bản.",
      plos: ["PLO1", "PLO2"],
    },
    {
      id: 2,
      content: "Thiết kế và cài đặt được các cấu trúc dữ liệu phù hợp.",
      plos: ["PLO3"],
    },
  ];

  return (
    <div className="w-full opacity-80 pointer-events-none">
      {item.place_holder && (
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          {item.place_holder}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {dummyData.map((co, index) => (
          <div
            key={co.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4"
          >
            <Row gutter={16} align="top">
              <Col span={13}>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2 h-6">
                  <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px]">
                    CO-{index + 1}
                  </span>
                  Nội dung mục tiêu
                </div>

                <TextArea
                  value={co.content}
                  autoSize={{minRows: 2, maxRows: 4}}
                  disabled
                  className="rounded-md text-sm"
                />
              </Col>

              <Col span={10}>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 h-6">
                  <span className="text-gray-400">≈</span>
                  Chuẩn đầu ra (PLO)
                </div>

                <Select
                  mode="multiple"
                  disabled
                  value={co.plos}
                  options={[
                    {label: "PLO1", value: "PLO1"},
                    {label: "PLO2", value: "PLO2"},
                    {label: "PLO3", value: "PLO3"},
                    {label: "PLO4", value: "PLO4"},
                  ]}
                  maxTagCount="responsive"
                  className="w-full rounded-md"
                />
              </Col>

              <Col span={1} className="flex justify-center pb-1 mt-7">
                <Tooltip title="Xóa mục tiêu này">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined className="text-base" />}
                    className="opacity-40"
                  />
                </Tooltip>
              </Col>
            </Row>
          </div>
        ))}
      </div>

      <Button
        type="dashed"
        block
        disabled
        className="mt-4 h-10 border-gray-300 text-gray-600 font-medium rounded-lg bg-white"
      >
        Thêm Mục tiêu môn học (CO)
      </Button>
    </div>
  );
};

export default ObjectiveOutcomePreview;
