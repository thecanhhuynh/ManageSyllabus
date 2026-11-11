import {
  Button,
  Card,
  Input,
  List,
  message,
  Select,
  Space,
  Tag,
  Tooltip,
  Tabs,
  Modal,
} from "antd";
import {useContext, useEffect, useState} from "react";
import {authApis, endpoints} from "../../config/Apis";
import Text from "antd/es/typography/Text";
import {
  SearchOutlined,
  EditOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import MySpinner from "../../components/MySpinner";
import {useNavigate} from "react-router-dom";
import cookies from "react-cookies";
import {MyUserContext} from "../../config/contexts/MyContext";
import SignatureService from "../../services/signatureService";

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
      await new Promise((resolve) => setTimeout(resolve, 500));
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
        const newData = res.data.results;
        const hasNext = res.data.next != null;
        setTabCache((prev) => {
          const existingItems = prev[tabId]?.items || [];
          return {
            ...prev,
            [tabId]: {
              items:
                pageToLoad === 1 ? newData : [...existingItems, ...newData],
              page: pageToLoad,
              hasNext: hasNext,
              loading: false,
            },
          };
        });
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

  return (
    <div style={{maxWidth: 1200, margin: "40px auto", padding: "0 20px"}}>
      <Space direction="vertical" size="large" style={{width: "100%"}}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Input
            placeholder="Tìm kiếm đề cương..."
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{width: 300, borderRadius: 20}}
            allowClear
          />
          <Select
            loading={loading}
            placeholder="Chọn Khoa"
            style={{width: 200}}
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
            style={{width: 200}}
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
            style={{width: 170}}
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
                    <>
                      {displayItems.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#8c8c8c",
                            marginTop: 40,
                          }}
                        >
                          Không có đề cương nào phù hợp.
                        </div>
                      ) : (
                        <List
                          className="syllabus-card-grid"
                          grid={{
                            gutter: [24, 24],
                            xs: 1,
                            sm: 2,
                            md: 2,
                            lg: 3,
                            xl: 3,
                            xxl: 4,
                          }}
                          dataSource={displayItems}
                          renderItem={(item) => (
                            <List.Item
                              style={{
                                height: "100%",
                                marginBottom: 0,
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <Card
                                hoverable
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  borderRadius: 12,
                                  overflow: "hidden",
                                  border: "1px solid #e8e8e8",
                                }}
                                headStyle={{
                                  height: 80,
                                  minHeight: 80,
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0 16px",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                                bodyStyle={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  padding: "16px 20px",
                                }}
                                extra={
                                  (item.status === "Approved" || item.is_approved) && item.approved_by ? (
                                    <Tooltip
                                      title={
                                        item.approved_by_name
                                          ? `Được phê duyệt bởi ${item.approved_by_name}${item.approved_date ? ` lúc ${item.approved_date}` : ""}`
                                          : "Đề cương đã được Lãnh đạo Khoa phê duyệt"
                                      }
                                    >
                                      <Tag
                                        color="success"
                                        icon={<CheckCircleOutlined />}
                                        style={{ margin: 0, flexShrink: 0 }}
                                      >
                                        Đã phê duyệt
                                      </Tag>
                                    </Tooltip>
                                  ) : (
                                    <Tag
                                      color="warning"
                                      icon={<ClockCircleOutlined />}
                                      style={{ margin: 0, flexShrink: 0 }}
                                    >
                                      {item.status === "Submitted"
                                        ? "Chờ phê duyệt"
                                        : "Bản nháp"}
                                    </Tag>
                                  )
                                }
                                title={
                                  <div style={{ paddingRight: 8 }}>
                                    <Tooltip title={item.name} placement="topLeft">
                                      <Text
                                        strong
                                        style={{
                                          fontSize: 15,
                                          color: "#00529C",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          lineHeight: 1.35,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {item.name}
                                      </Text>
                                    </Tooltip>
                                  </div>
                                }
                                actions={[
                                  <Tooltip title="Chỉnh sửa đề cương">
                                    <Button
                                      type="text"
                                      icon={<EditOutlined />}
                                      style={{color: "#1890ff"}}
                                      onClick={() =>
                                        nav(`/syllabuses/${item.id}`)
                                      }
                                    >
                                      Chỉnh sửa
                                    </Button>
                                  </Tooltip>,
                                  ...(isFacultyLeader &&
                                  !((item.status === "Approved" || item.is_approved) && item.approved_by)
                                    ? [
                                        <Tooltip title="Phê duyệt đề cương">
                                          <Button
                                            type="text"
                                            icon={<CheckCircleOutlined />}
                                            style={{
                                              color: "#16a34a",
                                              fontWeight: 600,
                                            }}
                                            onClick={() =>
                                              handleQuickApprove(item)
                                            }
                                          >
                                            Phê duyệt
                                          </Button>
                                        </Tooltip>,
                                      ]
                                    : []),
                                  <Tooltip
                                    title={
                                      item.status === "Approved" ||
                                      item.is_approved
                                        ? "Tải xuống file Word"
                                        : "Đề cương chưa được phê duyệt"
                                    }
                                  >
                                    <Button
                                      type="text"
                                      icon={<DownloadOutlined />}
                                      loading={exportingId === item.id}
                                      style={{color: "#52c41a"}}
                                      onClick={() => handleExportDocx(item)}
                                    >
                                      Xuất file
                                    </Button>
                                  </Tooltip>,
                                ]}
                              >
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                  <Space
                                    direction="vertical"
                                    size="middle"
                                    style={{width: "100%"}}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 8,
                                      }}
                                    >
                                      <BookOutlined
                                        style={{color: "#8c8c8c", marginTop: 4, flexShrink: 0}}
                                      />
                                      <Text
                                        type="secondary"
                                        ellipsis={{ tooltip: item.subject_name }}
                                      >
                                        {item.subject_name}
                                      </Text>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <UserOutlined style={{color: "#8c8c8c", flexShrink: 0}} />
                                      <Text
                                        strong
                                        ellipsis={{ tooltip: item.lecturer_name }}
                                      >
                                        Giảng viên: {item.lecturer_name}
                                      </Text>
                                    </div>

                                    {Boolean(
                                      (item.status === "Approved" ||
                                        item.is_approved) &&
                                        item.approved_by &&
                                        item.approved_by_name,
                                    ) ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          fontSize: 13,
                                          color: "#16a34a",
                                          minHeight: 22,
                                        }}
                                      >
                                        <CheckCircleOutlined
                                          style={{color: "#16a34a", flexShrink: 0}}
                                        />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          Phê duyệt bởi:{" "}
                                          <strong>{item.approved_by_name}</strong>
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 8,
                                          fontSize: 13,
                                          color: "#8c8c8c",
                                          minHeight: 22,
                                        }}
                                      >
                                        <ClockCircleOutlined
                                          style={{color: "#8c8c8c", flexShrink: 0}}
                                        />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                          Phê duyệt bởi:{" "}
                                          <span style={{ fontStyle: "italic", color: "#8c8c8c" }}>
                                            Chưa phê duyệt
                                          </span>
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <CalendarOutlined
                                        style={{color: "#8c8c8c", flexShrink: 0}}
                                      />
                                      <Text
                                        type="secondary"
                                        style={{fontSize: 13}}
                                      >
                                        Ngày tạo:{" "}
                                        {item.created_date
                                          ? new Date(
                                              item.created_date,
                                            ).toLocaleDateString("vi-VN")
                                          : "N/A"}
                                      </Text>
                                    </div>
                                  </Space>

                                  <div style={{ minHeight: 20, marginTop: 12 }}>
                                    {item.edit_date && (
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#fa8c16",
                                          fontStyle: "italic",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                        title={item.edit_date}
                                      >
                                        * {item.edit_date}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            </List.Item>
                          )}
                        />
                      )}

                      {currentCache.hasNext && (
                        <div style={{textAlign: "center", marginTop: 20}}>
                          <Button
                            type="primary"
                            shape="round"
                            size="large"
                            loading={isLoading}
                            onClick={() =>
                              loadSyllabuses(prog.id, currentCache.page + 1)
                            }
                            style={{
                              backgroundColor: "#00529C",
                              padding: "0 40px",
                            }}
                          >
                            Tải thêm đề cương
                          </Button>
                        </div>
                      )}
                    </>
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
