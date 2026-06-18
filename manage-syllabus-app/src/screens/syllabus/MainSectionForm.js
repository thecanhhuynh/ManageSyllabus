import {Button, Form, message, Spin} from "antd";
import {useState} from "react";
import MySpinner from "../../components/MySpinner";
import SubSectionRenderer from "../../components/SubSectionRender";
import {SaveOutlined} from "@ant-design/icons";
const MainSectionForm = ({syllabusId, mainSection}) => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const initValues = {
    sub_sections: mainSection.sub_sections,
  };

  const onFinish = async (values) => {
    try {
      setIsSaving(true);
      const payload = {
        main_sections: [
          {id: mainSection.id, sub_sections: values.sub_sections},
        ],
      };

      message.success("Lưu thành công");
    } catch (error) {
      message.error("Lỗi khi lưu");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Spin spinning={isSaving} tip="Đang lưu...">
      <Form
        form={form}
        layout="vertical"
        initialValues={initValues}
        onFinish={onFinish}
      >
        {mainSection.sub_sections?.map((subSection, subIndex) => (
          <div key={subSection.id} style={{marginBottom: 16}}>
            {subSection.name && (
              <p style={{fontWeight: "bold"}}>{subSection.name}</p>
            )}

            <SubSectionRenderer
              item={subSection}
              basePath={["sub_sections", subIndex]}
            />
          </div>
        ))}

        <Form.Item style={{textAlign: "right", marginTop: 24}}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Lưu phần {mainSection.name}
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
};

export default MainSectionForm;
