import React, {useContext} from "react";
import {Form, Select} from "antd";
import {MySelectionDataContext} from "../../config/contexts/MyContext";
import UpdateRequireWrapper from "../../components/wrapper/UpdateRequireWrapper";

const SelectionEditor = ({item, basePath}) => {
  const {selectionDictionary, isDictLoading} = useContext(
    MySelectionDataContext,
  );
  const optionsForThisSelect =
    selectionDictionary[item.attribute_group_id] || [];

  return (
    <UpdateRequireWrapper isRequired={item.requires_update}>
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
          required
        />
      </Form.Item>
    </UpdateRequireWrapper>
  );
};

export default SelectionEditor;
