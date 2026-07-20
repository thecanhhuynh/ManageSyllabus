import React from "react";
import {Input} from "antd";

const {TextArea} = Input;

const TextPreview = ({item}) => {
  const inputStyle = {
    borderRadius: 8,
    fontSize: 14,
  };

  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  const sampleText = item.content || "Đây là nội dung mẫu để xem trước.";

  switch (item.display_mode) {
    case "readonly":
      return (
        <div className="w-full">
          {CustomLabel}
          <Input
            readOnly
            variant="borderless"
            value={sampleText}
            className="px-0 font-medium text-gray-800 text-sm"
          />
        </div>
      );

    case "textarea":
      return (
        <div className="w-full">
          {CustomLabel}
          <TextArea rows={4} value={sampleText} readOnly style={inputStyle} />
        </div>
      );

    case "input":
    default:
      return (
        <div className="w-full">
          {CustomLabel}
          <Input value={sampleText} readOnly style={inputStyle} />
        </div>
      );
  }
};

export default TextPreview;
