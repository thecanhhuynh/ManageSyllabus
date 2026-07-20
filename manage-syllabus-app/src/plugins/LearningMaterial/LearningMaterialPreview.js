import React from "react";
import {BookOutlined, PlusOutlined} from "@ant-design/icons";

const LearningMaterialPreview = ({item}) => {
  const materialTypes = [
    {
      name: "Giáo trình",
      materials: ["Lập trình Java cơ bản", "Cấu trúc dữ liệu và Giải thuật"],
    },
    {
      name: "Tài liệu tham khảo",
      materials: [
        "Clean Code",
        "Design Patterns",
        "Introduction to Algorithms",
      ],
    },
    {
      name: "Bài báo / Website",
      materials: ["Oracle Java Documentation", "https://docs.oracle.com"],
    },
  ];

  return (
    <div className="w-full opacity-80 pointer-events-none">
      {item.place_holder && (
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
          {item.place_holder}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {materialTypes.map((type) => (
          <div
            key={type.name}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {type.name}
              </span>
            </div>

            {/* Materials */}
            <div className="p-3 flex flex-wrap gap-2 items-center min-h-[54px]">
              {type.materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[13px] font-medium h-8"
                >
                  <BookOutlined className="text-blue-500" />
                  <span className="max-w-[220px] truncate">{material}</span>
                </div>
              ))}

              {/* Fake Add Button */}
              <div className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full text-[13px] font-medium h-8">
                <PlusOutlined className="text-[11px]" />
                <span>Thêm Tài liệu</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningMaterialPreview;
