import React, {useState, useEffect, useRef} from "react";
import {Form, Input, Select, Button, Row, Col, message} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
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
        if (page === 1) {
          setSubjectsList(newData);
        } else {
          setSubjectsList((prev) => [...prev, ...newData]);
        }
      } else {
        message.error("Tải môn học thất bại");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer = setTimeout(() => {
      loadSubjects();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, q]);

  useEffect(() => {
    loadRequirementTypeOptions();
  }, []);

  const subjectOptions = subjectsList.map((sub) => ({
    label: `${sub.id} - ${sub.name}`,
    value: sub.id,
    subjectName: sub.name,
  }));

  const requirementTypeOptions = reqTypeRawData.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) {
        setPage((prev) => prev + 1);
      }
    }
  };

  const handleSearch = (keyword) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 500);
  };

  const handleSubjectSelect = (value, option, fieldName) => {
    form.setFieldValue(
      [...refPath, fieldName, "subject_name"],
      option.subjectName,
    );
  };

  const handleRequirementTypeSelect = (value, fieldName) => {
    const selectedObj = reqTypeRawData.find((item) => item.id === value);
    if (selectedObj) {
      form.setFieldValue([...refPath, fieldName, "requirement_type"], {
        id: selectedObj.id,
        name: selectedObj.name,
      });
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
      }}
    >
      <Form.List name={refPath}>
        {(fields, {add, remove}) => (
          <>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                overflowX: "hidden",
                paddingRight: "8px",
                marginBottom: fields.length > 0 ? "16px" : "0",
              }}
            >
              {fields.map(({key, name, ...restField}) => (
                <Row
                  key={key}
                  gutter={12}
                  align="bottom"
                  style={{
                    marginBottom: 12,
                    padding: "12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "6px",
                  }}
                >
                  <Form.Item {...restField} name={[name, "id"]} hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "subject_name"]}
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "subject_id"]}
                      label="Môn học điều kiện"
                      rules={[{required: true, message: "Vui lòng chọn môn"}]}
                      style={{marginBottom: 0}}
                    >
                      <Select
                        showSearch
                        placeholder="Chọn môn..."
                        options={subjectOptions}
                        loading={loading}
                        filterOption={false}
                        onSearch={handleSearch}
                        listHeight={250}
                        onChange={(val, opt) =>
                          handleSubjectSelect(val, opt, name)
                        }
                        onPopupScroll={handlePopupScroll}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, "requirement_type"]}
                      label="Loại điều kiện"
                      rules={[{required: true, message: "Chọn loại"}]}
                      style={{marginBottom: 0}}
                      getValueProps={(val) => ({
                        value: val && typeof val === "object" ? val.id : val,
                      })}
                    >
                      <Select
                        options={requirementTypeOptions}
                        placeholder="Chọn..."
                        onChange={(val) =>
                          handleRequirementTypeSelect(val, name)
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={2} style={{textAlign: "center"}}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
            </div>

            <Form.Item style={{marginBottom: 0}}>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Thêm môn học điều kiện
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default RequirementSubjectReference;
