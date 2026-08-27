import React from "react";
import {StarOutlined} from "@ant-design/icons";

const UpdateRequireWrapper = ({isRequired, children}) => {
  if (!isRequired) {
    return children;
  }
  return (
    <div className="relative border-2 border-indigo-400 bg-indigo-50/30 rounded-lg p-4 pt-7 mb-4 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[11px] font-bold px-3 py-1 rounded-br-lg rounded-tl-sm uppercase tracking-wide flex items-center gap-1 shadow-sm">
        <StarOutlined /> Tính năng mới
      </div>

      <div className="mt-1">{children}</div>
    </div>
  );
};

export default UpdateRequireWrapper;
