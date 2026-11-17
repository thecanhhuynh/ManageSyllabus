import React from "react";
import { Divider, Radio } from "antd";

export const DisplayTypeSection = ({
  displayType,
  setDisplayType,
  textFormat,
  setTextFormat,
  tableCode,
  isDisplayTypeSupported,
}) => {
  if (!isDisplayTypeSupported) return null;

  return (
    <div>
      <Divider className="my-3" />
      <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Kiểu hiển thị</h4>
      <Radio.Group value={displayType} onChange={(e) => setDisplayType(e.target.value)}>
        <Radio value="TABLE">Bảng</Radio>
        <Radio value="TEXT">Văn bản</Radio>
      </Radio.Group>

      {tableCode === "credit" && displayType === "TEXT" && (
        <div className="mt-3 bg-slate-50 p-2.5 rounded border border-slate-200">
          <span className="text-[11px] font-semibold text-gray-700 block mb-1.5">
            Định dạng câu văn bản:
          </span>
          <Radio.Group
            value={textFormat}
            onChange={(e) => setTextFormat(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value="INLINE" className="text-xs">
              <span className="font-medium">Mẫu 1: Dòng câu tóm tắt</span>
              <span className="block text-[10px] text-gray-400">
                Tổng số: 3 tín chỉ (Lý thuyết: 2, Thực hành: 1, Tự học: 90 giờ)
              </span>
            </Radio>
            <Radio value="BULLET" className="text-xs">
              <span className="font-medium">Mẫu 2: Danh sách gạch đầu dòng</span>
              <span className="block text-[10px] text-gray-400">
                • Tổng số: 3 tín chỉ • Lý thuyết: 2 tín chỉ...
              </span>
            </Radio>
          </Radio.Group>
        </div>
      )}
    </div>
  );
};

export default DisplayTypeSection;
