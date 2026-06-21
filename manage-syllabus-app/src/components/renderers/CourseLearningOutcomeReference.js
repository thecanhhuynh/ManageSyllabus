import React, {useState, useEffect} from "react";
import {
  Form,
  Input,
  Button,
  Tabs,
  Row,
  Col,
  InputNumber,
  Table,
  Typography,
} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import Apis, {endpoints} from "../../config/Apis";
import "./style.css";

const {TextArea} = Input;
const {Text} = Typography;

const CourseLearningOutcomeReference = ({refPath}) => {
  const form = Form.useFormInstance();
  const [ploOptions, setPloOptions] = useState([]);

  // 1. Fetch danh sách PLO từ API
  useEffect(() => {
    const fetchPLOs = async () => {
      try {
        const res = await Apis.get(endpoints["programme-learning-outcomes"]);
        const dataArray = res.data.results || res.data || [];
        const options = dataArray.map((plo) => ({
          label: plo.name || `PLO${plo.id}`,
          value: plo.id,
        }));
        setPloOptions(options);
      } catch (error) {
        console.error("Lỗi tải PLO", error);
      }
    };
    fetchPLOs();
  }, []);

  // 2. Tìm đường dẫn và theo dõi dữ liệu của phần CO
  const parentPath = refPath.slice(0, -2);
  const allSubSections = form.getFieldValue(parentPath) || [];
  const coIndex = allSubSections.findIndex(
    (sub) => sub.reference_code === "objectives_and_outcomes",
  );
  const coRefPath =
    coIndex !== -1 ? [...parentPath, coIndex, "reference_data"] : [];

  // Theo dõi dữ liệu CO để đồng bộ số lượng CLO tương ứng
  const coDataRaw = Form.useWatch(coRefPath, form);
  const coData = Array.isArray(coDataRaw) ? coDataRaw : [];

  // Đồng bộ cấu trúc CLO (Thêm/bớt Tab khi CO thay đổi)
  useEffect(() => {
    if (coData.length === 0) return;
    const formCloData = form.getFieldValue(refPath) || [];
    let isChanged = false;

    const syncedCloData = coData.map((co) => {
      const existingClo = formCloData.find(
        (c) => String(c.id) === String(co.id),
      );
      if (existingClo) return existingClo;
      isChanged = true;
      return {id: co.id, clos: []};
    });

    if (formCloData.length !== syncedCloData.length) {
      isChanged = true;
    } else {
      for (let i = 0; i < syncedCloData.length; i++) {
        if (String(syncedCloData[i].id) !== String(formCloData[i].id)) {
          isChanged = true;
          break;
        }
      }
    }

    if (isChanged) form.setFieldValue(refPath, syncedCloData);
  }, [coData, form, refPath]);

  // 3. Xử lý logic nhập điểm trên Ma trận
  const handleMatrixChange = (val, coIdx, cloIdx, ploId) => {
    const plosPath = [...refPath, coIdx, "clos", cloIdx, "plos"];
    const currentPlos = form.getFieldValue(plosPath) || [];
    let newPlos = [...currentPlos];

    const existingIndex = newPlos.findIndex(
      (p) => Number(p.plo_id) === Number(ploId),
    );

    if (val === null || val === undefined || val === "") {
      if (existingIndex > -1) newPlos.splice(existingIndex, 1);
    } else {
      if (existingIndex > -1) {
        newPlos[existingIndex] = {...newPlos[existingIndex], rating: val};
      } else {
        newPlos.push({plo_id: ploId, rating: val});
      }
    }
    form.setFieldValue(plosPath, newPlos);
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
      {/* PHẦN 1: TẠO NỘI DUNG CLO */}
      <Form.List name={refPath}>
        {(coFields) => {
          const tabItems = coFields.map(({key, name, ...restField}, coIdx) => ({
            key: key.toString(),
            label: <span style={{fontWeight: 600}}>CO{coIdx + 1}</span>,
            forceRender: true, // <--- FIX QUAN TRỌNG NHẤT: Ép render ngầm mọi Tab để Form không bị mất data
            children: (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: "8px",
                }}
              >
                <Form.Item {...restField} name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <Form.List name={[name, "clos"]}>
                  {(cloFields, {add: addCLO, remove: removeCLO}) => (
                    <>
                      {cloFields.map(
                        (
                          {key: cloKey, name: cloName, ...restCloField},
                          cloIdx,
                        ) => (
                          <Row
                            key={cloKey}
                            gutter={16}
                            style={{marginBottom: 16}}
                          >
                            <Col span={22}>
                              <Form.Item
                                {...restCloField}
                                name={[cloName, "id"]}
                                hidden
                              >
                                <Input />
                              </Form.Item>

                              {/* Danh sách PLO Rating được giấu đi để submit và tránh mất data */}
                              <div style={{display: "none"}}>
                                <Form.List name={[cloName, "plos"]}>
                                  {(ploFields) => (
                                    <>
                                      {ploFields.map(
                                        ({
                                          key: ploKey,
                                          name: ploName,
                                          ...restPloField
                                        }) => (
                                          <React.Fragment key={ploKey}>
                                            <Form.Item
                                              {...restPloField}
                                              name={[ploName, "plo_id"]}
                                            >
                                              <Input />
                                            </Form.Item>
                                            <Form.Item
                                              {...restPloField}
                                              name={[ploName, "rating"]}
                                            >
                                              <Input />
                                            </Form.Item>
                                          </React.Fragment>
                                        ),
                                      )}
                                    </>
                                  )}
                                </Form.List>
                              </div>

                              <Form.Item
                                {...restCloField}
                                name={[cloName, "content"]}
                                label={
                                  <span
                                    style={{fontWeight: 500, color: "#1890ff"}}
                                  >
                                    CLO {coIdx + 1}.{cloIdx + 1}
                                  </span>
                                }
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập nội dung CLO",
                                  },
                                ]}
                                style={{marginBottom: 0}}
                              >
                                <TextArea
                                  autoSize={{minRows: 2, maxRows: 4}}
                                  placeholder="VD: Cài đặt thành công thuật toán..."
                                />
                              </Form.Item>
                            </Col>
                            <Col
                              span={2}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginTop: 28,
                              }}
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeCLO(cloName)}
                              />
                            </Col>
                          </Row>
                        ),
                      )}
                      <Button
                        type="dashed"
                        onClick={() => addCLO({plos: []})}
                        block
                        icon={<PlusOutlined />}
                      >
                        Thêm CLO cho CO{coIdx + 1}
                      </Button>
                    </>
                  )}
                </Form.List>
              </div>
            ),
          }));

          return coFields.length > 0 ? (
            <Tabs
              className="chrome-tabs"
              type="card"
              items={tabItems}
              style={{marginBottom: 24}}
            />
          ) : (
            <div style={{textAlign: "center", padding: "20px", color: "#999"}}>
              Chưa có Mục tiêu (CO) nào được thiết lập.
            </div>
          );
        }}
      </Form.List>

      {/* PHẦN 2: MA TRẬN CLO - PLO TỰ ĐỘNG CẬP NHẬT */}
      <Form.Item shouldUpdate={true} noStyle>
        {() => {
          // Lấy dữ liệu Real-time trực tiếp từ form instance
          const allSections = form.getFieldValue(parentPath) || [];
          const coSection = allSections.find(
            (sub) => sub.reference_code === "objectives_and_outcomes",
          );
          const liveCoData = coSection?.reference_data || [];
          const currentData = form.getFieldValue(refPath) || [];

          const matrixData = [];
          const assignedPloIdsGlobal = new Set();

          // Quét toàn bộ PLO đang được chọn ở Form CO
          liveCoData.forEach((co) => {
            const plosOfCo =
              co.plos ||
              co.plo_ids ||
              co.plo ||
              co.program_learning_outcomes ||
              co.programme_learning_outcomes ||
              [];
            if (Array.isArray(plosOfCo)) {
              plosOfCo.forEach((val) => {
                let id =
                  typeof val === "object" && val !== null
                    ? val.id || val.plo_id
                    : val;
                if (id) assignedPloIdsGlobal.add(Number(id));
              });
            }
          });

          // Quét dự phòng các PLO đã lỡ chấm điểm trong CLO
          currentData.forEach((co) => {
            co.clos?.forEach((clo) => {
              if (Array.isArray(clo.plos)) {
                clo.plos.forEach((p) => {
                  if (p.plo_id) assignedPloIdsGlobal.add(Number(p.plo_id));
                });
              }
            });
          });

          const displayPloOptions = ploOptions.filter((plo) =>
            assignedPloIdsGlobal.has(Number(plo.value)),
          );

          // Chuẩn bị hàng cho bảng ma trận
          currentData.forEach((co, coIdx) => {
            co.clos?.forEach((clo, cloIdx) => {
              matrixData.push({
                key: `${coIdx}-${cloIdx}`,
                coIdx,
                cloIdx,
                cloName: `${coIdx + 1}.${cloIdx + 1}`,
                plos: clo.plos || [],
              });
            });
          });

          if (matrixData.length === 0 || displayPloOptions.length === 0)
            return null;

          // Chuẩn bị cột cho bảng ma trận
          const columns = [
            {
              title: "CLOs",
              dataIndex: "cloName",
              key: "cloName",
              width: 80,
              align: "center",
              fixed: "left",
              render: (text) => <strong>{text}</strong>,
            },
            ...displayPloOptions.map((plo) => ({
              title: plo.label,
              key: plo.value,
              width: 100,
              align: "center",
              render: (_, record) => {
                const parentCo = liveCoData[record.coIdx];
                let parentPloIds = [];

                if (parentCo) {
                  const pCoPlos =
                    parentCo.plos ||
                    parentCo.plo_ids ||
                    parentCo.plo ||
                    parentCo.program_learning_outcomes ||
                    parentCo.programme_learning_outcomes ||
                    [];
                  if (Array.isArray(pCoPlos)) {
                    parentPloIds = pCoPlos.map((v) => {
                      if (typeof v === "object" && v !== null)
                        return Number(v.id || v.plo_id);
                      return Number(v);
                    });
                  }
                }

                const existing = record.plos.find(
                  (p) => Number(p.plo_id) === Number(plo.value),
                );
                const isPloValidForThisClo =
                  parentPloIds.includes(Number(plo.value)) || existing;

                if (!isPloValidForThisClo) {
                  return (
                    <div
                      style={{
                        backgroundColor: "#f5f5f5",
                        color: "#bfbfbf",
                        borderRadius: 4,
                        padding: "4px 0",
                        textAlign: "center",
                      }}
                    >
                      -
                    </div>
                  );
                }

                return (
                  <InputNumber
                    min={1}
                    max={5}
                    value={existing?.rating || null}
                    onChange={(val) =>
                      handleMatrixChange(
                        val,
                        record.coIdx,
                        record.cloIdx,
                        plo.value,
                      )
                    }
                    style={{width: "100%"}}
                    controls={false}
                  />
                );
              },
            })),
          ];

          return (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#fff",
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
              }}
            >
              <h4 style={{marginBottom: 16}}>
                Ma trận tích hợp giữa chuẩn đầu ra môn học và CĐR chương trình
                đào tạo
              </h4>
              <Table
                dataSource={matrixData}
                columns={columns}
                pagination={false}
                bordered
                size="small"
                scroll={{x: "max-content"}}
              />
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: "24px",
                  color: "#595959",
                }}
              >
                <Text italic>1: Không đáp ứng</Text>
                <Text italic>2: Ít đáp ứng</Text>
                <Text italic>3: Đáp ứng trung bình</Text>
                <Text italic>4: Đáp ứng nhiều</Text>
                <Text italic>5: Đáp ứng rất nhiều</Text>
              </div>
            </div>
          );
        }}
      </Form.Item>
    </div>
  );
};

export default CourseLearningOutcomeReference;
