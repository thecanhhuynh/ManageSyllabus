import React from "react";
import {Form, Input} from "antd";
import UpdateRequireWrapper from "../../components/wrapper/UpdateRequireWrapper";
const {TextArea} = Input;

const TextEditor = ({item, basePath}) => {
  const textPath = [...basePath, "content"];
  const inputStyle = {borderRadius: 8, fontSize: 14};

  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;
  const renderFormItem = () => {
    switch (item.display_mode) {
      case "readonly":
        return (
          <Form.Item
            name={textPath}
            label={CustomLabel}
            style={{marginBottom: 0}}
          >
            <Input
              readOnly
              variant="borderless"
              className="px-0 font-medium text-gray-800 text-sm"
            />
          </Form.Item>
        );
      case "textarea":
        return (
          <Form.Item
            name={textPath}
            label={CustomLabel}
            style={{marginBottom: 0}}
          >
            <TextArea rows={4} style={inputStyle} required />
          </Form.Item>
        );
      case "input":
      default:
        return (
          <Form.Item
            name={textPath}
            label={CustomLabel}
            style={{marginBottom: 0}}
          >
            <Input style={inputStyle} required />
          </Form.Item>
        );
    }
  };
  console.log("Trạng thái update:", item.requires_update);
  return (
    <UpdateRequireWrapper isRequired={item.requires_update}>
      {renderFormItem()}
    </UpdateRequireWrapper>
  );
};

export default TextEditor;
