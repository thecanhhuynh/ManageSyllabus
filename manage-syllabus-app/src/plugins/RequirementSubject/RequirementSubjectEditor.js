import React, {useState, useEffect, memo} from "react";
import {Button, message} from "antd";
import {PlusOutlined, BookOutlined, CloseOutlined} from "@ant-design/icons";
import {AppServices} from "../../services/AppServices";
import {useSyllabusStore} from "../../store/useSyllabusStore";
import {endpoints} from "../../config/Apis";
import LazySelect from "../../components/common/LazySelect";

const EMPTY_ARRAY = [];

const SubjectBadge = ({item, onRemove}) => {
  const displayText =
    item.subject_code && item.subject_name
      ? `${item.subject_code} - ${item.subject_name}`
      : item.subject_name || item.subject_code || "Môn học";

  return (
    <div className="group flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[13px] font-medium transition-all hover:bg-blue-100 h-8">
      <BookOutlined className="text-blue-500" />
      <span className="max-w-[200px] truncate" title={displayText}>
        {displayText}
      </span>
      <span
        className="cursor-pointer p-0.5 rounded-full hover:bg-blue-200 flex items-center justify-center text-blue-400 hover:text-red-500 ml-1 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <CloseOutlined className="text-[11px]" />
      </span>
    </div>
  );
};

const SubjectSearchTag = ({onSelect, onCancel}) => {
  return (
    <div className="flex items-center bg-white border border-blue-400 rounded-full pl-3 pr-1 h-8 shadow-sm">
      <LazySelect
        endpoint={endpoints["subjects"]}
        autoFocus
        defaultOpen
        bordered={false}
        placeholder="Tìm môn..."
        style={{width: 180}}
        className="text-[13px]"
        labelField={(sub) => `${sub.code} - ${sub.name}`}
        onChange={(val, opt) => {
          const raw = opt?.raw || {};
          onSelect({
            subject_id: val,
            subject_name: raw.name || opt?.label,
            subject_code: raw.code,
          });
        }}
      />
      <Button
        type="text"
        danger
        shape="circle"
        icon={<CloseOutlined className="text-[11px]" />}
        onClick={onCancel}
        size="small"
        className="w-6 h-6 min-w-0 flex items-center justify-center bg-gray-50 hover:bg-red-50"
      />
    </div>
  );
};

const RequirementGroupCard = ({
  reqType,
  items,
  onAddSubject,
  onRemoveSubject,
}) => {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {reqType.name}
        </span>
      </div>

      <div className="p-3 flex flex-wrap gap-2 items-center min-h-[54px]">
        {items.map((entry) => {
          const targetId = entry.subject_id ?? entry.id;
          const itemKey = `grp_${reqType.id}_sub_${targetId}`;

          return (
            <SubjectBadge
              key={itemKey}
              item={entry}
              onRemove={() => onRemoveSubject(targetId, reqType.id)}
            />
          );
        })}

        {isAdding ? (
          <SubjectSearchTag
            onSelect={(selectedSub) => {
              onAddSubject(reqType, selectedSub);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        ) : (
          <div
            className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full text-[13px] font-medium hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all select-none h-8"
            onClick={() => setIsAdding(true)}
          >
            <PlusOutlined className="text-[11px]" />
            <span>Thêm môn</span>
          </div>
        )}
      </div>
    </div>
  );
};

const RequirementSubjectEditor = ({item, basePath}) => {
  const [reqTypeRawData, setReqTypeRawData] = useState([]);

  const referenceData = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.reference_data || EMPTY_ARRAY,
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore((state) => state.updateCustomValue);

  const reqCustomCols = customColumns.filter(
    (col) => col.table_code === "requirement_subject" && col.is_active !== false,
  );

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const res = await AppServices.getReqTypes();
        if (res.data) setReqTypeRawData(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh mục điều kiện:", error);
      }
    };
    loadTypes();
  }, []);

  const handleAddSubject = (reqType, selectedSub) => {
    const currentSyllabus = useSyllabusStore.getState().currentSyllabus;
    const currentSubjectId = currentSyllabus?.subject?.id;
    if (currentSubjectId && String(currentSubjectId) === String(selectedSub.subject_id)) {
      message.error("Môn học không thể là môn điều kiện của chính nó!");
      return;
    }

    const currentList =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];

    const isDuplicate = currentList.some(
      (entry) =>
        String(entry.subject_id ?? entry.id) === String(selectedSub.subject_id),
    );

    if (isDuplicate) {
      message.warning("Môn học này đã được chọn!");
      return;
    }

    const newItem = {
      subject_id: String(selectedSub.subject_id),
      subject_name: selectedSub.subject_name,
      subject_code: selectedSub.subject_code,
      requirement_type: {
        id: reqType.id,
        name: reqType.name,
      },
    };

    const nextList = [...currentList, newItem];

    updateLocalBlock(item.code, {
      reference_data: nextList,
    });
  };

  const handleRemoveSubject = (targetId, reqTypeId) => {
    if (targetId === undefined || targetId === null) {
      console.warn("    [CẢNH BÁO] targetId bị null hoặc undefined, bỏ qua!");
      return;
    }

    const currentList =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];

    const nextData = currentList.filter((entry) => {
      const entrySubId = String(entry.subject_id ?? entry.id);
      const entryTypeId = String(
        typeof entry.requirement_type === "object"
          ? entry.requirement_type?.id
          : entry.requirement_type,
      );

      const isMatch =
        entrySubId === String(targetId) && entryTypeId === String(reqTypeId);
      return !isMatch;
    });

    updateLocalBlock(item.code, {reference_data: nextData});
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {reqTypeRawData.map((reqType) => {
        const groupItems = referenceData.filter((entry) => {
          const typeId =
            typeof entry.requirement_type === "object"
              ? entry.requirement_type?.id
              : entry.requirement_type;
          return String(typeId) === String(reqType.id);
        });

        return (
          <RequirementGroupCard
            key={reqType.id}
            reqType={reqType}
            items={groupItems}
            onAddSubject={handleAddSubject}
            onRemoveSubject={handleRemoveSubject}
          />
        );
      })}

      {reqCustomCols.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Thông tin bổ sung
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reqCustomCols.map((col) => {
              const val = customValues[col.id] ?? col.default_value ?? "";
              return (
                <div key={col.id}>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {col.column_label}
                  </div>
                  <input
                    placeholder={`Nhập ${col.column_label}...`}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-normal text-gray-700 outline-none focus:border-blue-500"
                    value={val}
                    onChange={(e) => updateCustomValue(col.id, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(RequirementSubjectEditor);
