import React, {useState, useEffect, useRef} from "react";
import {Form, Input, Select, Button, message} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BookOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";

const RequirementSubjectReference = ({refPath}) => {
  const form = Form.useFormInstance();
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [q, setQ] = useState("");
  const searchTimeoutRef = useRef(null);
  const [reqTypeRawData, setReqTypeRawData] = useState([]);

  const loadRequirementTypeOptions = async () => {
    try {
      const res = await authApis().get(endpoints["type-requirements"]);
      setReqTypeRawData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      let url = `${endpoints["subjects"]}?page=${page}`;
      if (q) url += `&q=${q}`;
      const res = await authApis().get(url);
      if (res.status === 200) {
        const newData = res.data.results;
        setHasNext(res.data.next != null);
        if (page === 1) setSubjectsList(newData);
        else setSubjectsList((prev) => [...prev, ...newData]);
      } else message.error("Tải môn học thất bại");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer = setTimeout(() => loadSubjects(), 500);
    return () => clearTimeout(timer);
  }, [page, q]);

  useEffect(() => {
    loadRequirementTypeOptions();
  }, []);

  const subjectOptions = subjectsList.map((sub) => ({
    label: `${sub.code} - ${sub.name}`,
    value: sub.id,
    subjectName: sub.name,
    subjectCode: sub.code,
  }));

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) setPage((prev) => prev + 1);
    }
  };

  const handleSearch = (keyword) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 500);
  };

  return (
    <div className="w-full">
      <Form.List name={refPath}>
        {(fields, {add, remove}) => (
          <div className="flex flex-col gap-4">
            {reqTypeRawData.map((reqType) => {
              const typeFields = fields.filter((field) => {
                const val = form.getFieldValue([
                  ...refPath,
                  field.name,
                  "requirement_type",
                ]);
                if (!val) return false;
                const id = typeof val === "object" ? val.id : val;
                return String(id) === String(reqType.id);
              });

              return (
                <div
                  key={reqType.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {reqType.name}
                    </span>
                  </div>

                  <div className="p-3 flex flex-wrap gap-2 items-center min-h-[54px]">
                    {typeFields.map((field) => (
                      <div key={field.key} className="flex items-center">
                        <Form.Item {...field} name={[field.name, "id"]} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "subject_name"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, "requirement_type"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item shouldUpdate noStyle>
                          {() => {
                            const subjectId = form.getFieldValue([
                              ...refPath,
                              field.name,
                              "subject_id",
                            ]);
                            let subjectName = form.getFieldValue([
                              ...refPath,
                              field.name,
                              "subject_name",
                            ]);
                            let subjectCode = form.getFieldValue([
                              ...refPath,
                              field.name,
                              "subject_code",
                            ]);

                            if (!subjectName && subjectId) {
                              const found = subjectsList.find(
                                (s) => s.id === subjectId,
                              );
                              if (found) {
                                subjectName = found.name;
                                subjectCode = found.code;
                              }
                            }
                            const displayText =
                              subjectCode && subjectName
                                ? `${subjectCode} - ${subjectName}`
                                : subjectName || "Đang tải...";
                            return subjectId ? (
                              <div className="group flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[13px] font-medium transition-all hover:bg-blue-100 h-8">
                                <BookOutlined className="text-blue-500" />
                                <span
                                  className="max-w-[200px] truncate"
                                  title={displayText}
                                >
                                  {displayText}
                                </span>
                                <CloseOutlined
                                  className="cursor-pointer text-blue-400 hover:text-red-500 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                  onClick={() => remove(field.name)}
                                />
                                <Form.Item
                                  {...field}
                                  name={[field.name, "subject_id"]}
                                  hidden
                                >
                                  <Input />
                                </Form.Item>
                              </div>
                            ) : (
                              <div className="flex items-center bg-white border border-blue-400 rounded-full pl-3 pr-1 h-8 shadow-sm transition-all hover:border-blue-500">
                                <Form.Item
                                  {...field}
                                  name={[field.name, "subject_id"]}
                                  rules={[
                                    {required: true, message: "Chọn môn"},
                                  ]}
                                  className="mb-0"
                                  style={{width: 180}}
                                >
                                  <Select
                                    showSearch
                                    autoFocus
                                    bordered={false}
                                    placeholder="Tìm môn học..."
                                    options={subjectOptions}
                                    loading={loading}
                                    filterOption={false}
                                    onSearch={handleSearch}
                                    listHeight={250}
                                    onChange={(val, opt) => {
                                      form.setFieldValue(
                                        [
                                          ...refPath,
                                          field.name,
                                          "subject_name",
                                        ],
                                        opt.subjectName,
                                      );
                                      form.setFieldValue(
                                        [
                                          ...refPath,
                                          field.name,
                                          "subject_code",
                                        ],
                                        opt.subjectCode,
                                      );
                                    }}
                                    onPopupScroll={handlePopupScroll}
                                    className="w-full text-[13px]"
                                  />
                                </Form.Item>
                                <Button
                                  type="text"
                                  danger
                                  shape="circle"
                                  icon={
                                    <CloseOutlined className="text-[11px]" />
                                  }
                                  onClick={() => remove(field.name)}
                                  size="small"
                                  className="w-6 h-6 min-w-0 flex items-center justify-center bg-gray-50 hover:bg-red-50"
                                />
                              </div>
                            );
                          }}
                        </Form.Item>
                      </div>
                    ))}

                    <div
                      className="flex items-center gap-1.5 border border-dashed border-gray-300 text-gray-500 px-3 py-1 rounded-full text-[13px] font-medium hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all select-none h-8"
                      onClick={() =>
                        add({
                          requirement_type: {
                            id: reqType.id,
                            name: reqType.name,
                          },
                        })
                      }
                    >
                      <PlusOutlined className="text-[11px]" />
                      <span>Thêm môn</span>
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

export default RequirementSubjectReference;
