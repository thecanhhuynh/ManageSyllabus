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
} from "@ant-design/icons";
import MySpinner from "../../components/MySpinner";
import {useNavigate} from "react-router-dom";
import cookies from "react-cookies";
import {MyUserContext} from "../../config/contexts/MyContext";
const Home = () => {
  const [user] = useContext(MyUserContext);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [syllabuses, setSyllabuses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultyId, setFacultyId] = useState(null);
  const [facultyPage, setFacultyPage] = useState(1);
  const [hasNextFaculties, setHasNextFaculties] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(null);
  const [subjectPage, setSubjectPage] = useState(1);
  const [hasNextSubjects, setHasNextSubjects] = useState(false);
  const [q, setQ] = useState("");
  const [hasNext, setHasNext] = useState(false);

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

  const loadSyllabuses = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      let url = `${endpoints["syllabuses"]}?page=${page}`;

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
        setHasNext(res.data.next != null);
        if (page === 1) {
          setSyllabuses(newData);
        } else {
          setSyllabuses([...syllabuses, ...newData]);
        }
      } else {
        message.error("Tải danh sách đề cương môn học thất bại");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!user) {
      nav("/login");
    }
  }, [user]);

  useEffect(() => {
    let timer = setTimeout(() => {
      loadSyllabuses();
    }, 500);

    return () => clearTimeout(timer);
  }, [q, page, facultyId, subjectId]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    loadDropdown();
  }, [facultyPage, subjectPage]);

  const loadMore = async () => {
    setPage(page + 1);
  };

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
            placeholder="Chọn Khoa"
            style={{width: 200}}
            allowClear
            onChange={(val) => setFacultyId(val)}
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
            placeholder="Chọn môn học"
            style={{width: 200}}
            allowClear
            onChange={(val) => setSubjectId(val)}
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
        {loading && syllabuses.length === 0 ? (
          <MySpinner />
        ) : (
          <List
            grid={{gutter: 24, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4}}
            dataSource={syllabuses}
            loading={loading && page === 1}
            renderItem={(item) => (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #e8e8e8",
                  }}
                  header={{
                    backgroundColor: "#fafafa",
                    borderBottom: "1px solid #f0f0f0",
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
                      <Tooltip title={item.name}>{item.name}</Tooltip>
                    </Text>
                  }
                  extra={
                    <Tag
                      color={item.status === "Active" ? "green" : "volcano"}
                      style={{margin: 0}}
                    >
                      {item.status.toUpperCase()}
                    </Tag>
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      style={{color: "#1890ff"}}
                      onClick={() => nav(`/syllabuses/${item.id}`)}
                    >
                      Chỉnh sửa
                    </Button>,
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
                      <BookOutlined style={{color: "#8c8c8c", marginTop: 4}} />
                      <Text type="secondary">{item.subject?.name}</Text>
                    </div>
                    <div
                      style={{display: "flex", alignItems: "center", gap: 8}}
                    >
                      <UserOutlined style={{color: "#8c8c8c"}} />
                      <Text strong>
                        Giảng viên
                        {` ${item.lecturer?.first_name} ${item.lecturer?.last_name}`}
                      </Text>
                    </div>
                    <div
                      style={{display: "flex", alignItems: "center", gap: 8}}
                    >
                      <CalendarOutlined style={{color: "#8c8c8c"}} />
                      <Text type="secondary" style={{fontSize: 13}}>
                        {new Date(item.created_date).toLocaleDateString(
                          "vi-VN",
                        )}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}

        {hasNext && (
          <div style={{textAlign: "center", marginTop: 20}}>
            {loading && page > 1 ? (
              <MySpinner />
            ) : (
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={loadMore}
                style={{backgroundColor: "#00529C", padding: "0 40px"}}
              >
                Tải thêm dữ liệu
              </Button>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default Home;
