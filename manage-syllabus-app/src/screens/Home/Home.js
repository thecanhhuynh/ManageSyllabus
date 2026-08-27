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
  Divider,
  Tabs, // <-- Thêm import Divider từ antd
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
} from "@ant-design/icons";
import MySpinner from "../../components/MySpinner";
import {useNavigate} from "react-router-dom";
import cookies from "react-cookies";
import {MyUserContext} from "../../config/contexts/MyContext";

const Home = () => {
  const [user] = useContext(MyUserContext);
  const [loading, setLoading] = useState(false);
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

  const loadPrograms = async (programPage) => {
    try {
      const res = await authApis().get(
        `${endpoints["training-programs"]}?page=${programPage}`,
      );

      const newPrograms = res.data.results;
      setHasMorePrograms(res.data.next != null);
      setProgramPage(programPage);
      if (programPage === 1) {
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

  const handleExportDocx = async (syllabusId) => {
    try {
      let url = endpoints["export-docx"](syllabusId);

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

      message.success({content: "Đã tải file thành công!", key: "export"});
    } catch (error) {
      console.error(error);
      message.error({content: "Lỗi khi xuất file docx", key: "export"});
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

            return {
              label: prog.name + "-" + prog.academic_year,
              key: prog.id.toString(),
              children: (
                <div style={{minHeight: 300, marginTop: 16}}>
                  {isFirstLoad ? (
                    <MySpinner />
                  ) : (
                    <>
                      {items.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#8c8c8c",
                            marginTop: 40,
                          }}
                        >
                          Không có đề cương nào trong chương trình này.
                        </div>
                      ) : (
                        <List
                          grid={{
                            gutter: 24,
                            xs: 1,
                            sm: 2,
                            md: 2,
                            lg: 3,
                            xl: 3,
                            xxl: 4,
                          }}
                          dataSource={items}
                          renderItem={(item) => (
                            <List.Item>
                              <Card
                                hoverable
                                style={{
                                  borderRadius: 12,
                                  overflow: "hidden",
                                  border: "1px solid #e8e8e8",
                                }}
                                title={
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 16,
                                      color: "#00529C",
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <Tooltip title={item.name}>
                                      {item.name}
                                    </Tooltip>
                                  </Text>
                                }
                                actions={[
                                  <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    style={{color: "#1890ff"}}
                                    onClick={() =>
                                      nav(`/syllabuses/${item.id}`)
                                    }
                                  >
                                    Chỉnh sửa
                                  </Button>,
                                  <Tooltip title="Tải xuống file Word">
                                    <Button
                                      type="text"
                                      icon={<DownloadOutlined />}
                                      style={{color: "#52c41a"}}
                                      onClick={() => handleExportDocx(item.id)}
                                    >
                                      Xuất file
                                    </Button>
                                  </Tooltip>,
                                ]}
                              >
                                <Space
                                  orientation="vertical"
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
                                      style={{color: "#8c8c8c", marginTop: 4}}
                                    />
                                    <Text type="secondary">
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
                                    <UserOutlined style={{color: "#8c8c8c"}} />
                                    <Text strong>
                                      Giảng viên: {item.lecturer_name}
                                    </Text>
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}
                                  >
                                    <CalendarOutlined
                                      style={{color: "#8c8c8c"}}
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

                                  {item.edit_date && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#fa8c16",
                                        fontStyle: "italic",
                                        marginTop: -8,
                                      }}
                                    >
                                      * {item.edit_date}
                                    </div>
                                  )}
                                </Space>
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
      </Space>
    </div>
  );
};

export default Home;
