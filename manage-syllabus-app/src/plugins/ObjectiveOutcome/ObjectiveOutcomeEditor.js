import React, {useState, useEffect, useMemo, memo} from "react";
import {Input, Button, Row, Col, Tooltip, Tag} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {endpoints} from "../../config/Apis";
import {AppServices} from "../../services/AppServices";
import {useSyllabusStore} from "../../store/useSyllabusStore";
import LazySelect from "../../components/common/LazySelect";

const {TextArea} = Input;

const ObjectiveOutcomeItem = ({
  itemData,
  index,
  labels = {},
  coCustomCols = [],
  customValues = {},
  updateCustomValue,
  allPlosMap = {},
  onChange,
  onRemove,
}) => {
  const currentPloIds = Array.isArray(itemData.programme_learning_outcomes)
    ? itemData.programme_learning_outcomes.map((plo) =>
        typeof plo === "object" ? plo.id : plo,
      )
    : [];

  const handleContentChange = (e) => {
    onChange({
      ...itemData,
      content: e.target.value,
    });
  };

  const handlePloChange = (selectedIds, selectedOptions) => {
    const updatedPlos = selectedIds.map((id) => {
      const foundInSelected = Array.isArray(selectedOptions)
        ? selectedOptions.find((o) => String(o.value) === String(id))
        : null;
      if (foundInSelected?.raw) {
        return foundInSelected.raw;
      }
      if (allPlosMap[id]) {
        return allPlosMap[id];
      }
      const existing = Array.isArray(itemData.programme_learning_outcomes)
        ? itemData.programme_learning_outcomes.find(
            (p) => String(typeof p === "object" ? p.id : p) === String(id),
          )
        : null;
      if (existing && typeof existing === "object") {
        return existing;
      }
      return {id};
    });

    onChange({
      ...itemData,
      programme_learning_outcomes: updatedPlos,
    });
  };

  const renderPloTag = (props) => {
    const {label, value, closable, onClose, isMaxTag} = props;
    if (isMaxTag || value === undefined) {
      return (
        <Tag
          closable={false}
          className="inline-flex items-center text-xs font-medium px-1.5 py-0.5 mr-1 bg-gray-100 text-gray-600 border-gray-300"
          style={{borderRadius: 4}}
        >
          {label}
        </Tag>
      );
    }

    const plo =
      allPlosMap[value] ||
      (itemData.programme_learning_outcomes || []).find(
        (p) => (typeof p === "object" ? p.id : p) === value,
      );
    const shortTitle =
      plo?.name || (String(value).startsWith("PLO") ? value : `PLO${value}`);
    const description =
      plo?.description || (typeof label === "string" ? label : "");

    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tooltip title={description} placement="top">
        <Tag
          closable={closable}
          onClose={onClose}
          onMouseDown={onPreventMouseDown}
          className="inline-flex items-center text-xs font-semibold px-2 py-0.5 mr-1 bg-blue-50 text-blue-700 border-blue-200"
          style={{borderRadius: 4}}
        >
          {shortTitle}
        </Tag>
      </Tooltip>
    );
  };

  const renderPloOption = (plo) => (
    <Tooltip title={plo.description} placement="right">
      <div className="py-0.5">
        <span className="font-bold text-blue-600 mr-1.5">{plo.name}</span>
        <span className="text-gray-600 text-xs">- {plo.description}</span>
      </div>
    </Tooltip>
  );

  const rowId = itemData.id || `co_${index}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 group hover:border-blue-300 transition-all">
      <Row gutter={16} align="top">
        <Col span={13}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2 h-6">
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px]">
              {labels.col_code ? `${labels.col_code}-${index + 1}` : `CO-${index + 1}`}
            </span>
            {labels.col_description || "Nội dung mục tiêu"}
          </div>
          <TextArea
            autoSize={{minRows: 2, maxRows: 4}}
            placeholder="VD: Phân tích và đánh giá độ phức tạp..."
            className="rounded-md text-sm font-normal text-gray-700"
            value={itemData.content ?? ""}
            onChange={handleContentChange}
          />
        </Col>

        <Col span={10}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 h-6">
            <span className="text-gray-400">≈</span> {labels.col_plo || "Chuẩn đầu ra (PLO)"}
          </div>
          <LazySelect
            mode="multiple"
            allowClear
            placeholder="Chọn PLO..."
            endpoint={endpoints["programme-learning-outcomes"]}
            labelField="name"
            value={currentPloIds}
            initialOptions={itemData.programme_learning_outcomes || []}
            onChange={handlePloChange}
            tagRenderer={renderPloTag}
            optionRenderer={renderPloOption}
            maxTagCount="responsive"
            className="w-full rounded-md font-normal text-gray-700"
          />
        </Col>

        <Col span={1} className="flex justify-center pb-1 mt-7">
          <Tooltip title="Xóa mục tiêu này">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined className="text-base" />}
              onClick={onRemove}
              className="opacity-40 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
            />
          </Tooltip>
        </Col>
      </Row>

      {coCustomCols.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
          <Row gutter={12}>
            {coCustomCols.map((col) => {
              const valKey = `${col.id}_${rowId}`;
              const val =
                customValues[valKey] ?? customValues[col.id] ?? col.default_value ?? "";

              return (
                <Col
                  key={col.id}
                  span={Math.max(6, Math.floor(24 / coCustomCols.length))}
                >
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {col.column_label}
                  </div>
                  <Input
                    placeholder={`Nhập ${col.column_label}...`}
                    className="w-full rounded-md text-sm font-normal text-gray-700"
                    value={val}
                    onChange={(e) => updateCustomValue(valKey, e.target.value)}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </div>
  );
};

const ObjectiveOutcomeEditor = ({item, basePath}) => {
  const referenceData = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.reference_data ?? [],
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);
  const labelOverrides = useSyllabusStore((state) => state.labelOverrides) || {};
  const labels =
    labelOverrides.objective_outcomes ||
    labelOverrides.objectives_and_outcomes ||
    {};
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore((state) => state.updateCustomValue);

  const [allPlos, setAllPlos] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchPLOs = async () => {
      try {
        const res = await AppServices.getPLOs({page_size: 100});
        const dataArray = res.data?.results || res.data || [];
        if (isMounted) {
          setAllPlos(dataArray);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách PLO:", error);
      }
    };
    fetchPLOs();
    return () => {
      isMounted = false;
    };
  }, []);

  const allPlosMap = useMemo(() => {
    const map = {};
    allPlos.forEach((plo) => {
      map[plo.id] = plo;
    });
    return map;
  }, [allPlos]);

  const coCustomCols = customColumns.filter(
    (col) =>
      (col.table_code === "objective_outcomes" ||
        col.table_code === "objectives_and_outcomes") &&
      col.is_active !== false,
  );

  const handleItemChange = (index, updatedItem) => {
    const nextData = [...referenceData];
    nextData[index] = updatedItem;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleAddItem = () => {
    const newItem = {
      content: "",
      programme_learning_outcomes: [],
    };
    updateLocalBlock(item.code, {
      reference_data: [...referenceData, newItem],
    });
  };

  const handleRemoveItem = (index) => {
    const nextData = referenceData.filter((_, i) => i !== index);
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 mb-4">
        {referenceData.map((coItem, index) => (
          <ObjectiveOutcomeItem
            key={coItem.id ? `co_${coItem.id}` : `co_new_${index}`}
            itemData={coItem}
            index={index}
            labels={labels}
            coCustomCols={coCustomCols}
            customValues={customValues}
            updateCustomValue={updateCustomValue}
            allPlosMap={allPlosMap}
            onChange={(updated) => handleItemChange(index, updated)}
            onRemove={() => handleRemoveItem(index)}
          />
        ))}
      </div>

      <Button
        type="dashed"
        onClick={handleAddItem}
        block
        icon={<PlusOutlined />}
        className="h-10 border-gray-300 text-gray-600 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
      >
        Thêm Mục tiêu môn học (CO)
      </Button>
    </div>
  );
};

export default memo(ObjectiveOutcomeEditor);
