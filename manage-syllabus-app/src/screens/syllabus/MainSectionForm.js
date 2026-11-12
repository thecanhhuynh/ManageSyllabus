import React, {useRef, useState, useEffect} from "react";
import {Button, Col, Form, Input, message, Row, Spin} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import SubSectionRenderer from "../../components/SubSectionRender";
import {useSyllabusStore} from "../../store/useSyllabusStore";
import CustomColumnService from "../../services/customColumnService";

const savePendingCustomValues = async (syllabusId) => {
  const customVals = useSyllabusStore.getState().customValues || {};
  const entries = Object.entries(customVals);
  if (entries.length === 0) return;

  const payload = entries.map(([key, val]) => {
    const hasRowKey = key.includes("_");
    const colId = hasRowKey ? key.split("_")[0] : key;
    const objectId = hasRowKey
      ? key.split("_").slice(1).join("_")
      : String(syllabusId);
    return {
      column_id: colId,
      object_id: objectId,
      value: String(val ?? ""),
    };
  });
  try {
    await CustomColumnService.saveCustomValues(syllabusId, payload);
  } catch (err) {
    console.warn("Lưu giá trị tùy biến ngầm thất bại:", err);
  }
};

const MainSectionForm = ({syllabusId, mainSection, isApproved = false}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const initValues = {
    sub_sections: mainSection.sub_sections,
  };

  const handleSave = async () => {
    if (isApproved) {
      message.warning(
        "Đề cương đã được phê duyệt. Vui lòng liên hệ Lãnh đạo Khoa để yêu cầu chỉnh sửa.",
      );
      return;
    }

    try {
      setIsSaving(true);

      const {localBlocks, revision, markSaved} = useSyllabusStore.getState();
      console.log("Toàn bộ Local Blocks:", localBlocks);
      console.log("Main Section ID hiện tại:", mainSection.id);
      const dirtyBlocksInCard = Object.values(localBlocks).filter(
        (block) =>
          block.data.main_section_id === mainSection.id && block.isDirty,
      );

      if (dirtyBlocksInCard.length === 0) {
        console.log(
          "CẢNH BÁO: Không tìm thấy block nào khớp với Main Section ID này!",
        );
        message.info("Không có dữ liệu (Test)");
        return;
      }

      const invalidAssessmentBlock = dirtyBlocksInCard.find((block) => {
        const code = block.data.code || block.data.reference_type;
        if (code !== "assessment_method") return false;
        const groups = block.data.reference_data || [];
        if (groups.length === 0) return false;
        const total = groups.reduce((sum, grp) => {
          const methods = grp?.assessment_methods || [];
          return (
            sum +
            methods.reduce((mSum, m) => mSum + (Number(m?.weight) || 0), 0)
          );
        }, 0);
        return total !== 100;
      });

      if (invalidAssessmentBlock) {
        message.error(
          "Tổng trọng số của phương pháp đánh giá phải bằng đúng 100%!",
        );
        return;
      }

      const negativeAssessmentBlock = dirtyBlocksInCard.find((block) => {
        const code = block.data.code || block.data.reference_type;
        if (code !== "assessment_method") return false;
        const groups = block.data.reference_data || [];
        return groups.some((grp) =>
          (grp?.assessment_methods || []).some(
            (m) => Number(m?.weight) < 0 || Number(m?.weight) > 100,
          ),
        );
      });

      if (negativeAssessmentBlock) {
        message.error(
          "Trọng số của từng phương pháp đánh giá phải từ 0% đến 100%!",
        );
        return;
      }

      const duplicateSessionBlock = dirtyBlocksInCard.find((block) => {
        const code = block.data.code || block.data.reference_type;
        if (code !== "teaching_schedule") return false;
        const groups = block.data.reference_data || [];
        const seenNos = new Set();
        for (const grp of groups) {
          for (const s of grp?.teaching_sessions || []) {
            const no = Number(s?.session_no);
            if (!no) continue;
            if (seenNos.has(no)) return true;
            seenNos.add(no);
          }
        }
        return false;
      });

      if (duplicateSessionBlock) {
        message.error(
          "Kế hoạch giảng dạy có số buổi bị trùng lặp. Vui lòng kiểm tra lại!",
        );
        return;
      }
      const deltaSubSections = dirtyBlocksInCard.map((block) => {
        const {id, content, selected_values, table_schema, reference_data} =
          block.data;

        const slimData = {id};

        if (content !== undefined) slimData.content = content;
        if (selected_values !== undefined)
          slimData.selected_values = selected_values;
        if (table_schema !== undefined) slimData.table_schema = table_schema;
        if (reference_data !== undefined)
          slimData.reference_data = reference_data;

        return slimData;
      });
      const payload = {
        revision: revision,
        main_sections: [{id: mainSection.id, sub_sections: deltaSubSections}],
      };
      console.log(payload);
      console.log("Endpoint URL:", endpoints["syllabus-detail"](syllabusId));
      const res = await authApis().patch(
        endpoints["syllabus-detail"](syllabusId),
        payload,
      );
      if (res.status === 200) {
        message.success("Lưu thành công");
        const newRevision = res.data?.revision;
        const savedCodes = dirtyBlocksInCard.map((block) => block.data.code);
        markSaved(newRevision, savedCodes);
        await savePendingCustomValues(syllabusId);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        message.error("Mục này đã bị thay đổi cấu trúc, vui lòng tải lại!");
      } else if (error.response?.data) {
        const errData = error.response.data;
        let errorMsg = errData.err_msg
          ? Array.isArray(errData.err_msg)
            ? errData.err_msg[0]
            : errData.err_msg
          : "Lỗi khi lưu";
        message.error(errorMsg);
      }
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  };

  const onFinish = (values) => {
    clearTimeout(timerRef.current);
    setIsSaving(true);
    timerRef.current = setTimeout(() => handleSave(values), 500);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(timerRef.current);
      setIsSaving(false);
    };
  }, []);

  useEffect(() => {
    if (mainSection && mainSection.sub_sections) {
      form.setFieldsValue({
        sub_sections: mainSection.sub_sections,
      });
    }
  }, [mainSection, form]);

  return (
    <Spin spinning={isSaving} tip="Đang lưu...">
      <Form
        form={form}
        layout="vertical"
        initialValues={initValues}
        onFinish={onFinish}
        requiredMark={false}
      >
        {!isApproved && (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              zIndex: 1000,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={isSaving}
              size="large"
              style={{
                fontWeight: 600,
                height: 44,
                padding: "0 22px",
                borderRadius: 22,
                boxShadow: "0 6px 16px rgba(24, 144, 255, 0.4)",
              }}
              className="flex items-center gap-2"
            >
              Lưu thay đổi
            </Button>
          </div>
        )}

        <Row gutter={[24, 24]}>
          {mainSection.sub_sections?.map((subSection, subIndex) => (
            <Col span={24} key={subSection.id}>
              <Form.Item name={["sub_sections", subIndex, "id"]} hidden>
                <Input />
              </Form.Item>

              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                {subSection.name && (
                  <div className="flex items-center mb-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full mr-3"></div>
                    <div className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">
                      {subSection.position}. {subSection.name}
                    </div>
                  </div>
                )}

                <div>
                  <SubSectionRenderer
                    item={subSection}
                    basePath={["sub_sections", subIndex]}
                  />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Form>
    </Spin>
  );
};

export default MainSectionForm;
