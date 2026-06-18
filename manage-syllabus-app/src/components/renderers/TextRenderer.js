import React from "react";
import {Form, Input} from "antd";

const {TextArea} = Input;

const TextRenderer = ({item, basePath}) => {
  const textPath = [...basePath, "content"];

  switch (item.display_mode) {
    case "readonly":
      return (
        <Form.Item name={textPath} style={{marginBottom: 0}}>
          <Input
            readOnly
            variant="borderless"
            style={{fontWeight: 500, padding: 0, color: "rgba(0, 0, 0, 0.88)"}}
          />
        </Form.Item>
      );
    case "textarea":
      return (
        <Form.Item name={textPath}>
          <TextArea rows={4} placeholder={item.place_holder} />
        </Form.Item>
      );
    case "input":
    default:
      return (
        <Form.Item name={textPath}>
          <Input placeholder={item.place_holder} />
        </Form.Item>
      );
  }
};

export default TextRenderer;
