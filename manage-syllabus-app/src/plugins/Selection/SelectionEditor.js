import React, {useContext} from "react";
import {Form, Select} from "antd";
import {MySelectionDataContext} from "../../config/contexts/MyContext";
import UpdateRequireWrapper from "../../components/wrapper/UpdateRequireWrapper";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const SelectionEditor = ({item, basePath}) => {
  const {selectionDictionary, isDictLoading} = useContext(
    MySelectionDataContext,
  );
  const optionsForThisSelect =
    selectionDictionary[item.attribute_group_id] || [];
  // console.log("Trạng thái update:", item.requires_update);
  const selectedValues = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.selected_values ?? [],
  );

  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);
  const currentVal = Array.isArray(selectedValues)
    ? selectedValues.map((v) => (typeof v === "object" ? v.id : v))
    : [];

  const handleChange = (selectedIds) => {
    const formattedValues = (selectedIds || []).map((id) => ({id}));
    updateLocalBlock(item.code, {selected_values: formattedValues});
  };
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
          value={currentVal}
          onChange={handleChange}
        />
      </Form.Item>
    </UpdateRequireWrapper>
  );
};

export default SelectionEditor;
