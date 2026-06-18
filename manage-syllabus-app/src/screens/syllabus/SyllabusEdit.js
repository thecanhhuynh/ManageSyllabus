import {Button, Card, Col, Form, message, Row} from "antd";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import SubSectionRenderer from "../../components/SubSectionRender";

const SyllabusEdit = () => {
  const params = useParams();
  const syllabusId = params.syllabusId;
  const [loading, setLoading] = useState(false);
  const [syllabusData, setSyllabusData] = useState({});

  const [form] = Form.useForm();

  const loadSyllabusDetail = async (syllabusId) => {
    try {
      setLoading(true);

      const res = await authApis().get(
        endpoints["syllabus-detail"](syllabusId),
      );
      if (res.status === 200) {
        setSyllabusData(res.data);
        form.setFieldsValue(res.data);
      } else {
        console.log("Không có data");
      }
    } catch (error) {
      message.error("Tải thông tin đề cương chi tiết thất bại");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabusDetail(syllabusId);
  }, []);

  const handleFinish = (values) => {
    console.log("Dữ liệu chuẩn bị gửi lên API PATCH:", values);
  };

  if (loading && !syllabusData.id) {
    return <MySpinner />;
  }
  return (
    <div style={{maxWidth: 1000, margin: "0 auto", padding: 20}}>
      <h2
        style={{
          textAlign: "center",
          textTransform: "uppercase",
          color: "#00529C",
        }}
      >
        {syllabusData.name || "Đang tải..."}
      </h2>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {syllabusData.main_sections?.map((mainSection, mainIndex) => (
          <Card
            key={mainSection.id}
            title={
              <span
                style={{fontSize: "18px", color: "#1890ff"}}
              >{`${mainSection.position}. ${mainSection.name}`}</span>
            }
            style={{marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.1)"}}
          >
            {" "}
            <Row gutter={16}>
              {mainSection.sub_sections?.map((subSection, subIndex) => {
                const colSpan =
                  subSection.display_mode === "textarea" ||
                  subSection.type === "reference"
                    ? 24
                    : 12;

                return (
                  <Col
                    span={colSpan}
                    key={subSection.id}
                    style={{marginBottom: 8}}
                  >
                    {subSection.name && (
                      <p style={{fontWeight: "bold", marginBottom: 4}}>
                        {subSection.name}
                      </p>
                    )}

                    <SubSectionRenderer
                      item={subSection}
                      mainIndex={mainIndex}
                      subIndex={subIndex}
                    />
                  </Col>
                );
              })}
            </Row>
          </Card>
        ))}

        <Form.Item style={{textAlign: "right"}}>
          <Button type="primary" htmlType="submit" size="large">
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SyllabusEdit;
