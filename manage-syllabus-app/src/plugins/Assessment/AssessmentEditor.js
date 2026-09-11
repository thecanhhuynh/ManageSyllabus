import React, {useMemo, memo} from "react";
import {Input, Select, Button, Row, Col, InputNumber, Progress} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const EMPTY_ARRAY = [];

const AssessmentMethodRow = ({
  method,
  methodIdx,
  cloOptions,
  onChange,
  onRemove,
}) => {
  const selectedCloIds = useMemo(() => {
    return (method.course_learning_outcomes || []).map((clo) =>
      typeof clo === "object" ? clo.id : clo,
    );
  }, [method.course_learning_outcomes]);

  const handleFieldChange = (field, value) => {
    onChange({
      ...method,
      [field]: value,
    });
  };

  const handleCloChange = (selectedIds) => {
    onChange({
      ...method,
      course_learning_outcomes: (selectedIds || []).map((id) => ({id})),
    });
  };

  return (
    <Row
      gutter={12}
      className="items-end bg-gray-50/50 p-3 rounded-lg border border-gray-100 group hover:border-blue-200 transition-colors"
    >
      <Col span={7}>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Phương pháp
        </div>
        <Input
          placeholder="VD: Thi tự luận"
          value={method.name ?? ""}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          className="rounded-md text-[13px]"
        />
      </Col>

      <Col span={5}>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Thời gian
        </div>
        <Input
          prefix={<ClockCircleOutlined className="text-gray-400" />}
          placeholder="VD: 60 phút"
          value={method.time ?? ""}
          onChange={(e) => handleFieldChange("time", e.target.value)}
          className="rounded-md text-[13px]"
        />
      </Col>

      <Col span={4}>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Trọng số
        </div>
        <InputNumber
          min={0}
          max={100}
          addonAfter={<PercentageOutlined />}
          placeholder="0"
          value={method.weight ?? 0}
          onChange={(val) => handleFieldChange("weight", Number(val || 0))}
          className="w-full text-[13px] rounded-md"
        />
      </Col>

      <Col span={7}>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Đánh giá CLO
        </div>
        <Select
          mode="multiple"
          allowClear
          placeholder="Chọn CLOs..."
          options={cloOptions}
          optionLabelProp="tagLabel"
          maxTagCount="responsive"
          value={selectedCloIds}
          onChange={handleCloChange}
          className="w-full rounded-md"
        />
      </Col>

      <Col span={1} className="flex justify-center pb-1">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          className="opacity-40 group-hover:opacity-100 hover:bg-red-50"
        />
      </Col>
    </Row>
  );
};

const AssessmentGroupCard = ({group, groupIdx, cloOptions, onUpdateGroup}) => {
  const typeName =
    group?.type_assessment?.name || `Loại đánh giá ${groupIdx + 1}`;

  const methods = group?.assessment_methods || [];
  const totalWeight = useMemo(() => {
    return methods.reduce(
      (sum, method) => sum + (Number(method?.weight) || 0),
      0,
    );
  }, [methods]);

  const handleAddMethod = () => {
    const newMethod = {
      name: "",
      time: "",
      weight: 0,
      course_learning_outcomes: [],
    };
    onUpdateGroup({
      ...group,
      assessment_methods: [...methods, newMethod],
    });
  };

  const handleUpdateMethod = (methodIdx, updatedMethod) => {
    const nextMethods = [...methods];
    nextMethods[methodIdx] = updatedMethod;
    onUpdateGroup({
      ...group,
      assessment_methods: nextMethods,
    });
  };

  const handleRemoveMethod = (methodIdx) => {
    const nextMethods = methods.filter((_, idx) => idx !== methodIdx);
    onUpdateGroup({
      ...group,
      assessment_methods: nextMethods,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center">
        <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
          {typeName}
        </span>
        <span
          className={`text-[12px] font-bold px-3 py-1 rounded-full ${
            totalWeight > 0
              ? "bg-blue-50 text-blue-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          Tổng: {totalWeight}%
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-3">
          {methods.map((method, methodIdx) => (
            <AssessmentMethodRow
              key={
                method.id ? `method_${method.id}` : `method_temp_${methodIdx}`
              }
              method={method}
              methodIdx={methodIdx}
              cloOptions={cloOptions}
              onChange={(updated) => handleUpdateMethod(methodIdx, updated)}
              onRemove={() => handleRemoveMethod(methodIdx)}
            />
          ))}

          <Button
            type="dashed"
            onClick={handleAddMethod}
            icon={<PlusOutlined />}
            className="h-10 mt-2 border-gray-300 text-gray-500 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
          >
            Thêm phương pháp {typeName}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AssessmentEditor = ({item, basePath}) => {
  const referenceData = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.reference_data || EMPTY_ARRAY,
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  const rawCloData = useSyllabusStore((state) => {
    const targetBlock = Object.values(state.localBlocks).find(
      (b) =>
        b.data?.reference_code === "course_learning_outcomes" ||
        b.data?.code === "course_learning_outcomes",
    );
    return targetBlock?.data?.reference_data || EMPTY_ARRAY;
  });

  const cloOptions = useMemo(() => {
    const options = [];
    (rawCloData || []).forEach((co, coIdx) => {
      (co.clos || []).forEach((clo, cloIdx) => {
        if (!clo.id && !clo.content) return;
        const cloCode = `CLO${coIdx + 1}.${cloIdx + 1}`;
        options.push({
          label: (
            <div className="flex flex-col border-b border-gray-50 pb-1">
              <span className="font-bold text-blue-600 text-xs">{cloCode}</span>
              <span
                className="text-gray-500 text-xs truncate max-w-[250px]"
                title={clo.content}
              >
                {clo.content || "Chưa có nội dung"}
              </span>
            </div>
          ),
          value: clo.id || `${coIdx}-${cloIdx}`,
          tagLabel: cloCode,
        });
      });
    });
    return options;
  }, [rawCloData]);

  const grandTotalWeight = useMemo(() => {
    return (referenceData || []).reduce((sum, group) => {
      const methods = group?.assessment_methods || [];
      return (
        sum +
        methods.reduce(
          (mSum, method) => mSum + (Number(method?.weight) || 0),
          0,
        )
      );
    }, 0);
  }, [referenceData]);

  let status = "active";
  let strokeColor = "#3b82f6";
  if (grandTotalWeight === 100) {
    status = "success";
    strokeColor = "#10b981";
  } else if (grandTotalWeight > 100) {
    status = "exception";
    strokeColor = "#ef4444";
  }

  const handleUpdateGroup = (groupIdx, updatedGroup) => {
    const nextData = [...referenceData];
    nextData[groupIdx] = updatedGroup;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  return (
    <div className="w-full">
      <div className="mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
            Tổng trọng số đánh giá học phần
          </span>
          <span
            className={`font-bold text-sm ${
              grandTotalWeight === 100
                ? "text-green-600"
                : grandTotalWeight > 100
                  ? "text-red-500"
                  : "text-blue-600"
            }`}
          >
            {grandTotalWeight}% / 100%
          </span>
        </div>
        <Progress
          percent={grandTotalWeight > 100 ? 100 : grandTotalWeight}
          strokeColor={strokeColor}
          showInfo={false}
          status={status}
          size="small"
        />
        {grandTotalWeight !== 100 && grandTotalWeight > 0 && (
          <div className="text-[11px] text-red-500 mt-2 italic font-medium">
            * Cảnh báo: Tổng trọng số phải bằng chính xác 100% để có thể lưu dữ
            liệu.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {(referenceData || []).map((group, groupIdx) => (
          <AssessmentGroupCard
            key={group.id ? `assessment_${group.id}` : `group_${groupIdx}`}
            group={group}
            groupIdx={groupIdx}
            cloOptions={cloOptions}
            onUpdateGroup={(updated) => handleUpdateGroup(groupIdx, updated)}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(AssessmentEditor);
