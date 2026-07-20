import React from "react";
import {Tag} from "antd";
import {BookOutlined} from "@ant-design/icons";

const RequirementSubjectPreview = ({item}) => {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl opacity-80 pointer-events-none">
      {item.place_holder && (
        <div className="mb-4 font-bold text-gray-500 uppercase">
          {item.place_holder}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {/* Mockup 1: Môn tiên quyết */}
        <div className="p-3 bg-white rounded-lg border border-gray-100">
          <div className="text-[13px] font-bold text-gray-700 mb-2">
            Môn tiên quyết (Mẫu)
          </div>
          <div className="flex gap-2">
            <Tag className="px-3 py-1 rounded-full text-blue-600 bg-blue-50 border-blue-200 flex items-center gap-1">
              <BookOutlined /> Nhập môn Lập trình (IT123)
            </Tag>
          </div>
        </div>

        {/* Mockup 2: Môn học trước */}
        <div className="p-3 bg-white rounded-lg border border-gray-100">
          <div className="text-[13px] font-bold text-gray-700 mb-2">
            Môn học trước (Mẫu)
          </div>
          <div className="flex gap-2">
            <Tag className="px-3 py-1 rounded-full text-cyan-600 bg-cyan-50 border-cyan-200 flex items-center gap-1">
              <BookOutlined /> Toán rời rạc (MA101)
            </Tag>
            <Tag className="px-3 py-1 rounded-full text-cyan-600 bg-cyan-50 border-cyan-200 flex items-center gap-1">
              <BookOutlined /> Cấu trúc dữ liệu (IT201)
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementSubjectPreview;
