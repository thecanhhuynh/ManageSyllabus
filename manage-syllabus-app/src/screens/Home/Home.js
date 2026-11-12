import {
  Button,
  message,
  Select,
  Space,
  Tag,
  Tooltip,
  Tabs,
  Modal,
  Table,
} from "antd";
import {useContext, useEffect, useState} from "react";
import {authApis, endpoints} from "../../config/Apis";
import {
  SearchOutlined,
  EditOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import MySpinner from "../../components/MySpinner";
import {useNavigate} from "react-router-dom";
import cookies from "react-cookies";
import {MyUserContext} from "../../config/contexts/MyContext";
import SignatureService from "../../services/signatureService";
import CleanInput from "../../components/CleanInput";

const Home = () => {
  const [user] = useContext(MyUserContext);
  const [loading, setLoading] = useState(false);
  const [exportingId, setExportingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickApproveModal, setQuickApproveModal] = useState({
    open: false,
    item: null,
    loading: false,
  });
  const [faculties, setFaculties] = useState([]);
  const [facultyId, setFacultyId] = useState(null);
  const [facultyPage, setFacultyPage] = useState(1);
  const [hasNextFaculties, setHasNextFaculties] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [subjectPage, setSubjectPage] = useState(1);
  const [hasNextSubjects, setHasNextSubjects] = useState(false);
  const [q, setQ] = useState("");

  const [programs, setPrograms] = useState([]);
  const [programPage, setProgramPage] = useState(1);
  const [hasMorePrograms, setHasMorePrograms] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [tabCache, setTabCache] = useState({});

  const nav = useNavigate();

  const loadDropdown = async () => {
    try {
      const token = cookies.load("token");
      if (!token) return;
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const [resFaculties, resSubjects] = await Promise.all([
        authApis().get(`${endpoints["faculties"]}?page=${facultyPage}`),
        authApis().get(`${endpoints["subjects"]}?page=${subjectPage}`),
      ]);
      if (resFaculties.status === 200) {
        setHasNextFaculties(resFaculties.data.next != null);
        if (facultyPage === 1) {
          setFaculties(resFaculties.data.results);
        } else {
          setFaculties([...faculties, ...resFaculties.data.results]);
        }
      }
      if (resSubjects.status === 200) {
        setHasNextSubjects(resSubjects.data.next != null);
        if (subjectPage === 1) {
          setSubjects(resSubjects.data.results);
        } else {
          setSubjects([...subjects, ...resSubjects.data.results]);
        }
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải danh sách dropdown");
    } finally {
      setLoading(false);
    }
  };

  const loadSyllabuses = async (tabId, pageToLoad = 1) => {
    setTabCache((prev) => ({
      ...prev,
      [tabId]: {...prev[tabId], loading: true},
    }));

    try {
      setLoading(true);
      let url = `${endpoints["syllabuses-programs"](tabId)}?page=${pageToLoad}`;

      if (q) {
        url += `&q=${q}`;
      }
      if (facultyId) {
        url += `&faculty=${facultyId}`;
      }
      if (subjectId) {
        url += `&subject=${subjectId}`;
      }
      const res = await authApis().get(url);
      if (res.status === 200) {
        const newData = res.data.results || res.data || [];
        const hasNext = res.data.next != null;
        const total = res.data.count || newData.length;
        setTabCache((prev) => ({
          ...prev,
          [tabId]: {
            items: newData,
            total: total,
            page: pageToLoad,
            hasNext: hasNext,
            loading: false,
          },
        }));
      } else {
        message.error("Tải danh sách đề cương môn học thất bại");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (page) => {
    try {
      const res = await authApis().get(
        `${endpoints["training-programs"]}?page=${page}`,
      );

      const newPrograms = res.data.results;
      setHasMorePrograms(res.data.next != null);
      setProgramPage(page);
      if (page === 1) {
        setPrograms(newPrograms);
        if (newPrograms.length > 0) {
          const firstTabId = newPrograms[0].id.toString();
          setActiveTab(firstTabId);
          loadSyllabuses(firstTabId, 1);
        }
      } else {
        setPrograms((prev) => [...prev, ...newPrograms]);
      }
    } catch (error) {
      console.error("Lỗi tải chương trình", error);
    }
  };

  useEffect(() => {
    loadPrograms(1);
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (!tabCache[key]) {
      loadSyllabuses(key, 1);
    }
  };

  const handleExportDocx = async (itemOrId) => {
    const syllabusId = typeof itemOrId === "object" ? itemOrId.id : itemOrId;
    const isApproved = typeof itemOrId === "object"
      ? Boolean((itemOrId.is_approved || itemOrId.status === "Approved") && itemOrId.approved_by)
      : true;

    if (typeof itemOrId === "object" && !isApproved) {
      message.warning(
        "Đề cương chưa được Lãnh đạo Khoa phê duyệt. Không thể xuất file chính thức.",
      );
      return;
    }

    try {
      setExportingId(syllabusId);
      message.loading({
        content: "Đang tạo file Word...",
        key: `export_${syllabusId}`,
      });

      const url = endpoints["export-docx"](syllabusId);
      const res = await authApis().get(url, {responseType: "blob"});

      const fileData = res.data ? res.data : res;
      if (!fileData) {
        throw new Error("Không nhận được dữ liệu file từ Server");
      }

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
        content: "Đã tải file thành công!",
        key: `export_${syllabusId}`,
      });
    } catch (error) {
      console.error(error);
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          message.warning({
            content: text || "Đề cương chưa được Lãnh đạo Khoa phê duyệt.",
            key: `export_${syllabusId}`,
          });
          return;
        } catch {
          // fallback
        }
      }
      message.error({
        content: "Lỗi khi xuất file docx",
        key: `export_${syllabusId}`,
      });
    } finally {
      setExportingId(null);
    }
  };

  const isFacultyLeader = Boolean(
    user?.lecturer?.is_leader ||
    user?.is_superuser ||
    user?.user_role === "admin",
  );

  const handleQuickApprove = (item) => {
    setQuickApproveModal({open: true, item, loading: false});
  };

  const handleConfirmQuickApprove = async () => {
    const item = quickApproveModal.item;
    if (!item) return;
    try {
      setQuickApproveModal((prev) => ({...prev, loading: true}));
      await SignatureService.approveSyllabus(item.id);
      message.success(`Đã phê duyệt thành công đề cương "${item.name}"!`);
      setQuickApproveModal({open: false, item: null, loading: false});
      if (activeTab) {
        loadSyllabuses(activeTab, 1);
      }
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.error || "Lỗi khi phê duyệt đề cương!",
      );
      setQuickApproveModal((prev) => ({...prev, loading: false}));
    }
  };

  useEffect(() => {
    if (!user) {
      nav("/login");
    }
  }, [user]);

  useEffect(() => {
    let timer = setTimeout(() => {
      if (activeTab) {
        setTabCache({});
        loadSyllabuses(activeTab, 1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [q, facultyId, subjectId]);

  useEffect(() => {
    loadDropdown();
  }, [facultyPage, subjectPage]);

  const canApproveItem = (item) => {
    if (!isFacultyLeader) return false;
    if (item.status !== "Submitted" || item.is_approved) return false;
    const isSelfAuthored = Boolean(
      (item.lecturer_id &&
        (item.lecturer_id === user?.lecturer?.id ||
          item.lecturer_id === user?.id)) ||
      (item.lecturer?.id && item.lecturer.id === user?.lecturer?.id) ||
      (item.lecturer?.user?.id && item.lecturer.user.id === user?.id),
    );
    const isAdmin = user?.is_superuser || user?.user_role === "admin";
    if (isSelfAuthored && !isAdmin) return false;
    return true;
  };

  const columns = [
    {
      title: "Mã môn",
      key: "subject_code",
      width: 110,
      render: (_, record) => {
        const code = record.subject_code || record.subject?.code;
        return (
          <div style={{minWidth: 80, whiteSpace: "nowrap"}}>
            <Tag color="blue" style={{fontWeight: 600}}>
              {code || "N/A"}
            </Tag>
          </div>
        );
      },
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
              cursor: "pointer",
              wordBreak: "normal",
              overflowWrap: "break-word",
            }}
            onClick={() => nav(`/syllabuses/${record.id}`)}
          >
            {record.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 2,
              wordBreak: "normal",
              overflowWrap: "break-word",
            }}
          >
            Học phần: {record.subject_name || record.subject?.name || "N/A"}
          </div>
          {record.training_programs && record.training_programs.length > 0 && (
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
          )}
        </div>
      ),
    },
    {
      title: "Giảng viên biên soạn",
      key: "lecturer",
      width: 200,
      render: (_, record) => {
        const lecName =
          record.lecturer_name ||
          (record.lecturer?.last_name
            ? `${record.lecturer.last_name} ${record.lecturer.first_name}`.trim()
            : "N/A");
        return (
          <div style={{minWidth: 150, wordBreak: "normal"}}>
            <div style={{fontWeight: 500, color: "#374151"}}>{lecName}</div>
            {record.created_date && (
              <div style={{fontSize: 11, color: "#9ca3af", marginTop: 2}}>
                Tạo: {new Date(record.created_date).toLocaleDateString("vi-VN")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, record) => {
        const isApproved = Boolean(
          record.is_approved || record.status === "Approved",
        );
        if (isApproved) {
          return (
            <Tooltip
              title={
                record.approved_by_name
                  ? `Được duyệt bởi ${record.approved_by_name}${record.approved_date ? ` lúc ${record.approved_date}` : ""}`
                  : "Đề cương đã được phê duyệt"
              }
            >
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Đã phê duyệt
              </Tag>
            </Tooltip>
          );
        }
        if (record.status === "Submitted") {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
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
        const isApproved = Boolean(
          record.is_approved || record.status === "Approved",
        );
        if (!isApproved) {
          return (
            <span style={{color: "#9ca3af", fontStyle: "italic"}}>
              Chưa phê duyệt
            </span>
          );
        }
        return (
          <div>
            <div style={{fontWeight: 600, color: "#16a34a"}}>
              {record.approved_by_name || "Lãnh đạo Khoa"}
            </div>
            {record.approved_date && (
              <div style={{fontSize: 11, color: "#6b7280"}}>
                {record.approved_date}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, item) => {
        const canApprove = canApproveItem(item);
        const isApproved = Boolean(
          item.status === "Approved" || item.is_approved,
        );
        return (
          <Space size="small" wrap={false} style={{whiteSpace: "nowrap"}}>
            <Tooltip title="Chỉnh sửa đề cương">
              <Button
                size="small"
                icon={<EditOutlined />}
                type="primary"
                ghost
                onClick={() => nav(`/syllabuses/${item.id}`)}
              >
                Chỉnh sửa
              </Button>
            </Tooltip>
            {canApprove && (
              <Tooltip title="Phê duyệt đề cương">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{backgroundColor: "#16a34a", borderColor: "#16a34a"}}
                  onClick={() => handleQuickApprove(item)}
                >
                  Phê duyệt
                </Button>
              </Tooltip>
            )}
            <Tooltip
              title={
                isApproved
                  ? "Tải xuống file Word"
                  : "Đề cương chưa được phê duyệt"
              }
            >
              <Button
                size="small"
                icon={<DownloadOutlined />}
                loading={exportingId === item.id}
                style={{color: "#52c41a", borderColor: "#52c41a"}}
                onClick={() => handleExportDocx(item)}
              >
                Xuất file
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{maxWidth: 1200, margin: "40px auto", padding: "0 20px"}}>
      <Space direction="vertical" size="large" style={{width: "100%"}}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{flex: "1 1 250px", minWidth: 200}}>
            <CleanInput
              placeholder="Tìm kiếm đề cương..."
              prefix={<SearchOutlined />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{width: "100%", borderRadius: 20}}
              allowClear
            />
          </div>
          <Select
            loading={loading}
            placeholder="Chọn Khoa"
            style={{flex: "1 1 180px", minWidth: 150}}
            allowClear
            onChange={setFacultyId}
            onPopupScroll={(e) => {
              const {target} = e;
              if (
                target.scrollTop + target.offsetHeight ===
                  target.scrollHeight &&
                hasNextFaculties
              ) {
                setFacultyPage((prev) => prev + 1);
              }
            }}
          >
            {faculties.map((f) => (
              <Select.Option key={f.id} value={f.id}>
                {f.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            loading={loading}
            placeholder="Chọn môn học"
            style={{flex: "1 1 180px", minWidth: 150}}
            allowClear
            onChange={setSubjectId}
            onPopupScroll={(e) => {
              const {target} = e;
              if (
                target.scrollTop + target.offsetHeight ===
                  target.scrollHeight &&
                hasNextSubjects
              ) {
                setSubjectPage((prev) => prev + 1);
              }
            }}
          >
            {subjects.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Lọc trạng thái"
            style={{flex: "1 1 160px", minWidth: 140}}
            allowClear
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || "all")}
          >
            <Select.Option value="all">Tất cả trạng thái</Select.Option>
            <Select.Option value="Approved">Đã phê duyệt</Select.Option>
            <Select.Option value="Submitted">Chờ phê duyệt</Select.Option>
            <Select.Option value="Draft">Bản nháp</Select.Option>
          </Select>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          tabBarExtraContent={
            hasMorePrograms && (
              <Button type="link" onClick={() => loadPrograms(programPage + 1)}>
                Tải thêm nhóm &rarr;
              </Button>
            )
          }
          items={programs.map((prog) => {
            const currentCache = tabCache[prog.id] || {};
            const items = currentCache.items || [];
            const isLoading = currentCache.loading;
            const isFirstLoad = isLoading && currentCache.page === 1;

            const displayItems = items.filter((item) => {
              if (!statusFilter || statusFilter === "all") return true;
              if (statusFilter === "Approved")
                return item.status === "Approved" || item.is_approved;
              if (statusFilter === "Submitted")
                return item.status === "Submitted" && !item.is_approved;
              if (statusFilter === "Draft")
                return (
                  (!item.status || item.status === "Draft") && !item.is_approved
                );
              return true;
            });

            return {
              label: prog.name + "-" + prog.academic_year,
              key: prog.id.toString(),
              children: (
                <div style={{minHeight: 300, marginTop: 16}}>
                  {isFirstLoad ? (
                    <MySpinner />
                  ) : (
                    <Table
                      rowKey="id"
                      loading={isLoading}
                      dataSource={displayItems}
                      columns={columns}
                      pagination={{
                        current: currentCache.page || 1,
                        pageSize: 10,
                        total: currentCache.total || displayItems.length,
                        showTotal: (total) => `Tổng cộng ${total} đề cương`,
                        showSizeChanger: false,
                        onChange: (newPage) => loadSyllabuses(prog.id, newPage),
                      }}
                      scroll={{x: 1240}}
                    />
                  )}
                </div>
              ),
            };
          })}
        />

        <Modal
          title={<span>🛡️ Xác nhận Phê duyệt nhanh đề cương</span>}
          open={quickApproveModal.open}
          onCancel={() =>
            setQuickApproveModal({open: false, item: null, loading: false})
          }
          onOk={handleConfirmQuickApprove}
          confirmLoading={quickApproveModal.loading}
          okText="Xác nhận duyệt"
          cancelText="Đóng"
        >
          <div style={{lineHeight: 1.8}}>
            <p style={{margin: "0 0 8px 0"}}>
              Bạn có chắc muốn phê duyệt đề cương:{" "}
              <strong>{quickApproveModal.item?.name}</strong>?
            </p>
            <p style={{margin: "0 0 12px 0", color: "#6b7280", fontSize: 13}}>
              Giảng viên biên soạn:{" "}
              <strong>{quickApproveModal.item?.lecturer_name}</strong> | Môn:{" "}
              <strong>{quickApproveModal.item?.subject_name}</strong>
            </p>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: 12,
                borderRadius: 8,
                fontSize: 13,
                color: "#166534",
              }}
            >
              Chữ ký cá nhân trong hồ sơ của bạn ({user?.last_name}{" "}
              {user?.first_name}) sẽ được tự động đóng dấu vào bảng chữ ký ở
              chân trang khi xuất file Word.
            </div>
          </div>
        </Modal>
      </Space>
    </div>
  );
};

export default Home;
