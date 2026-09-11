import React, {useState, useEffect, useMemo, memo} from "react";
import {Input, Button, Tabs, InputNumber, Table} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {AppServices} from "../../services/AppServices";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const {TextArea} = Input;

const EMPTY_ARRAY = [];

const CloItemRow = ({clo, coIdx, cloIdx, onContentChange, onRemove}) => {
  return (
    <div className="flex gap-4 p-4 border border-gray-100 bg-gray-50/50 rounded-xl items-start group transition-colors hover:border-blue-200">
      <div className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-md text-sm shrink-0 mt-1">
        CLO{coIdx + 1}.{cloIdx + 1}
      </div>
      <TextArea
        autoSize={{minRows: 2, maxRows: 4}}
        variant="borderless"
        placeholder="Thêm nội dung chuẩn đầu ra..."
        value={clo.content ?? ""}
        onChange={(e) => onContentChange(e.target.value)}
        className="p-0 text-sm font-medium text-gray-700 bg-transparent resize-none focus:bg-white focus:p-2 focus:rounded-md transition-all flex-1"
      />
      <div className="flex flex-col items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          size="small"
        />
        <InfoCircleOutlined className="text-gray-400" />
      </div>
    </div>
  );
};

const CloPloMatrix = ({
  cloReferenceData,
  coReferenceData,
  ploOptions,
  onMatrixCellChange,
}) => {
  const assignedPloIdsGlobal = useMemo(() => {
    const ids = new Set();
    (coReferenceData || []).forEach((co) => {
      (co.programme_learning_outcomes || []).forEach((val) => {
        const id =
          typeof val === "object" && val !== null ? val.id || val.plo_id : val;
        if (id) ids.add(Number(id));
      });
    });
    return ids;
  }, [coReferenceData]);

  const displayPloOptions = useMemo(() => {
    return ploOptions.filter((plo) =>
      assignedPloIdsGlobal.has(Number(plo.value)),
    );
  }, [ploOptions, assignedPloIdsGlobal]);

  const matrixData = useMemo(() => {
    const rows = [];
    (cloReferenceData || []).forEach((co, coIdx) => {
      (co.clos || []).forEach((clo, cloIdx) => {
        rows.push({
          key: `${co.id || coIdx}-${clo.id || cloIdx}`,
          coId: co.id,
          coIdx,
          cloIdx,
          cloName: `CLO${coIdx + 1}.${cloIdx + 1}`,
          content: clo.content,
          plos: clo.plos || [],
        });
      });
    });
    return rows;
  }, [cloReferenceData]);

  if (matrixData.length === 0) return null;

  if (displayPloOptions.length === 0) {
    return (
      <div className="bg-orange-50 border border-orange-200 text-orange-600 rounded-xl p-6 mt-8 text-center font-medium">
        Vui lòng ánh xạ Chuẩn đầu ra (PLO) cho các Mục tiêu học phần (CO) ở phần
        trên để Ma trận hiển thị.
      </div>
    );
  }

  const columns = [
    {
      title: "Course Learning Outcome",
      dataIndex: "cloName",
      width: 130,
      fixed: "left",
      render: (text) => <span className="font-bold text-blue-600">{text}</span>,
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
        <div className="text-center text-xs text-gray-500">PLO{plo.value}</div>
      ),
      key: plo.value,
      width: 70,
      align: "center",
      render: (_, record) => {
        const parentCo = (coReferenceData || []).find(
          (c, idx) => c.id === record.coId || idx === record.coIdx,
        );
        let parentPloIds = [];
        if (parentCo?.programme_learning_outcomes) {
          parentPloIds = parentCo.programme_learning_outcomes.map((v) =>
            Number(typeof v === "object" && v !== null ? v.id || v.plo_id : v),
          );
        }

        const existing = (record.plos || []).find(
          (p) => Number(p.plo_id) === Number(plo.value),
        );
        const isPloValid = parentPloIds.includes(Number(plo.value)) || existing;

        if (!isPloValid) return <div className="text-gray-300">-</div>;

        return (
          <InputNumber
            min={1}
            max={5}
            value={existing?.rating || null}
            onChange={(val) =>
              onMatrixCellChange(record.coIdx, record.cloIdx, plo.value, val)
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
        <InfoCircleOutlined /> Trọng số: 1 (Tác động ít) đến 5 (Tác động nhiều).
        Ô chưa đánh giá trị "-".
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
};

const CourseLearningOutcomeEditor = ({item, basePath}) => {
  const [ploOptions, setPloOptions] = useState([]);

  const cloReferenceData = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.reference_data || EMPTY_ARRAY,
  );

  const coReferenceData = useSyllabusStore(
    (state) =>
      state.localBlocks["objective_outcomes"]?.data?.reference_data ||
      state.localBlocks["objectives_and_outcomes"]?.data?.reference_data ||
      EMPTY_ARRAY,
  );

  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  useEffect(() => {
    const fetchPLOs = async () => {
      try {
        const res = await AppServices.getPLOs();
        const dataArray = res.data?.results || res.data || [];
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

  const coIdsKey = useMemo(() => {
    return (coReferenceData || [])
      .map((co) => co.id ?? co.content ?? "")
      .join(",");
  }, [coReferenceData]);

  useEffect(() => {
    if (!coReferenceData || coReferenceData.length === 0) return;

    const currentCloData =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];

    let isChanged = false;

    const syncedCloData = coReferenceData.map((co) => {
      const existingCo = currentCloData.find(
        (c) => String(c.id) === String(co.id),
      );
      if (existingCo) return existingCo;
      isChanged = true;
      return {id: co.id, clos: []};
    });

    if (currentCloData.length !== syncedCloData.length) {
      isChanged = true;
    }

    if (isChanged) {
      updateLocalBlock(item.code, {reference_data: syncedCloData});
    }
  }, [coIdsKey]);

  const handleAddClo = (coIdx) => {
    const nextData = [...cloReferenceData];
    const targetCo = {...nextData[coIdx]};
    targetCo.clos = [...(targetCo.clos || []), {content: "", plos: []}];
    nextData[coIdx] = targetCo;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleRemoveClo = (coIdx, cloIdx) => {
    const nextData = [...cloReferenceData];
    const targetCo = {...nextData[coIdx]};
    targetCo.clos = (targetCo.clos || []).filter((_, idx) => idx !== cloIdx);
    nextData[coIdx] = targetCo;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleCloContentChange = (coIdx, cloIdx, newContent) => {
    const nextData = [...cloReferenceData];
    const targetCo = {...nextData[coIdx]};
    const nextClos = [...(targetCo.clos || [])];
    nextClos[cloIdx] = {...nextClos[cloIdx], content: newContent};
    targetCo.clos = nextClos;
    nextData[coIdx] = targetCo;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleMatrixCellChange = (coIdx, cloIdx, ploId, val) => {
    const nextData = [...cloReferenceData];
    const targetCo = {...nextData[coIdx]};
    const nextClos = [...(targetCo.clos || [])];
    const targetClo = {...nextClos[cloIdx]};
    let newPlos = [...(targetClo.plos || [])];

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

    targetClo.plos = newPlos;
    nextClos[cloIdx] = targetClo;
    targetCo.clos = nextClos;
    nextData[coIdx] = targetCo;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const tabItems = cloReferenceData.map((coItem, coIdx) => ({
    key: String(coItem.id || coIdx),
    label: (
      <div className="font-bold text-center leading-tight">
        CO-{coIdx + 1}
        <br />
        <span className="text-xs font-normal text-gray-400">Nội dung</span>
      </div>
    ),
    children: (
      <div className="p-6 border-2 border-indigo-100 rounded-xl bg-white mt-1">
        <div className="flex justify-between items-center mb-6">
          <h4 className="m-0 font-bold text-gray-800 text-base">
            Chuẩn đầu ra {coIdx + 1}
          </h4>
          <Button
            size="small"
            onClick={() => handleAddClo(coIdx)}
            icon={<PlusOutlined />}
            className="rounded-md font-medium"
          >
            Thêm CLO
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {(coItem.clos || []).map((clo, cloIdx) => (
            <CloItemRow
              key={clo.id ? `clo_${clo.id}` : `clo_${coIdx}_${cloIdx}`}
              clo={clo}
              coIdx={coIdx}
              cloIdx={cloIdx}
              onContentChange={(text) =>
                handleCloContentChange(coIdx, cloIdx, text)
              }
              onRemove={() => handleRemoveClo(coIdx, cloIdx)}
            />
          ))}
        </div>
      </div>
    ),
  }));

  return (
    <div className="w-full">
      {tabItems.length > 0 ? (
        <Tabs type="card" items={tabItems} className="saas-clo-tabs mb-8" />
      ) : (
        <div className="text-center p-8 text-gray-400 border border-dashed rounded-xl mb-8">
          Chưa có Mục tiêu (CO) nào được thiết lập ở mục trước.
        </div>
      )}

      <CloPloMatrix
        cloReferenceData={cloReferenceData}
        coReferenceData={coReferenceData}
        ploOptions={ploOptions}
        onMatrixCellChange={handleMatrixCellChange}
      />
    </div>
  );
};

export default memo(CourseLearningOutcomeEditor);
