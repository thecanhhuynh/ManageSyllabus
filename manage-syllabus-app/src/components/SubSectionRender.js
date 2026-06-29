import TextRenderer from "./renderers/TextRenderer";
import SelectionRenderer from "./renderers/SelectionRenderer";
import ReferenceRenderer from "./ReferenceRenderer";
import {Alert, Space} from "antd";
import Text from "antd/es/typography/Text";

const COMPONENT_MAP = {
  text: TextRenderer,
  selection: SelectionRenderer,
  reference: ReferenceRenderer,
};
const SubSectionRenderer = ({item, basePath}) => {
  const TargetComponent = COMPONENT_MAP[item.type];

  if (!TargetComponent) {
    return (
      <Alert
        message="Cấu hình không hợp lệ"
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

  return <TargetComponent item={item} basePath={basePath} />;
};

export default SubSectionRenderer;
