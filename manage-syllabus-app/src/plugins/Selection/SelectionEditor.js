import React, {useContext} from "react";
import {Form, Select} from "antd";
import {MySelectionDataContext} from "../../config/contexts/MyContext";

const SelectionEditor = ({item, basePath}) => {
  const {selectionDictionary, isDictLoading} = useContext(
    MySelectionDataContext,
  );
  const optionsForThisSelect = selectionDictionary[item.name] || [];

  return (
    <Form.Item
      name={[...basePath, "selected_values"]}
      style={{marginBottom: 0}}
      getValueProps={(valueArray) => ({
        value: valueArray?.map((v) => v.id) || [],
      })}
      getValueFromEvent={(selectedIds) => selectedIds.map((id) => ({id}))}
    >
      <Select
        mode="multiple"
        placeholder={item.place_holder || "Vui lòng chọn..."}
        style={{width: "100%"}}
        options={optionsForThisSelect}
        loading={isDictLoading}
        size="large"
        className="rounded-lg-select"
      />
    </Form.Item>
  );
};

export default SelectionEditor;
