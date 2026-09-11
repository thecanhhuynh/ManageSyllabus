import React, {useState, useEffect, memo} from "react";
import {Input, Select, Button, Row, Col, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {AppServices} from "../../services/AppServices";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const {TextArea} = Input;

const ObjectiveOutcomeItem = ({
  itemData,
  index,
  ploOptions,
  isFetching,
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

  const handlePloChange = (selectedIds) => {
    onChange({
      ...itemData,
      programme_learning_outcomes: selectedIds.map((id) => ({id})),
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 group hover:border-blue-300 transition-all">
      <Row gutter={16} align="top">
        <Col span={13}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-2 h-6">
            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px]">
              CO-{index + 1}
            </span>
            Nội dung mục tiêu
          </div>
          <TextArea
            autoSize={{minRows: 2, maxRows: 4}}
            placeholder="VD: Phân tích và đánh giá độ phức tạp..."
            className="rounded-md text-sm"
            value={itemData.content ?? ""}
            onChange={handleContentChange}
          />
        </Col>

        <Col span={10}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 h-6">
            <span className="text-gray-400">≈</span> Chuẩn đầu ra (PLO)
          </div>
          <Select
            mode="multiple"
            allowClear
            placeholder="Chọn PLO..."
            options={ploOptions}
            loading={isFetching}
            optionLabelProp="tagLabel"
            maxTagCount="responsive"
            className="w-full rounded-md"
            value={currentPloIds}
            onChange={handlePloChange}
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
    </div>
  );
};

const ObjectiveOutcomeEditor = ({item, basePath}) => {
  const [ploOptions, setPloOptions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const referenceData = useSyllabusStore(
    (state) => state.localBlocks[item.code]?.data?.reference_data ?? [],
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  useEffect(() => {
    const fetchPLOs = async () => {
      try {
        setIsFetching(true);
        const res = await AppServices.getPLOs();
        const data = res.data?.results || [];

        setPloOptions(
          data.map((plo) => ({
            label: (
              <Tooltip title={plo.description} placement="right">
                <span>
                  {plo.name} - {plo.description?.substring(0, 30)}...
                </span>
              </Tooltip>
            ),
            value: plo.id,
            tagLabel: plo.name,
          })),
        );
      } catch (error) {
        console.error("Lỗi tải PLO:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchPLOs();
  }, []);

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
            ploOptions={ploOptions}
            isFetching={isFetching}
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
