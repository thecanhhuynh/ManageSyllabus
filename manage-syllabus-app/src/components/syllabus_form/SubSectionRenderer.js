import React from "react";
import { Space, Typography } from "antd";
import { WarningAlert } from "../common";
import { getPlugin } from "../../plugins/Registry";

const { Text } = Typography;

export const SubSectionRenderer = ({ item, basePath }) => {
  const Plugin = getPlugin(item.type, item.code);
  const TargetComponent = Plugin ? Plugin.Editor : null;

  if (!TargetComponent) {
    return (
      <WarningAlert
        message="Cấu hình Component không hợp lệ"
        description={
          <Space direction="vertical" size={0}>
            <Text>
              Type: <Text code>{item.type}</Text>
            </Text>
            <Text>
              Code: <Text code>{item.code}</Text>
            </Text>
          </Space>
        }
        className="mb-4"
      />
    );
  }

  return <TargetComponent item={item} basePath={basePath} />;
};

export default SubSectionRenderer;
