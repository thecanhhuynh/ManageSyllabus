import React from "react";
import { Popover, Button } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { StyleControls } from "../../block_styler";

export const TypographyPopover = ({
  title = "Định dạng",
  style = {},
  defaultStyle = {},
  onUpdate,
  showSpacing = false,
  buttonTitle = "Chỉnh định dạng",
}) => (
  <Popover
    trigger="click"
    placement="bottomRight"
    title={title}
    content={
      <div className="w-80 p-1">
        <StyleControls
          style={style}
          defaultStyle={defaultStyle}
          onUpdate={onUpdate}
          showSpacing={showSpacing}
        />
      </div>
    }
  >
    <Button icon={<BgColorsOutlined />} title={buttonTitle} />
  </Popover>
);

export default TypographyPopover;
