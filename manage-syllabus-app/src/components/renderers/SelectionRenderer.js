import React, {useContext} from "react";
import {Form, Select} from "antd";
import {MySelectionDataContext} from "../../config/contexts/MyContext";

const SelectionRenderer = ({item, basePath}) => {
  const {selectionDictionary, isDictLoading} = useContext(
    MySelectionDataContext,
  );
  const optionsForThisSelect = selectionDictionary[item.name] || [];

  return (
    <Form.Item
      name={[...basePath, "selected_values"]}
      getValueProps={(valueArray) => ({
        value: valueArray?.map((v) => v.id) || [],
      })}
      getValueFromEvent={(selectedIds) => selectedIds.map((id) => ({id}))}
    >
      <Select
        mode="multiple"
        placeholder="Vui lòng chọn..."
        style={{width: "100%"}}
        options={optionsForThisSelect}
        loading={isDictLoading}
      />
    </Form.Item>
  );
};

export default SelectionRenderer;
