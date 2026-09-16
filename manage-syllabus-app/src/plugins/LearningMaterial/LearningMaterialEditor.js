import React, {useState, useRef, useEffect, memo} from "react";
import {AutoComplete, Button, message} from "antd";
import {PlusOutlined, BookOutlined, CloseOutlined} from "@ant-design/icons";
import Apis, {authApis, endpoints} from "../../config/Apis";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const EMPTY_ARRAY = [];

const MaterialTagItem = ({
  material,
  materialOptions,
  loading,
  onSearch,
  onPopupScroll,
  onChangeMaterial,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(!material.name);
  const inputRef = useRef(null);
  const latestNameRef = useRef(material.name || "");
  const isSelectingRef = useRef(false);

  useEffect(() => {
    latestNameRef.current = material.name || "";
  }, [material.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const onConfirm = () => {
    setTimeout(() => {
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }

      const currentVal = (latestNameRef.current || "").trim();
      console.log(">>> [CONFIRM CHECK]:", {
        currentVal,
        materialPropName: material.name,
      });

      if (currentVal !== "") {
        console.log("    -> Giữ tài liệu, đóng chế độ edit.");
        setIsEditing(false);
      } else {
        console.warn("    -> Tên rỗng, xóa tài liệu khỏi danh sách!");
        onRemove();
      }
    }, 200);
  };

  if (!isEditing && material.name) {
    return (
      <div className="group flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[13px] font-medium transition-all hover:bg-blue-100 h-8">
        <BookOutlined className="text-blue-500" />
        <span
          className="max-w-[250px] truncate cursor-pointer hover:underline"
          title={material.name}
          onClick={() => setIsEditing(true)}
        >
          {material.name}
        </span>
        <CloseOutlined
          className="cursor-pointer text-blue-400 hover:text-red-500 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center bg-white border border-blue-400 rounded-full pl-3 pr-1 h-8 shadow-sm transition-all hover:border-blue-500">
      <AutoComplete
        ref={inputRef}
        bordered={false}
        placeholder="Nhập tên tài liệu / sách..."
        options={materialOptions}
        value={material.name || ""}
        onSearch={onSearch}
        onPopupScroll={onPopupScroll}
        onChange={(val) => {
          console.log(">>> [AUTOCOMPLETE ON_CHANGE]:", val);
          latestNameRef.current = val;
          const matched = materialOptions.find((opt) => opt.value === val);
          onChangeMaterial({
            ...material,
            id: matched ? matched.id : undefined,
            name: val,
          });
        }}
        onSelect={(val, option) => {
          console.log(">>> [AUTOCOMPLETE ON_SELECT]:", {val, option});
          isSelectingRef.current = true;
          latestNameRef.current = val;
          onChangeMaterial({
            ...material,
            id: option.id,
            name: val,
          });
          setIsEditing(false);
        }}
        onBlur={() => {
          console.log(">>> [AUTOCOMPLETE ON_BLUR TRIGGERED]");
          onConfirm();
        }}
        className="w-[220px] text-[13px]"
        notFoundContent={loading ? "Đang tìm..." : "Gõ để tạo sách mới"}
      />
      <Button
        type="text"
        danger
        shape="circle"
        icon={<CloseOutlined className="text-[11px]" />}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        size="small"
        className="w-6 h-6 min-w-0 flex items-center justify-center bg-gray-50 hover:bg-red-50 ml-1"
      />
    </div>
  );
};

const LearningMaterialEditor = ({item, basePath}) => {
  const referenceData = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.reference_data || EMPTY_ARRAY,
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  const [materialOptions, setMaterialOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);

  useEffect(() => {
    const loadTypeOptions = async () => {
      try {
        const res = await Apis.get(endpoints["type-materials"]);
        setMaterialTypeOptions(res.data || []);
      } catch (error) {
        console.error("Lỗi tải loại tài liệu:", error);
        message.error("Lỗi tải loại tài liệu");
      }
    };
    loadTypeOptions();
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true);
        let url = `${endpoints["learning-materials"]}?page=${page}`;
        if (q) url += `&q=${q}`;

        const res = await authApis().get(url);
        if (res.status === 200) {
          const newData = (res.data.results || []).map((mat) => ({
            value: mat.name,
            id: mat.id,
          }));

          setHasNext(res.data.next != null);
          if (page === 1) setMaterialOptions(newData);
          else setMaterialOptions((prev) => [...prev, ...newData]);
        }
      } catch (error) {
        console.error("Lỗi tải tài liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, [page, q]);

  const handleSearchMaterials = (keyword) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 400);
  };

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) setPage((prev) => prev + 1);
    }
  };

  const handleAddMaterial = (matType) => {
    const currentList =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];
    const newItem = {
      _temp_id: `temp_${Date.now()}_${Math.random()}`,
      name: "",
      type_material: {id: matType.id, name: matType.name},
    };
    console.log(">>> [STORE ADD MATERIAL]:", newItem);
    updateLocalBlock(item.code, {
      reference_data: [...currentList, newItem],
    });
  };

  const handleUpdateMaterial = (globalIndex, updatedMaterial) => {
    const currentList =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];
    const nextData = [...currentList];
    console.log(
      ">>> [STORE UPDATE MATERIAL AT INDEX " + globalIndex + "]:",
      updatedMaterial,
    );
    nextData[globalIndex] = updatedMaterial;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleRemoveMaterial = (globalIndex) => {
    const currentList =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];
    console.log(">>> [STORE REMOVE MATERIAL AT INDEX " + globalIndex + "]");
    const nextData = currentList.filter((_, idx) => idx !== globalIndex);
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {materialTypeOptions.map((matType) => {
        const groupMaterialsWithIndex = referenceData
          .map((mat, index) => ({mat, globalIndex: index}))
          .filter(({mat}) => {
            const typeId =
              typeof mat.type_material === "object"
                ? mat.type_material?.id
                : mat.type_material;
            return String(typeId) === String(matType.id);
          });

        return (
          <div
            key={matType.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          >
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {matType.name}
              </span>
            </div>

            <div className="p-3 flex flex-wrap gap-2 items-center min-h-[54px]">
              {groupMaterialsWithIndex.map(({mat, globalIndex}) => {
                const stableKey =
                  mat._temp_id ||
                  (mat.id ? `mat_${mat.id}` : `mat_idx_${globalIndex}`);

                return (
                  <MaterialTagItem
                    key={stableKey}
                    material={mat}
                    materialOptions={materialOptions}
                    loading={loading}
                    onSearch={handleSearchMaterials}
                    onPopupScroll={handlePopupScroll}
                    onChangeMaterial={(updated) =>
                      handleUpdateMaterial(globalIndex, updated)
                    }
                    onRemove={() => handleRemoveMaterial(globalIndex)}
                  />
                );
              })}

              <div
                className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full text-[13px] font-medium hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all select-none h-8"
                onClick={() => handleAddMaterial(matType)}
              >
                <PlusOutlined className="text-[11px]" />
                <span>Thêm Tài liệu</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(LearningMaterialEditor);
