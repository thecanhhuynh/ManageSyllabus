import {
  message,
  Tabs,
  Typography,
  Card,
  notification,
  Button,
  Tag,
  Tooltip,
  Modal,
  Alert,
  Input,
} from "antd";
import {useEffect, useState, useRef, useContext} from "react";
import {useParams} from "react-router-dom";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileWordOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {authApis, endpoints} from "../../config/Apis";
import {MyUserContext} from "../../config/contexts/MyContext";
import MySpinner from "../../components/MySpinner";
import MainSectionForm from "./MainSectionForm";
import {useSyllabusStore} from "../../store/useSyllabusStore";
import CustomColumnService from "../../services/customColumnService";
import SignatureService from "../../services/signatureService";
import {resolveMediaUrl} from "../../utils/mediaUtils";

const {Title} = Typography;

const SyllabusEdit = () => {
  const params = useParams();
  const syllabusId = params.syllabusId;
  const [loading, setLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState({});
  const [approving, setApproving] = useState(false);
  const [unapproving, setUnapproving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [unapproveModalOpen, setUnapproveModalOpen] = useState(false);
  const [unapproveReason, setUnapproveReason] = useState("");
  const [leaderSignature, setLeaderSignature] = useState(null);
  const [user] = useContext(MyUserContext);
  const templateIdRef = useRef(null);

  const isFacultyLeader =
    user?.lecturer?.is_leader ||
    user?.is_superuser ||
    user?.user_role === "admin";
  const isAdmin = user?.is_superuser || user?.user_role === "admin";
  const isSelfAuthored = Boolean(
    (syllabusData?.lecturer?.id &&
      user?.lecturer?.id &&
      syllabusData.lecturer.id === user.lecturer.id) ||
    (syllabusData?.lecturer?.user?.id &&
      user?.id &&
      syllabusData.lecturer.user.id === user.id) ||
    (syllabusData?.lecturer_id &&
      (syllabusData.lecturer_id === user?.lecturer?.id ||
        syllabusData.lecturer_id === user?.id)),
  );
  const isApproved = Boolean(
    (syllabusData?.is_approved || syllabusData?.status === "Approved") &&
    syllabusData?.approved_by,
  );

  const handleOpenApproveModal = async () => {
    setApproveModalOpen(true);
    try {
      const data = await SignatureService.getUserSignature();
      setLeaderSignature(data?.signature_url || null);
    } catch (err) {
      console.error("Lỗi lấy chữ ký lãnh đạo:", err);
    }
  };

  const handleApproveSyllabus = async () => {
    try {
      setApproving(true);
      await SignatureService.approveSyllabus(syllabusId);
      message.success("Phê duyệt đề cương thành công!");
      setApproveModalOpen(false);
      await loadSyllabusDetail(syllabusId);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.error || "Lỗi khi phê duyệt đề cương!",
      );
    } finally {
      setApproving(false);
    }
  };

  const handleConfirmUnapproveSyllabus = async () => {
    if (!unapproveReason.trim()) {
      message.warning("Vui lòng nhập lý do hoặc các điểm cần chỉnh sửa!");
      return;
    }
    try {
      setUnapproving(true);
      await SignatureService.unapproveSyllabus(
        syllabusId,
        unapproveReason.trim(),
      );
      message.success(
        "Đã hủy phê duyệt, đề cương đã chuyển về Bản nháp để chỉnh sửa.",
      );
      setUnapproveModalOpen(false);
      setUnapproveReason("");
      await loadSyllabusDetail(syllabusId);
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.error || "Lỗi khi hủy phê duyệt đề cương!",
      );
    } finally {
      setUnapproving(false);
    }
  };

  const handleExportDocx = async () => {
    if (!isApproved) {
      message.warning(
        "Đề cương chưa được Lãnh đạo Khoa phê duyệt. Không thể xuất file chính thức.",
      );
      return;
    }
    try {
      setExporting(true);
      message.loading({
        content: "Đang tạo file Word...",
        key: `export_${syllabusId}`,
      });
      const url = endpoints["export-docx"](syllabusId);
      const res = await authApis().get(url, {responseType: "blob"});
      const fileData = res.data ? res.data : res;
      const blob = new Blob([fileData], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `De_Cuong_${syllabusId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      message.success({
        content: "Đã tải file Word thành công!",
        key: `export_${syllabusId}`,
      });
    } catch (err) {
      console.error(err);
      message.error({
        content: "Lỗi khi xuất file docx!",
        key: `export_${syllabusId}`,
      });
    } finally {
      setExporting(false);
    }
  };

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
        const setCurrentSyllabus = useSyllabusStore.getState().setCurrentSyllabus;
        const serverRevision = res.data.revision || 1;
        initData(serverRevision, res.data.main_sections);
        setLabelOverrides(res.data.label_overrides || {});
        setCurrentSyllabus(res.data);
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
          <MainSectionForm
            syllabusId={syllabusId}
            mainSection={mainSection}
            isApproved={isApproved}
          />
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
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Title
                level={4}
                style={{margin: 0, color: "#1f2937", fontWeight: 700}}
              >
                {syllabusData.name || "Chỉnh sửa Đề cương chi tiết"}
              </Title>
              {isApproved ? (
                <Tooltip
                  title={
                    syllabusData.approved_by_name
                      ? `Được phê duyệt bởi ${syllabusData.approved_by_name}${syllabusData.approved_date ? ` lúc ${syllabusData.approved_date}` : ""}`
                      : "Đề cương đã được phê duyệt"
                  }
                >
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Đã phê duyệt
                  </Tag>
                </Tooltip>
              ) : (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                  {syllabusData.status === "Submitted"
                    ? "Chờ phê duyệt"
                    : "Bản nháp"}
                </Tag>
              )}
            </div>
            <div style={{color: "#6b7280", fontSize: 13, marginTop: 4}}>
              Khoa: {syllabusData.faculty_name || "N/A"} | Giảng viên:{" "}
              {syllabusData.lecturer_name || "N/A"}
              {isApproved && syllabusData.approved_by_name && (
                <span>
                  {" "}
                  | Phê duyệt bởi:{" "}
                  <strong style={{color: "#16a34a"}}>
                    {syllabusData.approved_by_name}
                  </strong>
                  {syllabusData.approved_date
                    ? ` (${syllabusData.approved_date})`
                    : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isFacultyLeader && !isApproved && (
              <Tooltip
                title={
                  isSelfAuthored && !isAdmin
                    ? "Bạn là giảng viên biên soạn đề cương này, không thể tự phê duyệt theo quy định BR-04."
                    : "Ký duyệt & Ban hành"
                }
              >
                <span>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    disabled={isSelfAuthored && !isAdmin}
                    style={{
                      background:
                        !isSelfAuthored || isAdmin ? "#16a34a" : undefined,
                      borderColor:
                        !isSelfAuthored || isAdmin ? "#16a34a" : undefined,
                    }}
                    loading={approving}
                    onClick={handleOpenApproveModal}
                  >
                    Phê duyệt đề cương
                  </Button>
                </span>
              </Tooltip>
            )}

            {isFacultyLeader && isApproved && (
              <Button
                danger
                loading={unapproving}
                onClick={() => setUnapproveModalOpen(true)}
              >
                Yêu cầu chỉnh sửa
              </Button>
            )}

            <Button
              icon={<FileWordOutlined />}
              loading={exporting}
              onClick={handleExportDocx}
            >
              Xuất file Word
            </Button>
          </div>
        </div>

        {isApproved && (
          <Alert
            message="Đề cương đã được phê duyệt chính thức"
            description={`Đề cương này đã được phê duyệt bởi ${syllabusData.approved_by_name || "Lãnh đạo Khoa"}${syllabusData.approved_date ? ` lúc ${syllabusData.approved_date}` : ""}. Toàn bộ nội dung hiện đang được khóa ở chế độ chỉ đọc. Nếu cần chỉnh sửa lại, vui lòng liên hệ Lãnh đạo Khoa để hủy duyệt.`}
            type="success"
            showIcon
            style={{marginBottom: 16, borderRadius: 8}}
          />
        )}

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

        <Modal
          title={<span>🛡️ Xác nhận Phê duyệt đề cương đào tạo</span>}
          open={approveModalOpen}
          onCancel={() => setApproveModalOpen(false)}
          onOk={handleApproveSyllabus}
          okText="Xác nhận phê duyệt"
          cancelText="Đóng"
          confirmLoading={approving}
        >
          <div className="py-2" style={{lineHeight: 1.8}}>
            <div style={{marginBottom: 8}}>
              <strong>Tên đề cương:</strong> {syllabusData.name}
            </div>
            <div style={{marginBottom: 8}}>
              <strong>Khoa:</strong> {syllabusData.faculty_name} |{" "}
              <strong>Giảng viên:</strong> {syllabusData.lecturer_name}
            </div>
            <div
              style={{
                padding: 12,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                color: "#475569",
                marginBottom: 12,
              }}
            >
              Khi phê duyệt, đề cương sẽ được ban hành chính thức. Chữ ký cá
              nhân của Lãnh đạo Khoa ({user?.last_name} {user?.first_name}) sẽ
              được tự động đóng dấu vào bảng chữ ký ở chân trang khi xuất file
              Word.
            </div>
            {leaderSignature ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 12,
                  border: "1.5px dashed #16a34a",
                  borderRadius: 8,
                  background: "#f0fdf4",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Chữ ký cá nhân của bạn sẽ được sử dụng:
                </div>
                <img
                  src={resolveMediaUrl(leaderSignature)}
                  alt="Chữ ký lãnh đạo"
                  style={{
                    maxHeight: 65,
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : (
              <div
                style={{fontSize: 13, color: "#ea580c", fontStyle: "italic"}}
              >
                ⚠️ Bạn chưa thiết lập chữ ký cá nhân trong trang Thông tin cá
                nhân. Bạn vẫn có thể phê duyệt, nhưng file Word xuất ra sẽ để
                trống phần chữ ký.
              </div>
            )}
          </div>
        </Modal>

        <Modal
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#d97706",
              }}
            >
              <ExclamationCircleOutlined />
              <span>Yêu cầu chỉnh sửa đề cương</span>
            </div>
          }
          open={unapproveModalOpen}
          onOk={handleConfirmUnapproveSyllabus}
          onCancel={() => {
            setUnapproveModalOpen(false);
            setUnapproveReason("");
          }}
          okText="Gửi yêu cầu sửa"
          cancelText="Đóng"
          okButtonProps={{danger: true}}
          confirmLoading={unapproving}
        >
          <div style={{display: "flex", flexDirection: "column", gap: 12}}>
            <p style={{margin: 0, color: "#475569"}}>
              Vui lòng nhập lý do hoặc nội dung cần chỉnh sửa để thông báo đến
              giảng viên biên soạn:
            </p>
            <Input.TextArea
              rows={4}
              placeholder="Nhập chi tiết các nội dung cần giảng viên hoàn thiện hoặc chỉnh sửa..."
              value={unapproveReason}
              onChange={(e) => setUnapproveReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SyllabusEdit;
