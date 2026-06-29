import React, {useRef, useState, useEffect} from "react";
import {Button, Col, Form, Input, message, Row, Spin} from "antd";
import {SaveOutlined} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import SubSectionRenderer from "../../components/SubSectionRender";

const MainSectionForm = ({syllabusId, mainSection}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const isMountedRef = useRef(true);

  const initValues = {
    sub_sections: mainSection.sub_sections,
  };

  const handleSave = async (values) => {
    try {
      const payload = {
        main_sections: [
          {id: mainSection.id, sub_sections: values.sub_sections},
        ],
      };
      console.log(payload);
      const res = await authApis().patch(
        endpoints["syllabus-detail"](syllabusId),
        payload,
      );
      if (res.status === 200) {
        message.success("Lưu thành công");
      }
    } catch (error) {
      if (error.response?.data) {
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

  return (
    <Spin spinning={isSaving} tip="Đang lưu...">
      <Form
        form={form}
        layout="vertical"
        initialValues={initValues}
        onFinish={onFinish}
        requiredMark={false}
      >
        <Row gutter={[24, 24]}>
          {mainSection.sub_sections?.map((subSection, subIndex) => {
            const colSpan =
              subSection.display_mode === "textarea" ||
              subSection.type === "reference"
                ? 24
                : 12;

            return (
              <Col span={colSpan} key={subSection.id}>
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
            );
          })}
        </Row>

        <div className="flex justify-end mt-8">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={isSaving}
            style={{
              fontWeight: 600,
              height: 42,
              padding: "0 32px",
              borderRadius: 8,
              boxShadow: "none",
            }}
          >
            Lưu thay đổi phần này
          </Button>
        </div>
      </Form>
    </Spin>
  );
};

export default MainSectionForm;
