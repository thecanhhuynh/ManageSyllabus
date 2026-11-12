import React, {useContext, useEffect, useState, useCallback} from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Select,
  Tooltip,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileWordOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  RollbackOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import {useNavigate} from "react-router-dom";
import {MyUserContext} from "../../config/contexts/MyContext";
import {authApis, endpoints} from "../../config/Apis";
import SignatureService from "../../services/signatureService";
import {resolveMediaUrl} from "../../utils/mediaUtils";
import MySpinner from "../../components/MySpinner";
import CleanInput from "../../components/CleanInput";
import {cleanWhitespace} from "../../utils/stringUtils";

const {Title, Text} = Typography;

const FacultyApprovals = () => {
  const [user] = useContext(MyUserContext);
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [syllabuses, setSyllabuses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [lecturerFilter, setLecturerFilter] = useState("ALL");

  const [programOptions, setProgramOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [lecturerOptions, setLecturerOptions] = useState([]);

  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [leaderSignature, setLeaderSignature] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [unapproveModal, setUnapproveModal] = useState({
    open: false,
    record: null,
    reason: "",
    loading: false,
  });

  const isFacultyLeader = Boolean(
    user?.lecturer?.is_leader ||
    user?.is_superuser ||
    user?.user_role === "admin",
  );

  const isFilterActive =
    searchText.trim() !== "" ||
    statusFilter !== "ALL" ||
    programFilter !== "ALL" ||
    subjectFilter !== "ALL" ||
    lecturerFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setProgramFilter("ALL");
    setSubjectFilter("ALL");
    setLecturerFilter("ALL");
  };

  const loadFilterOptions = useCallback(async () => {
    try {
      const [tpRes, subRes, lecRes] = await Promise.allSettled([
        authApis().get(endpoints["training-programs"]),
        authApis().get(endpoints["subjects"]),
        authApis().get(endpoints["lecturers"]),
      ]);

      if (tpRes.status === "fulfilled") {
        const list = tpRes.value.data?.results || tpRes.value.data || [];
        setProgramOptions(
          list.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.academic_year})`,
          })),
        );
      }

      if (subRes.status === "fulfilled") {
        const list = subRes.value.data?.results || subRes.value.data || [];
        setSubjectOptions(
          list.map((s) => ({
            value: s.id,
            label: s.code ? `${s.code} - ${s.name}` : s.name,
          })),
        );
      }

      if (lecRes.status === "fulfilled") {
        const list = lecRes.value.data?.results || lecRes.value.data || [];
        setLecturerOptions(
          list.map((l) => ({
            value: l.id,
            label:
              `${l.last_name || ""} ${l.first_name || ""}`.trim() || l.name,
          })),
        );
      }
    } catch (err) {
      console.error("Lỗi tải danh mục bộ lọc:", err);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const mergeOptionsFromSyllabuses = (list) => {
    if (!list?.length) return;
    setProgramOptions((prev) => {
      const map = new Map(prev.map((p) => [String(p.value), p]));
      list.forEach((s) => {
        (s.training_programs || []).forEach((tp) => {
          if (!map.has(String(tp.id))) {
            map.set(String(tp.id), {
              value: tp.id,
              label: `${tp.name} (${tp.academic_year})`,
            });
          }
        });
      });
      return Array.from(map.values());
    });
    setSubjectOptions((prev) => {
      const map = new Map(prev.map((s) => [String(s.value), s]));
      list.forEach((item) => {
        if (item.subject?.id && !map.has(String(item.subject.id))) {
          map.set(String(item.subject.id), {
            value: item.subject.id,
            label: item.subject.code
              ? `${item.subject.code} - ${item.subject.name}`
              : item.subject.name,
          });
        }
      });
      return Array.from(map.values());
    });
    setLecturerOptions((prev) => {
      const map = new Map(prev.map((l) => [String(l.value), l]));
      list.forEach((item) => {
        const lec = item.lecturer;
        if (lec?.id && !map.has(String(lec.id))) {
          map.set(String(lec.id), {
            value: lec.id,
            label:
              `${lec.last_name || ""} ${lec.first_name || ""}`.trim() ||
              item.lecturer_name,
          });
        }
      });
      return Array.from(map.values());
    });
  };

  const loadSyllabuses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authApis().get(`${endpoints["syllabuses"]}?page_size=1000`);
      const list = res.data?.results || res.data || [];
      setSyllabuses(list);
      mergeOptionsFromSyllabuses(list);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tải danh sách đề cương của Khoa!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyllabuses();
  }, [loadSyllabuses]);

  useEffect(() => {
    let result = [...syllabuses];

    if (statusFilter !== "ALL") {
      result = result.filter((item) => {
        const isApproved = Boolean(item.is_approved || item.status === "Approved");
        if (statusFilter === "Approved") return isApproved;
        if (statusFilter === "Submitted")
          return item.status === "Submitted" && !isApproved;
        if (statusFilter === "Draft")
          return (!item.status || item.status === "Draft") && !isApproved;
        return true;
      });
    }

    if (programFilter !== "ALL") {
      result = result.filter((item) => {
        const tps = item.training_programs || [];
        return tps.some((tp) => String(tp.id) === String(programFilter));
      });
    }

    if (subjectFilter !== "ALL") {
      result = result.filter((item) => {
        const sId = item.subject?.id || item.subject_id;
        return String(sId) === String(subjectFilter);
      });
    }

    if (lecturerFilter !== "ALL") {
      result = result.filter((item) => {
        const lId = item.lecturer?.id || item.lecturer_id;
        return String(lId) === String(lecturerFilter);
      });
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter((item) => {
        const name = (item.name || "").toLowerCase();
        const subName = (
          item.subject?.name ||
          item.subject_name ||
          ""
        ).toLowerCase();
        const subCode = (item.subject?.code || "").toLowerCase();
        const lecName =
          `${item.lecturer?.last_name || ""} ${item.lecturer?.first_name || ""}`.toLowerCase();
        const tpNames = (item.training_programs || [])
          .map((tp) => `${tp.name} ${tp.academic_year}`)
          .join(" ")
          .toLowerCase();
        return (
          name.includes(q) ||
          subName.includes(q) ||
          subCode.includes(q) ||
          lecName.includes(q) ||
          tpNames.includes(q)
        );
      });
    }

    setFilteredData(result);
  }, [
    syllabuses,
    statusFilter,
    programFilter,
    subjectFilter,
    lecturerFilter,
    searchText,
  ]);

  const handleOpenApproveModal = async (record) => {
    setSelectedSyllabus(record);
    setApproveModalOpen(true);
    try {
      const data = await SignatureService.getUserSignature();
      setLeaderSignature(data?.signature_url || null);
    } catch (err) {
      console.error("Lỗi tải chữ ký:", err);
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedSyllabus?.id) return;
    try {
      setActionLoading(true);
      await SignatureService.approveSyllabus(selectedSyllabus.id);
      message.success(
        `Đã phê duyệt đề cương: ${selectedSyllabus.name || selectedSyllabus.id}`,
      );
      setApproveModalOpen(false);
      setSelectedSyllabus(null);
      await loadSyllabuses();
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.error || "Lỗi khi phê duyệt đề cương!",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUnapprove = (record) => {
    setUnapproveModal({
      open: true,
      record,
      reason: "",
      loading: false,
    });
  };

  const handleConfirmUnapprove = async () => {
    const {record, reason} = unapproveModal;
    if (!record?.id) return;
    const cleanReason = cleanWhitespace(reason);
    if (!cleanReason) {
      message.warning("Vui lòng nhập lý do hoặc ghi chú yêu cầu chỉnh sửa!");
      return;
    }
    try {
      setUnapproveModal((prev) => ({...prev, loading: true}));
      await SignatureService.unapproveSyllabus(record.id, cleanReason);
      message.success(
        `Đã chuyển đề cương #${record.id} về Bản nháp để giảng viên chỉnh sửa.`,
      );
      setUnapproveModal({
        open: false,
        record: null,
        reason: "",
        loading: false,
      });
      await loadSyllabuses();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.error || "Lỗi khi hủy phê duyệt!");
      setUnapproveModal((prev) => ({...prev, loading: false}));
    }
  };

  const handleExportDocx = async (record) => {
    const isApproved = Boolean(record.is_approved || record.status === "Approved");
    if (!isApproved) {
      message.warning(
        "Đề cương chưa được Lãnh đạo Khoa phê duyệt. Không thể xuất file chính thức.",
      );
      return;
    }
    try {
      setExportingId(record.id);
      message.loading({
        content: "Đang tạo file Word...",
        key: `export_${record.id}`,
      });
      const url = endpoints["export-docx"](record.id);
      const res = await authApis().get(url, {responseType: "blob"});
      const blob = new Blob([res.data || res], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `De_Cuong_${record.id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      message.success({
        content: "Đã tải file Word thành công!",
        key: `export_${record.id}`,
      });
    } catch (err) {
      console.error(err);
      message.error({
        content: "Lỗi khi xuất file docx!",
        key: `export_${record.id}`,
      });
    } finally {
      setExportingId(null);
    }
  };

  const isSyllabusApproved = (item) => Boolean(item?.is_approved || item?.status === "Approved");

  const countTotal = syllabuses.length;
  const countApproved = syllabuses.filter(
    (s) => isSyllabusApproved(s),
  ).length;
  const countSubmitted = syllabuses.filter(
    (s) => s.status === "Submitted" && !isSyllabusApproved(s),
  ).length;
  const countDraft = countTotal - countApproved - countSubmitted;

  const columns = [
    {
      title: "Mã môn",
      dataIndex: ["subject", "code"],
      key: "code",
      width: 100,
      render: (code) => (
        <div style={{minWidth: 80, whiteSpace: "nowrap"}}>
          <Tag color="blue" style={{fontWeight: 600}}>
            {code || "N/A"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Tên Đề cương / Học phần",
      key: "name",
      width: 320,
      render: (_, record) => (
        <div style={{minWidth: 260, wordBreak: "normal"}}>
          <div
            style={{
              fontWeight: 600,
              color: "#1f2937",
              fontSize: 14,
              wordBreak: "normal",
              overflowWrap: "break-word",
            }}
          >
            {record.name || record.subject?.name || "Đề cương chi tiết"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              wordBreak: "normal",
              overflowWrap: "break-word",
            }}
          >
            Học phần: {record.subject?.name || "N/A"}
          </div>
          {record.training_programs && record.training_programs.length > 0 ? (
            <div
              style={{marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4}}
            >
              {record.training_programs.map((tp) => (
                <Tag
                  key={tp.id}
                  color="purple"
                  style={{fontSize: 11, margin: 0, whiteSpace: "nowrap"}}
                >
                  {tp.name}-{tp.academic_year}
                </Tag>
              ))}
            </div>
          ) : (
            <div style={{marginTop: 4}}>
              <Tag color="orange" style={{fontSize: 11, margin: 0}}>
                Chưa gán CTĐT
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giảng viên biên soạn",
      key: "lecturer",
      width: 220,
      render: (_, record) => {
        const lec = record.lecturer;
        const name =
          `${lec?.last_name || ""} ${lec?.first_name || ""}`.trim() ||
          record.lecturer_name ||
          "N/A";
        return (
          <div style={{minWidth: 160, wordBreak: "normal"}}>
            <div style={{fontWeight: 500, color: "#374151"}}>{name}</div>
            <div style={{marginTop: 3}}>
              {lec?.has_signature ? (
                <Tag color="cyan" style={{fontSize: 11}}>
                  Đã có chữ ký
                </Tag>
              ) : (
                <Tag color="default" style={{fontSize: 11}}>
                  Chưa có chữ ký
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => {
        const isApproved = Boolean(record.is_approved || record.status === "Approved");
        if (isApproved) {
          return (
            <Tooltip
              title={`Đã duyệt bởi: ${record.approved_by_name || "Lãnh đạo Khoa"}`}
            >
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Đã phê duyệt
              </Tag>
            </Tooltip>
          );
        }
        if (record.status === "Submitted") {
          return (
            <Tag color="processing" icon={<ClockCircleOutlined />}>
              Chờ phê duyệt
            </Tag>
          );
        }
        return (
          <Tag color="default" icon={<ClockCircleOutlined />}>
            Bản nháp
          </Tag>
        );
      },
    },
    {
      title: "Người phê duyệt",
      key: "approver",
      width: 180,
      render: (_, record) => {
        const isApproved = Boolean(record.is_approved || record.status === "Approved");
        if (!isApproved) {
          return (
            <span style={{color: "#9ca3af", fontStyle: "italic"}}>
              Chưa duyệt
            </span>
          );
        }
        return (
          <div>
            <div style={{fontWeight: 600, color: "#16a34a"}}>
              {record.approved_by_name || "Lãnh đạo Khoa"}
            </div>
            <div style={{fontSize: 11, color: "#6b7280"}}>
              {record.approved_date || "Đã phê duyệt"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 280,
      fixed: "right",
      render: (_, record) => {
        const isApproved = Boolean(record.is_approved || record.status === "Approved");
        const isSelfAuthored = Boolean(
          (record.lecturer_id &&
            (record.lecturer_id === user?.lecturer?.id ||
              record.lecturer_id === user?.id)) ||
          (record.lecturer?.id && record.lecturer.id === user?.lecturer?.id) ||
          (record.lecturer?.user?.id && record.lecturer.user.id === user?.id),
        );
        const isAdmin = user?.is_superuser || user?.user_role === "admin";
        const canApprove = !isSelfAuthored || isAdmin;

        return (
          <Space size="small" wrap={false} style={{whiteSpace: "nowrap"}}>
            <Tooltip title="Xem nội dung chi tiết">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => nav(`/syllabuses/${record.id}`)}
              >
                Chi tiết
              </Button>
            </Tooltip>

            {!isApproved ? (
              <Tooltip
                title={
                  !canApprove
                    ? "Bạn là giảng viên biên soạn đề cương này, không thể tự phê duyệt theo quy định BR-04."
                    : record.status !== "Submitted"
                    ? "Đề cương đang là bản nháp / chờ giảng viên chỉnh sửa và ký nộp lại."
                    : "Ký duyệt đề cương"
                }
              >
                <span>
                  <Button
                    size="small"
                    type="primary"
                    disabled={!canApprove || record.status !== "Submitted"}
                    icon={<SafetyCertificateOutlined />}
                    style={{
                      backgroundColor:
                        canApprove && record.status === "Submitted"
                          ? "#16a34a"
                          : undefined,
                      borderColor:
                        canApprove && record.status === "Submitted"
                          ? "#16a34a"
                          : undefined,
                    }}
                    onClick={() => handleOpenApproveModal(record)}
                  >
                    Phê duyệt
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Yêu cầu giảng viên chỉnh sửa lại">
                <Button
                  size="small"
                  danger
                  icon={<RollbackOutlined />}
                  onClick={() => handleOpenUnapprove(record)}
                >
                  Yêu cầu sửa
                </Button>
              </Tooltip>
            )}

            <Tooltip
              title={
                isApproved
                  ? "Xuất file Word chính thức"
                  : "Cần phê duyệt trước khi xuất file"
              }
            >
              <Button
                size="small"
                icon={<FileWordOutlined />}
                disabled={!isApproved}
                loading={exportingId === record.id}
                onClick={() => handleExportDocx(record)}
              >
                Xuất file
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  if (!isFacultyLeader) {
    return (
      <Card
        style={{
          borderRadius: 12,
          marginTop: 24,
          textAlign: "center",
          padding: 32,
        }}
      >
        <Title level={4} type="danger">
          Bạn không có quyền truy cập trang này
        </Title>
        <Text type="secondary">
          Chỉ Lãnh đạo Khoa (Trưởng khoa, Phó trưởng khoa) mới có quyền phê
          duyệt đề cương.
        </Text>
        <div style={{marginTop: 16}}>
          <Button type="primary" onClick={() => nav("/")}>
            Quay về Trang chủ
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{paddingBottom: 40}}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <Title
            level={3}
            style={{margin: 0, fontWeight: 700, color: "#1f2937"}}
          >
            Phê duyệt Đề cương Khoa
          </Title>
          <Text style={{color: "#6b7280", fontSize: 14}}>
            Đơn vị:{" "}
            {user?.lecturer?.faculty?.name || "Khoa Công nghệ thông tin"} |
            Người phụ trách: {user?.last_name} {user?.first_name}
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadSyllabuses}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Statistic
              title="Tổng số đề cương"
              value={countTotal}
              valueStyle={{color: "#1890ff", fontWeight: 700}}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Statistic
              title="Chờ phê duyệt"
              value={countSubmitted}
              valueStyle={{color: "#fa8c16", fontWeight: 700}}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Statistic
              title="Đã phê duyệt"
              value={countApproved}
              valueStyle={{color: "#16a34a", fontWeight: 700}}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 10,
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <Statistic
              title="Bản nháp"
              value={countDraft}
              valueStyle={{color: "#8c8c8c", fontWeight: 700}}
            />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #f0f0f0",
        }}
      >
        <div className="mb-4">
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={8}>
              <CleanInput
                placeholder="Tìm mã môn, tên môn, đề cương, giảng viên..."
                prefix={<SearchOutlined style={{color: "#bfbfbf"}} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                value={programFilter}
                onChange={setProgramFilter}
                style={{width: "100%"}}
                placeholder="Chương trình đào tạo"
                options={[
                  {value: "ALL", label: "Tất cả CTĐT"},
                  ...programOptions,
                ]}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                value={subjectFilter}
                onChange={setSubjectFilter}
                style={{width: "100%"}}
                placeholder="Môn học / Học phần"
                options={[
                  {value: "ALL", label: "Tất cả môn học"},
                  ...subjectOptions,
                ]}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                value={lecturerFilter}
                onChange={setLecturerFilter}
                style={{width: "100%"}}
                placeholder="Giảng viên biên soạn"
                options={[
                  {value: "ALL", label: "Tất cả giảng viên"},
                  ...lecturerOptions,
                ]}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={4}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{width: "100%"}}
                placeholder="Trạng thái"
                options={[
                  {value: "ALL", label: "Tất cả trạng thái"},
                  {value: "Submitted", label: "Chờ phê duyệt"},
                  {value: "Approved", label: "Đã phê duyệt"},
                  {value: "Draft", label: "Bản nháp"},
                ]}
              />
            </Col>
          </Row>

          {isFilterActive && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
              <div>
                Đang áp dụng bộ lọc: Tìm thấy{" "}
                <strong>{filteredData.length}</strong> / {syllabuses.length} đề
                cương
              </div>
              <Button
                type="link"
                size="small"
                icon={<ClearOutlined />}
                onClick={handleResetFilters}
                style={{padding: 0, fontSize: 12}}
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <MySpinner />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Tổng cộng ${total} đề cương`,
              showSizeChanger: false,
            }}
            scroll={{x: 1280}}
          />
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined
              style={{color: "#16a34a", fontSize: 20}}
            />
            <span>Xác nhận Phê duyệt Đề cương</span>
          </div>
        }
        open={approveModalOpen}
        onCancel={() => {
          setApproveModalOpen(false);
          setSelectedSyllabus(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setApproveModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={actionLoading}
            disabled={!leaderSignature}
            style={{
              backgroundColor: leaderSignature ? "#16a34a" : undefined,
              borderColor: leaderSignature ? "#16a34a" : undefined,
            }}
            onClick={handleConfirmApprove}
          >
            Ký duyệt & Ban hành
          </Button>,
        ]}
      >
        {selectedSyllabus && (
          <div className="py-2">
            <p>
              Bạn đang chuẩn bị phê duyệt đề cương:{" "}
              <strong>
                {selectedSyllabus.name || selectedSyllabus.subject?.name}
              </strong>
            </p>
            <p>
              Giảng viên biên soạn:{" "}
              <strong>
                {selectedSyllabus.lecturer?.last_name}{" "}
                {selectedSyllabus.lecturer?.first_name}
              </strong>
            </p>

            <div className="mt-4 p-3 border rounded bg-gray-50 text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Chữ ký số Lãnh đạo Khoa
              </div>
              {leaderSignature ? (
                <div className="flex justify-center">
                  <img
                    src={resolveMediaUrl(leaderSignature)}
                    alt="Chữ ký Lãnh đạo"
                    style={{maxHeight: 70, objectFit: "contain"}}
                  />
                </div>
              ) : (
                <Text type="danger" style={{fontSize: 12}}>
                  Bạn chưa thiết lập chữ ký cá nhân trong Hồ sơ. Hãy vào trang
                  Hồ sơ để vẽ hoặc tải lên chữ ký.
                </Text>
              )}
            </div>

            <Alert
              message="Lưu ý"
              description="Sau khi phê duyệt, đề cương sẽ được đóng dấu xác nhận và cho phép xuất file DOCX chính thức kèm chữ ký số của Lãnh đạo Khoa."
              type="info"
              showIcon
              style={{marginTop: 16}}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={<span>⚠️ Yêu cầu chỉnh sửa đề cương</span>}
        open={unapproveModal.open}
        onCancel={() =>
          setUnapproveModal({
            open: false,
            record: null,
            reason: "",
            loading: false,
          })
        }
        onOk={handleConfirmUnapprove}
        confirmLoading={unapproveModal.loading}
        okText="Gửi yêu cầu sửa"
        okButtonProps={{danger: true}}
        cancelText="Hủy"
      >
        <div style={{lineHeight: 1.6}}>
          <p>
            Bạn đang yêu cầu giảng viên chỉnh sửa lại đề cương:{" "}
            <strong>{unapproveModal.record?.name}</strong>.
          </p>
          <p style={{color: "#4b5563", fontSize: 13, marginBottom: 8}}>
            Vui lòng nhập lý do hoặc các điểm cần sửa đổi để giảng viên nắm rõ:
          </p>
          <CleanInput.TextArea
            rows={4}
            placeholder="Ví dụ: Cần cập nhật lại chuẩn đầu ra CLO 2.1 và bổ sung giáo trình mới..."
            value={unapproveModal.reason}
            onChange={(e) =>
              setUnapproveModal((prev) => ({...prev, reason: e.target.value}))
            }
          />
        </div>
      </Modal>
    </div>
  );
};

export default FacultyApprovals;
