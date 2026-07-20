import React from "react";
import {Table, Tag, Input} from "antd";

const CourseLearningOutcomePreview = ({item}) => {
  const ploColumns = ["PLO1", "PLO2", "PLO3", "PLO4", "PLO9", "PLO10"];

  const columns = [
    {
      title: "Course Learning Outcome",
      dataIndex: "code",
      width: 130,
      render: (text) => (
        <Tag color="blue" className="font-semibold">
          {text}
        </Tag>
      ),
    },
    {
      title: "Outcome Description",
      dataIndex: "content",
      width: 320,
      render: (text) => (
        <span className="text-gray-500 italic text-xs">{text}</span>
      ),
    },
    ...ploColumns.map((plo) => ({
      title: plo,
      dataIndex: plo,
      width: 70,
      align: "center",
      render: (value) => (
        <Input disabled value={value || ""} className="text-center" />
      ),
    })),
  ];

  const data = [
    {
      key: 1,
      code: "CLO1.1",
      content: "Giải thích được lưu đồ thuật toán (Flowchart).",
      PLO1: 3,
      PLO2: 5,
      PLO3: 5,
    },
    {
      key: 2,
      code: "CLO1.2",
      content: "Viết chương trình nhập xuất dữ liệu.",
      PLO2: 2,
      PLO3: 1,
      PLO9: 4,
    },
    {
      key: 3,
      code: "CLO1.3",
      content: "Phát hiện và sửa lỗi cú pháp.",
      PLO2: 5,
      PLO3: 3,
      PLO4: 3,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 opacity-80 pointer-events-none">
      {/* Placeholder */}
      {item.place_holder && (
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">
          {item.place_holder}
        </div>
      )}

      {/* Danh sách CLO */}
      <div className="mb-6">
        <div className="font-semibold mb-3">Chuẩn đầu ra 1</div>

        <div className="space-y-3">
          {[
            {
              code: "CLO1.1",
              content: "Giải thích được lưu đồ thuật toán (Flowchart).",
            },
            {
              code: "CLO1.2",
              content: "Viết chương trình nhập xuất dữ liệu.",
            },
            {
              code: "CLO1.3",
              content: "Phát hiện và sửa lỗi cú pháp.",
            },
          ].map((clo) => (
            <div
              key={clo.code}
              className="border rounded-lg p-4 flex gap-4 items-start"
            >
              <Tag color="blue" className="mt-1">
                {clo.code}
              </Tag>

              <div className="text-sm text-gray-700">{clo.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="border rounded-xl p-4 bg-gray-50">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          Ma trận chuẩn đầu ra
        </div>

        <div className="text-xs text-gray-400 mb-3">
          (Trong số: 1 (Tác động ít) tới 5 (Tác động nhiều))
        </div>

        <Table
          size="small"
          pagination={false}
          columns={columns}
          dataSource={data}
          scroll={{x: true}}
        />
      </div>
    </div>
  );
};

export default CourseLearningOutcomePreview;
