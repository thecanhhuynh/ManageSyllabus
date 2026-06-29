import {message, Tabs, Typography, Card} from "antd";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import MainSectionForm from "./MainSectionForm";

const {Title} = Typography;

const SyllabusEdit = () => {
  const params = useParams();
  const syllabusId = params.syllabusId;
  const [loading, setLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState({});

  const loadSyllabusDetail = async (syllabusId) => {
    try {
      setLoading(true);
      const res = await authApis().get(
        endpoints["syllabus-detail"](syllabusId),
      );
      if (res.status === 200) {
        setSyllabusData(res.data);
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
    if (syllabusId) {
      loadSyllabusDetail(syllabusId);
    }
  }, [syllabusId]);

  if (loading && !syllabusData.id) {
    return <MySpinner message="Đang tải dữ liệu đề cương..." />;
  }

  const tabItems = syllabusData.main_sections?.map((mainSection, index) => ({
    key: mainSection.id.toString(),
    label: `${index + 1}. ${mainSection.name}`,
    children: (
      <div className="pt-4 pb-6">
        <MainSectionForm syllabusId={syllabusId} mainSection={mainSection} />
      </div>
    ),
  }));

  return (
    <div
      className="p-6"
      style={{background: "#f8fafb", minHeight: "calc(100vh - 76px)"}}
    >
      <div style={{maxWidth: 1200, margin: "0 auto"}}>
        <div
          className="flex items-center justify-between px-6 py-4 mb-6"
          style={{
            position: "sticky",
            top: 76,
            zIndex: 40,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
            border: "1px solid #f0f0f0",
          }}
        >
          <div className="flex-1 text-center">
            <Title
              level={4}
              style={{margin: 0, color: "#1f2937", fontWeight: 700}}
            >
              {syllabusData.name || "Chỉnh sửa Đề cương chi tiết"}
            </Title>
            <div style={{color: "#6b7280", fontSize: 13, marginTop: 4}}>
              Hệ thống sẽ lưu dữ liệu độc lập theo từng phần (Tab)
            </div>
          </div>
        </div>

        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            background: "transparent",
            boxShadow: "none",
          }}
          bodyStyle={{padding: 0}}
        >
          <Tabs
            type="card"
            items={tabItems}
            tabBarGutter={6}
            style={{marginBottom: 0}}
            className="custom-saas-tabs"
          />
        </Card>
      </div>
    </div>
  );
};

export default SyllabusEdit;
