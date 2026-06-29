import React, {useState, useRef, useEffect} from "react";
import {Form, Input, AutoComplete, Button, message} from "antd";
import {PlusOutlined, BookOutlined, CloseOutlined} from "@ant-design/icons";
import Apis, {authApis, endpoints} from "../../config/Apis";

// Component con: Xử lý trạng thái hiển thị của từng Tài liệu (Pill tĩnh <-> Input động)
const MaterialItem = ({
  field,
  form,
  refPath,
  remove,
  materialOptions,
  loading,
  handleSearch,
  handlePopupScroll,
  handleMaterialChange,
}) => {
  const initialName = form.getFieldValue([...refPath, field.name, "name"]);
  // Nếu chưa có tên (vừa bấm Add), đặt isEditing = true để hiện ô nhập liệu
  const [isEditing, setIsEditing] = useState(!initialName);
  const inputRef = useRef(null);

  // Tự động focus vào ô nhập liệu khi chuyển sang Edit Mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const onConfirm = () => {
    // Dùng setTimeout nhỏ để AutoComplete kịp cập nhật value khi user chọn từ dropdown
    setTimeout(() => {
      const currentName = form.getFieldValue([...refPath, field.name, "name"]);
      if (currentName && currentName.trim() !== "") {
        setIsEditing(false); // Đã có chữ -> Thu nhỏ thành Pill
      } else {
        remove(field.name); // Bỏ trống -> Tự động xóa
      }
    }, 150);
  };

  return (
    <div className="flex items-center">
      {/* Input ẩn lưu trữ dữ liệu */}
      <Form.Item {...field} name={[field.name, "id"]} hidden>
        <Input />
      </Form.Item>
      <Form.Item {...field} name={[field.name, "type_material"]} hidden>
        <Input />
      </Form.Item>

      {!isEditing ? (
        /* UI: VIÊN THUỐC (PILL) KHI ĐÃ NHẬP XONG */
        <div className="group flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[13px] font-medium transition-all hover:bg-blue-100 h-8">
          <BookOutlined className="text-blue-500" />
          <span
            className="max-w-[250px] truncate cursor-pointer hover:underline"
            title={form.getFieldValue([...refPath, field.name, "name"])}
            onClick={() => setIsEditing(true)} // Click vào chữ để sửa lại
          >
            {form.getFieldValue([...refPath, field.name, "name"])}
          </span>
          <CloseOutlined
            className="cursor-pointer text-blue-400 hover:text-red-500 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
            onClick={() => remove(field.name)}
          />
          {/* Nơi chứa name thật khi ở dạng Pill */}
          <Form.Item {...field} name={[field.name, "name"]} hidden>
            <Input />
          </Form.Item>
        </div>
      ) : (
        /* UI: Ô AUTOCOMPLETE KHI ĐANG NHẬP LIỆU */
        <div className="flex items-center bg-white border border-blue-400 rounded-full pl-3 pr-1 h-8 shadow-sm transition-all hover:border-blue-500">
          <Form.Item
            {...field}
            name={[field.name, "name"]}
            rules={[{required: true, message: "Nhập tên tài liệu"}]}
            className="mb-0"
            style={{width: 220}}
          >
            <AutoComplete
              ref={inputRef}
              bordered={false}
              placeholder="Nhập tên tài liệu / sách..."
              options={materialOptions}
              onSearch={handleSearch}
              onPopupScroll={handlePopupScroll}
              onChange={(val) => handleMaterialChange(val, field.name)}
              onSelect={onConfirm}
              onBlur={onConfirm}
              className="w-full text-[13px]"
              notFoundContent={loading ? "Đang tìm..." : "Gõ để tạo sách mới"}
            />
          </Form.Item>
          <Button
            type="text"
            danger
            shape="circle"
            icon={<CloseOutlined className="text-[11px]" />}
            onClick={() => remove(field.name)}
            size="small"
            className="w-6 h-6 min-w-0 flex items-center justify-center bg-gray-50 hover:bg-red-50 ml-1"
          />
        </div>
      )}
    </div>
  );
};

const LearningMaterialReference = ({refPath}) => {
  const form = Form.useFormInstance();

  const [materialOptions, setMaterialOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);

  const loadTypeOptions = async () => {
    try {
      const res = await Apis.get(endpoints["type-materials"]);
      // Lưu thẳng mảng gốc {id, name} để dùng cho map Categories
      setMaterialTypeOptions(res.data);
    } catch (error) {
      console.log(error);
      message.error("Lỗi tải loại tài liệu");
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      let url = `${endpoints["learning-materials"]}?page=${page}`;
      if (q) url += `&q=${q}`;

      const res = await authApis().get(url);
      if (res.status === 200) {
        const newData = res.data.results.map((mat) => ({
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

  useEffect(() => {
    loadTypeOptions();
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [page, q]);

  const handleSearchMaterials = (keyword) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 500);
  };

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) setPage((prev) => prev + 1);
    }
  };

  const handleMaterialChange = (value, nameFieldPath) => {
    const matchedOption = materialOptions.find((opt) => opt.value === value);
    const idFieldPath = [...refPath, nameFieldPath, "id"];

    if (matchedOption) {
      form.setFieldValue(idFieldPath, matchedOption.id);
    } else {
      form.setFieldValue(idFieldPath, "");
    }
  };

  // Hàm chuẩn hóa ID
  const getMatTypeId = (val) => {
    if (!val) return null;
    return typeof val === "object" ? val.id : val;
  };

  return (
    <div className="w-full">
      <Form.List name={refPath}>
        {(fields, {add, remove}) => (
          <div className="flex flex-col gap-4">
            {materialTypeOptions.map((matType) => {
              // Lấy an toàn các field thuộc Category hiện tại (Không dùng useWatch để chống lag)
              const typeFields = fields.filter((field) => {
                const val = form.getFieldValue([
                  ...refPath,
                  field.name,
                  "type_material",
                ]);
                if (!val) return false;
                return String(getMatTypeId(val)) === String(matType.id);
              });

              return (
                <div
                  key={matType.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  {/* HEADER CỦA CATEGORY TÀI LIỆU */}
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {matType.name}
                    </span>
                  </div>

                  {/* DANH SÁCH TÀI LIỆU */}
                  <div className="p-3 flex flex-wrap gap-2 items-center min-h-[54px]">
                    {typeFields.map((field) => (
                      <MaterialItem
                        key={field.key}
                        field={field}
                        form={form}
                        refPath={refPath}
                        remove={remove}
                        materialOptions={materialOptions}
                        loading={loading}
                        handleSearch={handleSearchMaterials}
                        handlePopupScroll={handlePopupScroll}
                        handleMaterialChange={handleMaterialChange}
                      />
                    ))}

                    {/* NÚT THÊM TÀI LIỆU */}
                    <div
                      className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full text-[13px] font-medium hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all select-none h-8"
                      onClick={() =>
                        add({
                          type_material: {id: matType.id, name: matType.name},
                        })
                      }
                    >
                      <PlusOutlined className="text-[11px]" />
                      <span>Thêm Tài liệu</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Form.List>
    </div>
  );
};

export default LearningMaterialReference;
