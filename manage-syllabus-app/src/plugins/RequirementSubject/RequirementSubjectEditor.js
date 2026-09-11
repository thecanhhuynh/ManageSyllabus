import React, {useState, useEffect, useRef, memo} from "react";
import {Select, Button, message} from "antd";
import {PlusOutlined, BookOutlined, CloseOutlined} from "@ant-design/icons";
import {AppServices} from "../../services/AppServices";
import {useSyllabusStore} from "../../store/useSyllabusStore";

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
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [q, setQ] = useState("");
  const searchTimeoutRef = useRef(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await AppServices.getSubjects(page, q);
      if (res.status === 200) {
        const newData = res.data.results || res.data || [];
        setHasNext(res.data.next != null);
        if (page === 1) setSubjectsList(newData);
        else setSubjectsList((prev) => [...prev, ...newData]);
      }
    } catch (error) {
      console.error("Lỗi tải môn học:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSubjects(), 300);
    return () => clearTimeout(timer);
  }, [page, q]);

  const handleSearch = (keyword) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 300);
  };

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex items-center bg-white border border-blue-400 rounded-full pl-3 pr-1 h-8 shadow-sm">
      <Select
        showSearch
        autoFocus
        defaultOpen
        bordered={false}
        placeholder="Tìm môn..."
        filterOption={false}
        loading={loading}
        onSearch={handleSearch}
        onPopupScroll={handlePopupScroll}
        style={{width: 180}}
        className="text-[13px]"
        onChange={(val, opt) => {
          onSelect({
            subject_id: opt.value,
            subject_name: opt.subjectName,
            subject_code: opt.subjectCode,
          });
        }}
        options={subjectsList.map((sub) => ({
          label: `${sub.code} - ${sub.name}`,
          value: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code,
        }))}
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
    </div>
  );
};

export default memo(RequirementSubjectEditor);
