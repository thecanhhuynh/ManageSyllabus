import React, {useState, useEffect, useMemo} from "react";
import {Form, Input, Button, Tabs, InputNumber, Table} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {AppServices} from "../../services/AppServices";

const {TextArea} = Input;

const CourseLearningOutcomeEditor = ({item, basePath}) => {
  const refPath = useMemo(() => [...basePath, "reference_data"], [basePath]);

  const form = Form.useFormInstance();
  const [ploOptions, setPloOptions] = useState([]);

  useEffect(() => {
    const fetchPLOs = async () => {
      try {
        const res = await AppServices.getPLOs();
        const dataArray = res.data.results || res.data || [];
        setPloOptions(
          dataArray.map((plo) => ({
            label: plo.name || `PLO${plo.id}`,
            value: plo.id,
          })),
        );
      } catch (error) {
        console.error("Lỗi tải PLO", error);
      }
    };
    fetchPLOs();
  }, []);

  // 2. An toàn hóa việc tìm khối CO
  const parentPath = refPath.slice(0, -2);
  const rawSubSections = form.getFieldValue(parentPath);
  const allSubSections = Array.isArray(rawSubSections) ? rawSubSections : [];

  const coIndex = allSubSections.findIndex(
    (sub) =>
      sub.reference_code === "objectives_and_outcomes" ||
      sub.code === "objectives_and_outcomes",
  );
  const coRefPath =
    coIndex !== -1
      ? [...parentPath, coIndex, "reference_data"]
      : ["__missing_co__"];
  const coDataRaw = Form.useWatch(coRefPath, form);
  const coData = Array.isArray(coDataRaw) ? coDataRaw : [];

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

    if (formCloData.length !== syncedCloData.length) isChanged = true;
    else {
      for (let i = 0; i < syncedCloData.length; i++) {
        if (String(syncedCloData[i].id) !== String(formCloData[i].id)) {
          isChanged = true;
          break;
        }
      }
    }
    if (isChanged) form.setFieldValue(refPath, syncedCloData);
  }, [coData, form, refPath]);

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
      if (existingIndex > -1)
        newPlos[existingIndex] = {...newPlos[existingIndex], rating: val};
      else newPlos.push({plo_id: ploId, rating: val});
    }
    form.setFieldValue(plosPath, newPlos);
  };

  return (
    <div className="w-full">
      <Form.List name={refPath}>
        {(coFields) => {
          const tabItems = coFields.map(({key, name, ...restField}, coIdx) => ({
            key: key.toString(),
            label: (
              <div className="font-bold text-center leading-tight">
                CO{coIdx + 1}
                <br />
                <span className="text-xs font-normal text-gray-400">
                  Nội dung
                </span>
              </div>
            ),
            forceRender: true,
            children: (
              <div className="p-6 border-2 border-indigo-100 rounded-xl bg-white mt-1">
                <Form.Item {...restField} name={[name, "id"]} hidden>
                  <Input />
                </Form.Item>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="m-0 font-bold text-gray-800 text-base">
                    Chuẩn đầu ra {coIdx + 1}
                  </h4>
                  <Form.List name={[name, "clos"]}>
                    {(cloFields, {add}) => (
                      <Button
                        size="small"
                        onClick={() => add({plos: []})}
                        icon={<PlusOutlined />}
                        className="rounded-md font-medium"
                      >
                        Thêm CLO
                      </Button>
                    )}
                  </Form.List>
                </div>
                <Form.List name={[name, "clos"]}>
                  {(cloFields, {remove}) => (
                    <div className="flex flex-col gap-3">
                      {cloFields.map(
                        (
                          {key: cloKey, name: cloName, ...restCloField},
                          cloIdx,
                        ) => (
                          <div
                            key={cloKey}
                            className="flex gap-4 p-4 border border-gray-100 bg-gray-50/50 rounded-xl items-start group transition-colors hover:border-blue-200"
                          >
                            <Form.Item
                              {...restCloField}
                              name={[cloName, "id"]}
                              hidden
                            >
                              <Input />
                            </Form.Item>
                            <div className="hidden">
                              <Form.List name={[cloName, "plos"]}>
                                {(ploFields) => (
                                  <>
                                    {ploFields.map((ploField) => (
                                      <div key={ploField.key}>
                                        <Form.Item
                                          name={[ploField.name, "plo_id"]}
                                        >
                                          <Input />
                                        </Form.Item>
                                        <Form.Item
                                          name={[ploField.name, "rating"]}
                                        >
                                          <Input />
                                        </Form.Item>
                                      </div>
                                    ))}
                                  </>
                                )}
                              </Form.List>
                            </div>
                            <div className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-md text-sm shrink-0 mt-1">
                              CLO{coIdx + 1}.{cloIdx + 1}
                            </div>
                            <Form.Item
                              {...restCloField}
                              name={[cloName, "content"]}
                              rules={[
                                {required: true, message: "Nhập nội dung"},
                              ]}
                              className="mb-0 flex-1"
                            >
                              <TextArea
                                autoSize={{minRows: 2, maxRows: 4}}
                                variant="borderless"
                                placeholder="Thêm nội dung......"
                                className="p-0 text-sm font-medium text-gray-700 bg-transparent resize-none focus:bg-white focus:p-2 focus:rounded-md transition-all"
                              />
                            </Form.Item>
                            <div className="flex flex-col items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(cloName)}
                                size="small"
                              />
                              <InfoCircleOutlined className="text-gray-400" />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </Form.List>
              </div>
            ),
          }));
          return coFields.length > 0 ? (
            <Tabs type="card" items={tabItems} className="saas-clo-tabs mb-8" />
          ) : (
            <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl mb-8">
              Chưa có Mục tiêu (CO) nào được thiết lập.
            </div>
          );
        }}
      </Form.List>

      <Form.Item shouldUpdate={true} noStyle>
        {() => {
          // 3. Quét khối CO chuẩn xác hơn
          const rawSections = form.getFieldValue(parentPath);
          const allSections = Array.isArray(rawSections) ? rawSections : [];
          const coSection = allSections.find(
            (sub) =>
              sub.reference_code === "objectives_and_outcomes" ||
              sub.code === "objectives_and_outcomes",
          );

          const liveCoData = coSection?.reference_data || [];
          const currentData = form.getFieldValue(refPath) || [];
          const matrixData = [];
          const assignedPloIdsGlobal = new Set();

          liveCoData.forEach((co) => {
            const plosOfCo = co.programme_learning_outcomes || [];
            if (Array.isArray(plosOfCo))
              plosOfCo.forEach((val) => {
                let id =
                  typeof val === "object" && val !== null
                    ? val.id || val.plo_id
                    : val;
                if (id) assignedPloIdsGlobal.add(Number(id));
              });
          });

          currentData.forEach((co) =>
            co.clos?.forEach((clo) => {
              if (Array.isArray(clo.plos))
                clo.plos.forEach((p) => {
                  if (p.plo_id) assignedPloIdsGlobal.add(Number(p.plo_id));
                });
            }),
          );

          const displayPloOptions = ploOptions.filter((plo) =>
            assignedPloIdsGlobal.has(Number(plo.value)),
          );
          currentData.forEach((co, coIdx) =>
            co.clos?.forEach((clo, cloIdx) =>
              matrixData.push({
                key: `${coIdx}-${cloIdx}`,
                coIdx,
                cloIdx,
                cloName: `CLO${coIdx + 1}.${cloIdx + 1}`,
                content: clo.content,
                plos: clo.plos || [],
              }),
            ),
          );

          if (matrixData.length === 0) return null;

          // 4. Báo lỗi thân thiện nếu thiếu PLO
          if (displayPloOptions.length === 0) {
            return (
              <div className="bg-orange-50 border border-orange-200 text-orange-600 rounded-xl p-6 mt-8 text-center font-medium">
                🚧 Vui lòng ánh xạ Chuẩn đầu ra (PLO) cho các Mục tiêu học phần
                (CO) ở phần trên để Ma trận hiển thị.
              </div>
            );
          }

          const columns = [
            {
              title: "Course Learning Outcome",
              dataIndex: "cloName",
              width: 120,
              fixed: "left",
              render: (text) => (
                <span className="font-bold text-blue-600">{text}</span>
              ),
            },
            {
              title: "Outcome Description",
              dataIndex: "content",
              render: (text) => (
                <span className="text-xs text-gray-500 italic line-clamp-2">
                  {text || "..."}
                </span>
              ),
            },
            ...displayPloOptions.map((plo) => ({
              title: (
                <div className="text-center text-xs text-gray-500">
                  PLO{plo.value}
                </div>
              ),
              key: plo.value,
              width: 70,
              align: "center",
              render: (_, record) => {
                const parentCo = liveCoData[record.coIdx];
                let parentPloIds = [];
                if (parentCo) {
                  const pCoPlos = parentCo.programme_learning_outcomes || [];
                  if (Array.isArray(pCoPlos))
                    parentPloIds = pCoPlos.map((v) =>
                      Number(
                        typeof v === "object" && v !== null
                          ? v.id || v.plo_id
                          : v,
                      ),
                    );
                }
                const existing = record.plos.find(
                  (p) => Number(p.plo_id) === Number(plo.value),
                );
                const isPloValid =
                  parentPloIds.includes(Number(plo.value)) || existing;

                if (!isPloValid) return <div className="text-gray-300">-</div>;
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
                    className="w-12 text-center text-blue-600 font-bold border-gray-200"
                    controls={true}
                  />
                );
              },
            })),
          ];

          return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mt-8">
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Ma trận chuẩn đầu ra
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                <InfoCircleOutlined /> Trọng số: 1 (Tác động ít) to 5 (Tác động
                nhiều). Ô chưa đánh giá trị "-".
              </div>
              <Table
                dataSource={matrixData}
                columns={columns}
                pagination={false}
                size="middle"
                scroll={{x: "max-content"}}
                className="custom-matrix-table"
              />
            </div>
          );
        }}
      </Form.Item>
    </div>
  );
};

export default CourseLearningOutcomeEditor;
