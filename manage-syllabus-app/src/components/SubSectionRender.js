import {Alert, Space} from "antd";
import Text from "antd/es/typography/Text";
import {getPlugin} from "../plugins/Registry";

const SubSectionRenderer = ({item, basePath}) => {
  const Plugin = getPlugin(item.type, item.code);
  const TargetComponent = Plugin ? Plugin.Editor : null;

  if (!TargetComponent) {
    return (
      <Alert
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
        type="warning"
        showIcon
        style={{marginBottom: 16, borderRadius: 8}}
      />
    );
  }

  // Render Component lấy từ Registry
  return <TargetComponent item={item} basePath={basePath} />;
};

export default SubSectionRenderer;
