import React, {useState, useRef, useEffect} from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  AutoComplete,
  message,
} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import Apis, {authApis, endpoints} from "../../config/Apis";

const LearningMaterialReference = ({refPath}) => {
  const form = Form.useFormInstance();

  const [materialOptions, setMaterialOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [materialTypeOptions, setMaterialTypeOptions] = useState([]);
  const [loadingType, setLoadingType] = useState(false);

  const loadTypeOptions = async () => {
    try {
      setLoadingType(true);
      const res = await Apis.get(endpoints["type-materials"]);

      const options = res.data.map((item) => ({
        label: item.name,
        value: item.id,
        typeObj: {id: item.id, name: item.name},
      }));
      setMaterialTypeOptions(options);
    } catch (error) {
      console.log(error);
      message.error("Lỗi tải loại tài liệu");
    } finally {
      setLoadingType(false);
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

        if (page === 1) {
          setMaterialOptions(newData);
        } else {
          setMaterialOptions((prev) => [...prev, ...newData]);
        }
      }
    } catch (error) {
      console.error("Lỗi tải tài liệu:", error);
      message.error("Không thể tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypeOptions();
  }, []);

  useEffect(() => {
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  const handleSearchMaterials = (keyword) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setQ(keyword);
      setPage(1);
    }, 500);
  };

  const handlePopupScroll = (e) => {
    const {target} = e;
    if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
      if (hasNext && !loading) {
        setPage((prev) => prev + 1);
      }
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

                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label="Tên tài liệu / Sách"
                      rules={[
                        {required: true, message: "Vui lòng nhập tên tài liệu"},
                      ]}
                      style={{marginBottom: 0}}
                    >
                      <AutoComplete
                        options={materialOptions}
                        onSearch={handleSearchMaterials}
                        onPopupScroll={handlePopupScroll}
                        onChange={(value) => handleMaterialChange(value, name)}
                        placeholder="VD: Introduction to Algorithms - CLRS"
                        notFoundContent={
                          loading
                            ? "Đang tìm..."
                            : "Gõ để tạo sách mới nếu chưa có"
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "type_material"]}
                      label="Loại tài liệu"
                      rules={[{required: true, message: "Vui lòng chọn loại"}]}
                      style={{marginBottom: 0}}
                      getValueProps={(val) => ({
                        value: val && typeof val === "object" ? val.id : val,
                      })}
                      getValueFromEvent={(val, option) => option.typeObj}
                    >
                      <Select
                        options={materialTypeOptions}
                        loading={loadingType}
                        placeholder="Chọn phân loại..."
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
                Thêm tài liệu học tập
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default LearningMaterialReference;
