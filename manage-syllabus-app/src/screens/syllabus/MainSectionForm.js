import {Button, Col, Form, Input, message, Row, Spin} from "antd";
import {useRef, useState, useEffect} from "react";
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
      console.error("Chi tiết lỗi:", error.response?.data);

      if (error.response?.data) {
        const errData = error.response.data;

        let errorMsg = "Lỗi khi lưu";
        if (errData.err_msg) {
          errorMsg = Array.isArray(errData.err_msg)
            ? errData.err_msg[0]
            : errData.err_msg;
        }

        message.error(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const onFinish = (values) => {
    clearTimeout(timerRef.current);

    setIsSaving(true);

    timerRef.current = setTimeout(() => {
      handleSave(values);
    }, 500);
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
      >
        <Row gutter={[16, 16]}>
          {mainSection.sub_sections?.map((subSection, subIndex) => {
            const colSpan =
              subSection.display_mode === "textarea" ||
              subSection.type === "reference"
                ? 24
                : 12;

            return (
              <Col span={colSpan} key={subSection.id}>
                {subSection.name && (
                  <p style={{fontWeight: "bold", marginBottom: 4}}>
                    {subSection.position}. {subSection.name}
                  </p>
                )}

                <Form.Item name={["sub_sections", subIndex, "id"]} hidden>
                  <Input />
                </Form.Item>

                <SubSectionRenderer
                  item={subSection}
                  basePath={["sub_sections", subIndex]}
                />
              </Col>
            );
          })}
        </Row>

        <Form.Item style={{textAlign: "right", marginTop: 24}}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={isSaving}
          >
            Lưu phần {mainSection.name}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default MainSectionForm;
