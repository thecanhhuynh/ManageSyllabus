import React from "react";
import {Select} from "antd";

const SelectionPreview = ({item}) => {
  const CustomLabel = item.place_holder ? (
    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {item.place_holder}
    </span>
  ) : null;

  return (
    <div className="w-full">
      {CustomLabel}
      <Select
        mode="multiple"
        value={["Lựa chọn 1", "Lựa chọn 2"]}
        options={[
          {label: "Lựa chọn 1", value: "Lựa chọn 1"},
          {label: "Lựa chọn 2", value: "Lựa chọn 2"},
          {label: "Lựa chọn 3", value: "Lựa chọn 3"},
        ]}
        open={false}
        disabled
        size="large"
        style={{width: "100%"}}
        className="rounded-lg-select"
      />
    </div>
  );
};

export default SelectionPreview;
