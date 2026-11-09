import React, {useEffect, useMemo, useState, useRef, memo} from "react";
import {Input, InputNumber, Select, Button, Row, Col, Collapse} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {useSyllabusStore} from "../../store/useSyllabusStore";

const {TextArea} = Input;
const {Panel} = Collapse;
const EMPTY_ARRAY = [];

const ACTIVITY_FIELDS = [
  {
    key: "offline",
    title: "HĐ trên lớp (Offline)",
    titleColor: "text-blue-600",
    activityField: "offline_activity",
    hoursField: "offline_hours",
  },
  {
    key: "online",
    title: "HĐ trực tuyến (Online)",
    titleColor: "text-green-600",
    activityField: "online_activity",
    hoursField: "online_hours",
  },
  {
    key: "self_study",
    title: "Tự học",
    titleColor: "text-purple-600",
    activityField: "self_study_activity",
    hoursField: "self_study_hours",
  },
];

const SessionContent = ({
  session,
  cloOptions,
  assessmentOptions,
  materialOptions,
  onChange,
}) => {
  const labelOverrides = useSyllabusStore((state) => state.labelOverrides) || {};
  const scheduleLabels = labelOverrides.teaching_schedule || {};
  const customColumns = useSyllabusStore((state) => state.customColumns) || [];
  const customValues = useSyllabusStore((state) => state.customValues) || {};
  const updateCustomValue = useSyllabusStore((state) => state.updateCustomValue);

  const scheduleCustomCols = customColumns.filter(
    (c) => c.table_code === "teaching_schedule" && c.is_active !== false,
  );

  const activityFields = [
    {
      key: "offline",
      title: scheduleLabels.col_offline || "HĐ trên lớp (Offline)",
      titleColor: "text-blue-600",
      activityField: "offline_activity",
      hoursField: "offline_hours",
    },
    {
      key: "online",
      title: scheduleLabels.col_online || "HĐ trực tuyến (Online)",
      titleColor: "text-green-600",
      activityField: "online_activity",
      hoursField: "online_hours",
    },
    {
      key: "self_study",
      title: scheduleLabels.col_self || "Tự học",
      titleColor: "text-purple-600",
      activityField: "self_study_activity",
      hoursField: "self_study_hours",
    },
  ];

  const handleFieldChange = (field, val) => {
    onChange({
      ...session,
      [field]: val,
    });
  };

  const handleRelationChange = (field, selectedIds) => {
    onChange({
      ...session,
      [field]: (selectedIds || []).map((id) => ({id})),
    });
  };

  const selectedCloIds = useMemo(
    () =>
      (session.course_learning_outcomes || []).map((v) =>
        typeof v === "object" ? v.id : v,
      ),
    [session.course_learning_outcomes],
  );
  const selectedAssessmentIds = useMemo(
    () =>
      (session.assessments || []).map((v) =>
        typeof v === "object" ? v.id : v,
      ),
    [session.assessments],
  );
  const selectedMaterialIds = useMemo(
    () =>
      (session.learning_materials || []).map((v) =>
        typeof v === "object" ? v.id : v,
      ),
    [session.learning_materials],
  );

  return (
    <>
      <Row gutter={16}>
        <Col span={3}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {scheduleLabels.col_session || "Buổi số"}
          </div>
          <InputNumber
            min={1}
            className="w-full rounded-md"
            placeholder="VD: 1"
            value={session.session_no}
            onChange={(val) =>
              handleFieldChange("session_no", Number(val || 1))
            }
          />
        </Col>
        <Col span={21}>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {scheduleLabels.col_content || "Nội dung giảng dạy"}
          </div>
          <TextArea
            autoSize={{minRows: 3, maxRows: 15}}
            placeholder="Nhập nội dung bài giảng..."
            className="rounded-md text-sm"
            value={session.content ?? ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
          />
        </Col>
      </Row>

      <Row gutter={16} className="mt-4">
        {activityFields.map((item) => (
          <Col span={8} key={item.key}>
            <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
              <div
                className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${item.titleColor}`}
              >
                {item.title}
              </div>
              <TextArea
                autoSize={{minRows: 2, maxRows: 4}}
                placeholder="Mô tả hoạt động..."
                className="rounded-md text-sm bg-gray-50/50 mb-3"
                value={session[item.activityField] ?? ""}
                onChange={(e) =>
                  handleFieldChange(item.activityField, e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                  Số giờ:
                </span>
                <InputNumber
                  min={0}
                  step={0.5}
                  className="w-full rounded-md"
                  placeholder="0"
                  value={session[item.hoursField] ?? 0}
                  onChange={(val) =>
                    handleFieldChange(item.hoursField, Number(val || 0))
                  }
                />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className="border-t border-gray-100 mt-5 pt-4">
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {scheduleLabels.col_clo || "Đáp ứng CLOs"}
            </div>
            <Select
              mode="multiple"
              allowClear
              options={cloOptions}
              placeholder="Chọn CLO..."
              className="w-full rounded-md"
              value={selectedCloIds}
              onChange={(ids) =>
                handleRelationChange("course_learning_outcomes", ids)
              }
            />
          </Col>
          <Col span={8}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Đánh giá (Assessments)
            </div>
            <Select
              mode="multiple"
              allowClear
              options={assessmentOptions}
              placeholder="Chọn phương pháp..."
              className="w-full rounded-md"
              value={selectedAssessmentIds}
              onChange={(ids) => handleRelationChange("assessments", ids)}
            />
          </Col>
          <Col span={8}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              {scheduleLabels.col_material || "Tài liệu học tập"}
            </div>
            <Select
              mode="multiple"
              allowClear
              options={materialOptions}
              placeholder="Chọn tài liệu..."
              className="w-full rounded-md"
              value={selectedMaterialIds}
              onChange={(ids) =>
                handleRelationChange("learning_materials", ids)
              }
            />
          </Col>
        </Row>
      </div>

      {scheduleCustomCols.length > 0 && (
        <div className="border-t border-gray-100 mt-4 pt-3">
          <Row gutter={16}>
            {scheduleCustomCols.map((col) => {
              const valKey = `${col.id}_${session.session_no || session.id || 0}`;
              const val = customValues[valKey] ?? customValues[col.id] ?? col.default_value ?? "";
              return (
                <Col span={Math.max(6, Math.floor(24 / scheduleCustomCols.length))} key={col.id || col.column_key}>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {col.column_label}
                  </div>
                  <Input
                    placeholder={`Nhập ${col.column_label}...`}
                    className="w-full rounded-md text-sm font-normal text-gray-700"
                    value={val}
                    onChange={(e) => updateCustomValue(valKey, e.target.value)}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </>
  );
};

const TeachingPlanEditor = ({item, basePath}) => {
  const [scheduleGroupOptions, setScheduleGroupOptions] = useState([]);
  const hasInitializedRef = useRef(false);

  const referenceData = useSyllabusStore(
    (state) =>
      state.localBlocks[item.code]?.data?.reference_data || EMPTY_ARRAY,
  );
  const updateLocalBlock = useSyllabusStore((state) => state.updateLocalBlock);

  const rawCloData = useSyllabusStore((state) => {
    const target = Object.values(state.localBlocks).find(
      (b) =>
        b.data?.reference_code === "course_learning_outcomes" ||
        b.data?.code === "course_learning_outcomes",
    );
    return target?.data?.reference_data || EMPTY_ARRAY;
  });

  const rawAssessmentData = useSyllabusStore((state) => {
    const target = Object.values(state.localBlocks).find(
      (b) =>
        b.data?.reference_code === "assessment_method" ||
        b.data?.code === "assessment_method",
    );
    return target?.data?.reference_data || EMPTY_ARRAY;
  });

  const rawMaterialData = useSyllabusStore((state) => {
    const target = Object.values(state.localBlocks).find(
      (b) =>
        b.data?.reference_code === "learning_material" ||
        b.data?.code === "learning_material",
    );
    return target?.data?.reference_data || EMPTY_ARRAY;
  });

  const cloOptions = useMemo(() => {
    const list = [];
    (rawCloData || []).forEach((co, coIdx) => {
      (co.clos || []).forEach((clo, cloIdx) => {
        if (!clo.id && !clo.content) return;
        list.push({
          label: `CLO${coIdx + 1}.${cloIdx + 1} - ${clo.content || "..."}`,
          value: clo.id,
        });
      });
    });
    return list;
  }, [rawCloData]);

  const assessmentOptions = useMemo(() => {
    return (rawAssessmentData || []).map((g) => ({
      label: g.type_assessment?.name || `Đánh giá #${g.id}`,
      value: g.id,
    }));
  }, [rawAssessmentData]);

  const materialOptions = useMemo(() => {
    return (rawMaterialData || []).map((m) => ({
      label: m.name || `Tài liệu #${m.id}`,
      value: m.id,
    }));
  }, [rawMaterialData]);

  useEffect(() => {
    authApis()
      .get(endpoints["schedule-groups"])
      .then((res) => setScheduleGroupOptions(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (scheduleGroupOptions.length === 0 || hasInitializedRef.current) return;

    const currentData =
      useSyllabusStore.getState().localBlocks[item.code]?.data
        ?.reference_data || [];

    let isChanged = false;
    const isFlatData =
      currentData.length > 0 && currentData[0].session_no !== undefined;

    const syncedData = scheduleGroupOptions.map((sg) => {
      if (isFlatData) {
        const sessionsInGroup = currentData.filter(
          (session) =>
            String(session.schedule_group?.id || session.schedule_group_id) ===
            String(sg.id),
        );
        isChanged = true;
        return {
          schedule_group: {id: sg.id, name: sg.name},
          teaching_sessions: sessionsInGroup,
        };
      } else {
        const existingGroup = currentData.find(
          (entry) => String(entry?.schedule_group?.id) === String(sg.id),
        );
        if (existingGroup) return existingGroup;

        isChanged = true;
        return {
          schedule_group: {id: sg.id, name: sg.name},
          teaching_sessions: [],
        };
      }
    });

    if (isChanged || currentData.length !== syncedData.length) {
      updateLocalBlock(item.code, {reference_data: syncedData});
    }

    hasInitializedRef.current = true;
  }, [scheduleGroupOptions]);

  const handleAddSession = (groupIdx) => {
    const nextData = [...referenceData];
    const group = {...nextData[groupIdx]};
    const currentSessions = group.teaching_sessions || [];

    const newSession = {
      session_no: currentSessions.length + 1,
      content: "",
      offline_activity: "",
      offline_hours: 0,
      online_activity: "",
      online_hours: 0,
      self_study_activity: "",
      self_study_hours: 0,
      course_learning_outcomes: [],
      assessments: [],
      learning_materials: [],
    };

    group.teaching_sessions = [...currentSessions, newSession];
    nextData[groupIdx] = group;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleUpdateSession = (groupIdx, sIdx, updatedSession) => {
    const nextData = [...referenceData];
    const group = {...nextData[groupIdx]};
    const nextSessions = [...(group.teaching_sessions || [])];
    nextSessions[sIdx] = updatedSession;
    group.teaching_sessions = nextSessions;
    nextData[groupIdx] = group;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const handleRemoveSession = (groupIdx, sIdx) => {
    const nextData = [...referenceData];
    const group = {...nextData[groupIdx]};
    group.teaching_sessions = (group.teaching_sessions || []).filter(
      (_, idx) => idx !== sIdx,
    );
    nextData[groupIdx] = group;
    updateLocalBlock(item.code, {reference_data: nextData});
  };

  const currentSyllabus = useSyllabusStore((state) => state.currentSyllabus);
  const creditInfo = currentSyllabus?.subject?.credit;
  const theoryCredits = Number(creditInfo?.number_theory || 0);
  const practiceCredits = Number(creditInfo?.number_practice || 0);
  const expectedTotalHours = (theoryCredits * 15) + (practiceCredits * 30);

  const { totalOfflineHours, totalOnlineHours, totalTeachingHours } = useMemo(() => {
    let offline = 0;
    let online = 0;
    (referenceData || []).forEach((g) => {
      (g?.teaching_sessions || []).forEach((s) => {
        offline += Number(s.offline_hours || 0);
        online += Number(s.online_hours || 0);
      });
    });
    return {
      totalOfflineHours: offline,
      totalOnlineHours: online,
      totalTeachingHours: offline + online,
    };
  }, [referenceData]);

  const hourDeviationPercent = expectedTotalHours > 0
    ? Math.round(Math.abs(totalTeachingHours - expectedTotalHours) / expectedTotalHours * 100)
    : 0;
  const isDeviationHigh = expectedTotalHours > 0 && hourDeviationPercent > 20;

  return (
    <div className="w-full flex flex-col gap-6">
      {expectedTotalHours > 0 && (
        <div className={`p-4 rounded-xl border shadow-sm ${isDeviationHigh ? "bg-amber-50/70 border-amber-200" : "bg-blue-50/50 border-blue-100"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <span>Định mức giờ giảng dạy (Quy định BR-05)</span>
                {isDeviationHigh ? (
                  <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    Lệch {hourDeviationPercent}% (&gt;20%)
                  </span>
                ) : (
                  <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Khớp định mức (±{hourDeviationPercent}%)
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Số tín chỉ: {theoryCredits} LT + {practiceCredits} TH | Định mức quy định: <strong>{expectedTotalHours} giờ</strong>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-blue-600">Offline: {totalOfflineHours}h</span>
              <span className="text-green-600">Online: {totalOnlineHours}h</span>
              <span className="text-purple-700 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-xs">
                Tổng: {totalTeachingHours}h / {expectedTotalHours}h
              </span>
            </div>
          </div>
          {isDeviationHigh && (
            <div className="text-[11px] text-amber-700 mt-2 font-medium italic">
              * Cảnh báo BR-05: Tổng số giờ giảng dạy ({totalTeachingHours}h) đang lệch quá 20% so với định mức tín chỉ ({expectedTotalHours}h). Vui lòng điều chỉnh số giờ của các buổi học cho phù hợp.
            </div>
          )}
        </div>
      )}
      {referenceData.map((group, groupIdx) => {
        const groupName =
          group?.schedule_group?.name || `Nhóm lịch trình ${groupIdx + 1}`;
        const sessions = group?.teaching_sessions || [];

        return (
          <div
            key={
              group.schedule_group?.id
                ? `sg_${group.schedule_group.id}`
                : `g_${groupIdx}`
            }
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/80">
              <span className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
                {groupName}
              </span>
            </div>

            <div className="p-4 w-full">
              <div className="flex flex-col gap-3 w-full">
                <Collapse className="w-full bg-transparent border-none">
                  {sessions.map((session, sIdx) => {
                    const sessionNo = session.session_no ?? sIdx + 1;
                    const panelKey = session.id
                      ? String(session.id)
                      : `${groupIdx}_${sIdx}`;

                    return (
                      <Panel
                        header={
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600">
                              Buổi học {sessionNo}
                            </span>
                            {!session.content?.trim() && (
                              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-normal italic">
                                Chưa nhập nội dung
                              </span>
                            )}
                          </div>
                        }
                        key={panelKey}
                        extra={
                          <DeleteOutlined
                            className="text-red-400 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSession(groupIdx, sIdx);
                            }}
                          />
                        }
                        className="mb-3 bg-gray-50/40 border border-gray-200 rounded-lg shadow-sm"
                      >
                        <SessionContent
                          session={session}
                          cloOptions={cloOptions}
                          assessmentOptions={assessmentOptions}
                          materialOptions={materialOptions}
                          onChange={(updated) =>
                            handleUpdateSession(groupIdx, sIdx, updated)
                          }
                        />
                      </Panel>
                    );
                  })}
                </Collapse>

                <Button
                  type="dashed"
                  onClick={() => handleAddSession(groupIdx)}
                  block
                  icon={<PlusOutlined />}
                  className="h-10 mt-2 border-gray-300 text-gray-500 font-medium rounded-lg hover:border-blue-500 hover:text-blue-500 bg-white"
                >
                  Thêm buổi học ({groupName})
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(TeachingPlanEditor);
