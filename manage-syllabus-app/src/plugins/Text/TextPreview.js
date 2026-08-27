import React, {useEffect, useState} from "react";
import {Input, Select, Typography} from "antd";

const {TextArea} = Input;
const {Text} = Typography;

const TextPreview = ({item, onUpdateField}) => {
  const [testValue, setTestValue] = useState("");

  const inputStyle = {borderRadius: 8, fontSize: 14};
  const mode = item.display_mode || "text";
  const placeholderText =
    item.place_holder ||
    `Nhập ${item.name ? item.name.toLowerCase() : "dữ liệu"}...`;

  const handleModeChange = (val) => {
    setTestValue("");
    onUpdateField("display_mode", val);
  };

  useEffect(() => {
    if (!item.display_mode) {
      onUpdateField("display_mode", "text");
    }
  }, []);

  const isEmailInvalid =
    mode === "email" && testValue.length > 0 && !testValue.includes("@");

  const renderPreview = () => {
    if (mode === "textarea") {
      return (
        <TextArea
          autoSize={{minRows: 4, maxRows: 10}}
          placeholder={placeholderText}
          style={inputStyle}
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
        />
      );
    }

    return (
      <div className="flex flex-col">
        <Input
          type={mode}
          placeholder={placeholderText}
          style={inputStyle}
          value={testValue}
          onChange={(e) => setTestValue(e.target.value)}
          status={isEmailInvalid ? "error" : ""}
        />
        {isEmailInvalid && (
          <Text type="danger" className="text-xs mt-1">
            Vui lòng nhập đúng định dạng email (cần có @).
          </Text>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-50 p-3 rounded-md border mt-2">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Loại hiển thị</div>
          <Select
            value={mode}
            onChange={handleModeChange}
            className="w-full"
            options={[
              {value: "text", label: "Text thường"},
              {value: "textarea", label: "Văn bản dài"},
              {value: "number", label: "Dạng số"},
              {value: "email", label: "Dạng Email"},
            ]}
          />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">Placeholder</div>
          <Input
            value={item.place_holder || ""}
            onChange={(e) => onUpdateField("place_holder", e.target.value)}
            placeholder="VD: Nhập dữ liệu..."
          />
        </div>
      </div>

      <div className="pt-3 border-t">
        <div className="text-xs text-gray-400 mb-2 italic">
          Xem trước (Có thể gõ thử):
        </div>
        {renderPreview()}
      </div>
    </div>
  );
};

export default TextPreview;
