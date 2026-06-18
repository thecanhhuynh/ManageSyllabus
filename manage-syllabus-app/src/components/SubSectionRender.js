import TextRenderer from "./renderers/TextRenderer";
import SelectionRenderer from "./renderers/SelectionRenderer";
import ReferenceRenderer from "./ReferenceRenderer";

const COMPONENT_MAP = {
  text: TextRenderer,
  selection: SelectionRenderer,
  reference: ReferenceRenderer,
};
const SubSectionRenderer = ({item, basePath}) => {
  const TargetComponent = COMPONENT_MAP[item.type];

  if (!TargetComponent) {
    return (
      <div
        style={{
          padding: "10px",
          border: "1px dashed #ccc",
          marginBottom: "10px",
        }}
      >
        <strong>Type không hợp lệ:</strong> {item.type} | <strong>Code:</strong>{" "}
        {item.code}
      </div>
    );
  }

  return <TargetComponent item={item} basePath={basePath} />;
};

export default SubSectionRenderer;
