import {message, Tabs, Typography, Card, notification, Button} from "antd";
import {useEffect, useState, useRef} from "react";
import {useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import MainSectionForm from "./MainSectionForm";
import {useSyllabusStore} from "../../store/useSyllabusStore";
import CustomColumnService from "../../services/customColumnService";

const {Title} = Typography;

const SyllabusEdit = () => {
  const params = useParams();
  const syllabusId = params.syllabusId;
  const [loading, setLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState({});
  const templateIdRef = useRef(null);

  const loadCustomData = async (templateIdInput) => {
    const targetTemplateId =
      typeof templateIdInput === "object"
        ? templateIdInput?.id
        : templateIdInput;
    if (!targetTemplateId) return;
    try {
      const [cols, vals] = await Promise.all([
        CustomColumnService.getCustomColumns(targetTemplateId),
        CustomColumnService.getCustomValues(syllabusId),
      ]);
      const valMap = {};
      (vals || []).forEach((v) => {
        const colId = v.column || v.column_id;
        if (!colId) return;
        valMap[colId] = v.value;
        if (v.object_id) {
          valMap[`${colId}_${v.object_id}`] = v.value;
        }
      });
      useSyllabusStore.getState().setCustomColumns(cols || []);
      useSyllabusStore.getState().setCustomValues(valMap);
    } catch {
      // Ignore if not configured
    }
  };

  const loadSyllabusDetail = async (id) => {
    try {
      setLoading(true);
      const res = await authApis().get(endpoints["syllabus-detail"](id));
      if (res.status === 200) {
        const initData = useSyllabusStore.getState().initData;
        const setLabelOverrides = useSyllabusStore.getState().setLabelOverrides;
        const serverRevision = res.data.revision || 1;
        initData(serverRevision, res.data.main_sections);
        setLabelOverrides(res.data.label_overrides || {});
        setSyllabusData(res.data);
        if (res.data.template) {
          const tplId =
            typeof res.data.template === "object"
              ? res.data.template.id
              : res.data.template;
          templateIdRef.current = tplId;
          loadCustomData(tplId);
        }
      }
    } catch (error) {
      message.error("Tải thông tin đề cương chi tiết thất bại");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const BASE_URL = process.env.REACT_APP_BASE_URL;
    const eventSource = new EventSource(
      `${BASE_URL}${endpoints["sse/sync-stream/"]}`,
    );

    eventSource.onmessage = (event) => {
      if (!event?.data) return;
      const data = JSON.parse(event.data);

      if (data.action === "sync_completed") {
        notification.info({
          message: "Template đã được cập nhật",
          description:
            "Chuyên viên vừa thay đổi cấu trúc Template. Vui lòng lưu các dữ liệu đang gõ và làm mới để xem thay đổi.",
          btn: (
            <Button
              type="primary"
              onClick={() => loadSyllabusDetail(syllabusId)}
            >
              Tải lại dữ liệu ngay
            </Button>
          ),
          duration: 0,
        });
        return;
      }

      if (data.action === "style_updated") {
        const currentTplId = templateIdRef.current;
        if (
          currentTplId &&
          data.template_id &&
          Number(currentTplId) !== Number(data.template_id)
        ) {
          return;
        }
        if (data.label_overrides) {
          useSyllabusStore.getState().setLabelOverrides(data.label_overrides);
        }
        const activeTplId = data.template_id || currentTplId;
        if (activeTplId) {
          loadCustomData(activeTplId);
        }
        notification.info({
          message: "Định dạng mẫu đề cương đã được cập nhật",
          description: `Chuyên viên vừa cập nhật mẫu "${data.template_name || ""}". Giao diện đã được tự động làm mới.`,
          duration: 5,
        });
        return;
      }
    };

    return () => {
      eventSource.close();
    };
  }, [syllabusId]);

  useEffect(() => {
    if (syllabusId) {
      loadSyllabusDetail(syllabusId);
    }
  }, [syllabusId]);

  if (loading && !syllabusData.id) {
    return <MySpinner message="Đang tải dữ liệu đề cương..." />;
  }

  const tabItems = [
    ...(syllabusData.main_sections?.map((mainSection, index) => ({
      key: mainSection.id.toString(),
      label: `${index + 1}. ${mainSection.name}`,
      children: (
        <div className="pt-4 pb-6">
          <MainSectionForm syllabusId={syllabusId} mainSection={mainSection} />
        </div>
      ),
    })) || []),
  ];



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
