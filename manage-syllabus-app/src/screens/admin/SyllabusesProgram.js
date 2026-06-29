import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import {Button, Card, Empty} from "antd";
import MySpinner from "../../components/MySpinner";
import {
  ArrowLeftOutlined,
  BookOutlined,
  UserOutlined,
  FileTextOutlined,
  RightOutlined,
  CalendarOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Title from "antd/es/skeleton/Title";
import Text from "antd/es/typography/Text";
const SyllabusesProgram = () => {
  const params = useParams();
  const nav = useNavigate();
  const programId = params.programId;
  const [loading, setLoading] = useState(false);
  const [syllabuses, setSyllabuses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const loadSyllabuses = async () => {
    try {
      setLoading(true);
      let url = `${endpoints["syllabuses-programs"](programId)}?page=${page}`;
      const res = await authApis().get(url);
      console.log(res);
      if (res.status === 200) {
        if (page === 1) setSyllabuses(res.data.results);
        else setSyllabuses([...syllabuses, ...res.data.results]);
        setHasNext(res.data.next !== null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer = setTimeout(() => {
      loadSyllabuses();
    }, 500);

    return () => clearTimeout(timer);
  }, [page]);

  const loadMore = async () => {
    setPage(page + 1);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined className="text-xl" />}
            onClick={() => nav(-1)}
            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center w-10 h-10 rounded-full"
          />
          <div>
            <Title level={3} className="!m-0 text-gray-800">
              Danh sách Đề cương
            </Title>
            <Text className="text-gray-500">
              Chương trình đào tạo #{programId}
            </Text>
          </div>
        </div>

        {syllabuses.length === 0 && !loading ? (
          <div className="bg-white p-10 rounded-xl shadow-sm">
            <Empty description="Không có đề cương nào trong chương trình này" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabuses.map((item) => (
              <Card
                key={item.id}
                hoverable
                className="rounded-xl overflow-hidden shadow-sm border border-gray-200"
                bodyStyle={{padding: 0}} // Xóa padding mặc định của Ant Design
                onClick={() => nav(`/syllabuses/${item.id}`)}
              >
                {/* 1. Phần Header: Tên và Trạng thái */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-start gap-4">
                  <h3 className="text-[#0052cc] font-semibold text-base m-0 leading-snug flex-1">
                    {item.name}
                  </h3>
                  <span className="bg-green-50 text-green-600 text-[11px] font-bold px-2 py-1 rounded tracking-wide uppercase">
                    {item.status || "ACTIVE"}
                  </span>
                </div>

                {/* 2. Phần Body: Chi tiết môn học, giảng viên, thời gian */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    <BookOutlined className="text-lg" />
                    <span className="text-sm">{item.subject_name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-800">
                    <UserOutlined className="text-lg text-gray-400" />
                    <span className="text-sm font-medium">
                      Giảng viên {item.lecturer_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500">
                    <CalendarOutlined className="text-lg" />
                    {/* Tạm thời hiển thị fix cứng nếu Backend chưa trả về ngày */}
                    <span className="text-sm">
                      {item.created_date || "10/5/2026"}
                    </span>
                  </div>
                </div>

                {/* 3. Phần Footer: Nút hành động */}
                <div className="border-t border-gray-100 p-3 flex justify-center items-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-2 font-medium">
                    <EyeOutlined />
                    <span>Xem chi tiết</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          {loading && <MySpinner />}
          {!loading && hasNext && (
            <Button
              type="default"
              size="large"
              onClick={() => setPage(page + 1)}
              className="rounded-full px-8 font-medium text-blue-600 border-blue-200 hover:border-blue-400 hover:text-blue-700"
            >
              Tải thêm đề cương
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyllabusesProgram;
