import {Form, message, Tabs} from "antd";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import MainSectionForm from "./MainSectionForm";
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
    loadSyllabusDetail(syllabusId);
  }, []);

  if (loading && !syllabusData.id) {
    return <MySpinner />;
  }

  const tabItems =
    syllabusData.main_sections.map((mainSection, index) => ({
      key: mainSection.id.toString(),
      label: `${index + 1}. ${mainSection.name}`,
      children: (
        <div style={{padding: 24, backgroundColor: "#fff", borderRadius: 8}}>
          <MainSectionForm syllabusId={syllabusId} mainSection={mainSection} />
        </div>
      ),
    })) || [];
  return (
    <div style={{padding: 24}}>
      <h2 style={{marginBottom: 24}}>Chỉnh sửa đề cương</h2>

      <Tabs items={tabItems} tabPosition="top" destroyInactiveTabPane={false} />
    </div>
  );
};

export default SyllabusEdit;
