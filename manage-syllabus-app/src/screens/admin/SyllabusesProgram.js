import React, {useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {authApis, endpoints} from "../../config/Apis";
import {
  Button,
  Table,
  message,
  DatePicker,
  Tag,
  Typography,
  Input,
  Modal,
  Space,
  Checkbox,
  Form,
  Select,
} from "antd";
import {ArrowLeftOutlined, PlusOutlined, SaveOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import {Option} from "antd/es/mentions";

const {RangePicker} = DatePicker;
const {Title} = Typography;

const SyllabusesProgram = () => {
  const params = useParams();
  const nav = useNavigate();
  const programId = params.programId;

  const [loading, setLoading] = useState(false);
  const [syllabuses, setSyllabuses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [q, setQ] = useState("");
  const [editingData, setEditingData] = useState({});

  const [lecturers, setLecturers] = useState([]);
  const [lecturerPage, setLecturerPage] = useState(1);
  const [lecturerQ, setLecturerQ] = useState("");
  const [hasNextLecturer, setHasNextLecturer] = useState(false);
  const lecturerSearchTimeoutRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSyllabusId, setActiveSyllabusId] = useState(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDates, setBulkDates] = useState(null);
  const [overwrite, setOverwrite] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [faculties, setFaculties] = useState([]);

  const loadReferenceData = async () => {
    try {
      const [subRes, tplRes, facRes] = await Promise.all([
        authApis().get(endpoints["subjects"]),
        authApis().get(endpoints["templates"]),
        authApis().get(endpoints["faculties"]),
      ]);
      setSubjects(subRes.data.results || subRes.data);
      setTemplates(tplRes.data.results || tplRes.data);
      setFaculties(facRes.data.results || facRes.data);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu tham chiếu (Môn học, Mẫu, Khoa)");
    }
  };

  const loadLecturers = async () => {
    try {
      setLoading(true);
      let url = `${endpoints["lecturers"]}?page=${lecturerPage}`;
      if (lecturerQ) url += `&q=${lecturerQ}`;
      const res = await authApis().get(url);
      if (res.status === 200) {
        if (lecturerPage === 1) setLecturers(res.data.results);
        else setLecturers([...lecturers, ...res.data.results]);
        setHasNextLecturer(res.data.next !== null);
      }
    } catch (error) {
      message.error("Tải danh sách giảng viên thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyllabuses = async () => {
    try {
      setLoading(true);
      let url = `${endpoints["syllabuses-programs"](programId)}?page=${page}`;
      if (q) url += `&q=${q}`;

      const res = await authApis().get(url);
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
      loadLecturers();
    }, 500);
    return () => clearTimeout(timer);
  }, [lecturerPage, lecturerQ]);

  useEffect(() => {
    let timer = setTimeout(() => {
      loadSyllabuses();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  useEffect(() => {
    setLecturerPage(1);
  }, [lecturerQ]);

  const loadMore = async () => {
    setPage(page + 1);
  };

  const handleFieldChange = (id, field, value) => {
    setEditingData((prev) => ({
      ...prev,
      [id]: {...prev[id], [field]: value},
    }));
  };

  const handleSelectLecturer = (lecturer) => {
    handleFieldChange(activeSyllabusId, "lecturer_id", lecturer.id);
    handleFieldChange(
      activeSyllabusId,
      "lecturer_name_temp",
      `${lecturer.last_name} ${lecturer.first_name}`,
    );
    setIsModalOpen(false);
  };

  const handleSave = async (record) => {
    const changes = editingData[record.id];
    if (!changes) return message.info("Không có thay đổi nào để lưu");

    try {
      const payload = {};
      if (changes.lecturer_id) payload.lecturer_id = changes.lecturer_id;
      if (changes.dates && changes.dates.length === 2) {
        payload.start_date_edition = changes.dates[0].format(
          "YYYY-MM-DDTHH:mm:ss",
        );
        payload.end_date_edition = changes.dates[1].format(
          "YYYY-MM-DDTHH:mm:ss",
        );
      }

      await authApis().patch(
        `${endpoints["syllabuses"]}${record.id}/`,
        payload,
      );
      message.success(`Đã lưu phân công cho: ${record.name}`);

      const newEditingData = {...editingData};
      delete newEditingData[record.id];
      setEditingData(newEditingData);

      setPage(1);
      if (page === 1) loadSyllabuses();
    } catch (error) {
      message.error("Lỗi khi lưu phân công");
    }
  };

  const openCreateModal = () => {
    loadReferenceData();
    setIsCreateModalOpen(true);
  };

  const handleCreateSyllabus = async (values) => {
    setCreating(true);
    try {
      const payload = {
        name: values.name,
        subject_obj: values.subject_obj,
        template_obj: values.template_obj,
        faculty_obj: values.faculty_obj,
        lecturer_obj: values.lecturer_obj,
        training_program_obj: parseInt(programId),
      };

      await authApis().post(endpoints["syllabuses"], payload);
      message.success("Tạo đề cương mới thành công!");

      setIsCreateModalOpen(false);
      form.resetFields();

      setPage(1);
      if (page === 1) loadSyllabuses();
    } catch (error) {
      message.error(error.response?.data?.err_msg || "Lỗi khi tạo đề cương");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const lecturerColumns = [
    {title: "ID", dataIndex: "id", width: 60},
    {
      title: "Giảng viên",
      render: (_, record) => (
        <span className="font-medium">{`${record.last_name} ${record.first_name}`}</span>
      ),
    },
    {title: "Khoa", dataIndex: "faculty_name"},
    {title: "Phòng", dataIndex: "room"},
    {
      title: "Thao tác",
      width: 90,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          ghost
          onClick={() => handleSelectLecturer(record)}
        >
          Chọn
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleApplyBulkDeadline = async () => {
    if (!bulkDates || bulkDates.length < 2)
      return message.warning("Vui lòng chọn ngày");

    let finalIds = selectedRowKeys;
    if (!overwrite) {
      finalIds = selectedRowKeys.filter((id) => {
        const row = syllabuses.find((s) => s.id === id);
        return !row.edit_date;
      });
    }

    if (finalIds.length === 0) {
      message.info("Không có đề cương nào thỏa mãn điều kiện để cập nhật.");
      setIsBulkModalOpen(false);
      return;
    }

    try {
      const payload = {
        ids: finalIds,
        start_date: bulkDates[0].format("YYYY-MM-DDTHH:mm:ss"),
        end_date: bulkDates[1].format("YYYY-MM-DDTHH:mm:ss"),
      };

      await authApis().patch(
        `${endpoints["syllabuses"]}bulk-update-deadlines/`,
        payload,
      );
      message.success(`Đã cập nhật deadline cho ${finalIds.length} đề cương.`);

      await loadSyllabuses();
      setIsBulkModalOpen(false);
      setSelectedRowKeys([]);
      setBulkDates(null);
    } catch (error) {
      message.error("Lỗi cập nhật hàng loạt");
    }
  };

  const columns = [
    {title: "ID", dataIndex: "id", width: 60},
    {
      title: "Tên Đề Cương",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-blue-600">{record.name}</div>
          <div className="text-xs text-gray-500">{record.subject_name}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={
            status === "Approved"
              ? "green"
              : status === "Pending"
                ? "blue"
                : "orange"
          }
        >
          {status || "Draft"}
        </Tag>
      ),
    },
    {
      title: "Giảng viên phụ trách",
      width: 250,
      render: (_, record) => {
        const editData = editingData[record.id];
        const displayName =
          editData?.lecturer_name_temp ||
          record.lecturer_name ||
          "Chưa phân công";

        return (
          <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
            <span
              className="text-[13px] font-medium truncate"
              title={displayName}
            >
              {displayName}
            </span>
            <Button
              size="small"
              onClick={() => {
                setActiveSyllabusId(record.id);
                setIsModalOpen(true);
              }}
            >
              Phân công
            </Button>
          </div>
        );
      },
    },
    {
      title: "Thời hạn (Start - End)",
      width: 320,
      render: (_, record) => {
        const defaultDates =
          record.start_date_edition && record.end_date_edition
            ? [dayjs(record.start_date_edition), dayjs(record.end_date_edition)]
            : null;
        return (
          <RangePicker
            className="w-full"
            showTime
            defaultValue={defaultDates}
            onChange={(dates) => handleFieldChange(record.id, "dates", dates)}
          />
        );
      },
    },
    {
      title: "Lịch sử cập nhật",
      dataIndex: "edit_date",
      width: 250,
      render: (text) => (
        <span className="text-xs text-gray-500 italic block">
          {text || "Chưa có thông tin"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="small"
          disabled={!editingData[record.id]}
          onClick={() => handleSave(record)}
        >
          Lưu
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => nav(-1)}
          />
          <Title level={4} className="!m-0">
            Phân công biên soạn - CTĐT #{programId}
          </Title>
        </div>

        <Input
          placeholder="Tìm kiếm theo tên đề cương..."
          allowClear
          onChange={(e) => setQ(e.target.value)}
          style={{width: 300}}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Thêm đề cương
        </Button>
      </div>

      {selectedRowKeys.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 mb-4 rounded flex justify-between items-center transition-all">
          <span className="text-blue-700 font-medium">
            Đã chọn: {selectedRowKeys.length} đề cương
          </span>
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => setIsBulkModalOpen(true)}
            >
              Đặt deadline
            </Button>
          </Space>
        </div>
      )}

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={syllabuses}
        rowKey="id"
        loading={loading && page === 1}
        pagination={false}
        bordered
        scroll={{x: "max-content"}}
      />

      {hasNext && (
        <div className="mt-4 flex justify-center">
          <Button type="default" onClick={loadMore} loading={loading}>
            Tải thêm đề cương
          </Button>
        </div>
      )}
      <Modal
        title="Tạo đề cương mới"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleCreateSyllabus}>
          <Form.Item
            label="Tên đề cương"
            name="name"
            rules={[{required: true, message: "Vui lòng nhập tên đề cương!"}]}
          >
            <Input placeholder="Nhập tên đề cương..." />
          </Form.Item>

          <Form.Item
            label="Môn học"
            name="subject_obj"
            rules={[{required: true, message: "Vui lòng chọn môn học!"}]}
          >
            <Select
              showSearch
              placeholder="Chọn môn học"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {subjects.map((sub) => (
                <Option key={sub.id} value={sub.id}>
                  {sub.name} - {sub.code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Mẫu đề cương"
            name="template_obj"
            rules={[{required: true, message: "Vui lòng chọn mẫu đề cương!"}]}
          >
            <Select placeholder="Chọn mẫu đề cương">
              {templates.map((tpl) => (
                <Option key={tpl.id} value={tpl.id}>
                  {tpl.name} (v{tpl.version})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Khoa phụ trách"
            name="faculty_obj"
            rules={[{required: true, message: "Vui lòng chọn khoa!"}]}
          >
            <Select placeholder="Chọn khoa">
              {faculties.map((fac) => (
                <Option key={fac.id} value={fac.id}>
                  {fac.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Giảng viên phụ trách"
            name="lecturer_obj"
            rules={[{required: true, message: "Vui lòng chọn giảng viên!"}]}
          >
            <Select
              showSearch
              placeholder="Chọn giảng viên"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {lecturers.map((lec) => (
                <Option key={lec.id} value={lec.id}>
                  {lec.last_name} {lec.first_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="text-right mb-0">
            <Space>
              <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Xác nhận tạo
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Đặt deadline hàng loạt"
        open={isBulkModalOpen}
        onOk={handleApplyBulkDeadline}
        onCancel={() => setIsBulkModalOpen(false)}
        okText="Áp dụng"
        cancelText="Hủy"
        destroyOnClose
      >
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <div className="mb-1 font-medium">Khoảng thời gian:</div>
            <RangePicker
              className="w-full"
              showTime
              onChange={(dates) => setBulkDates(dates)}
            />
          </div>

          <div>
            <div className="mb-2 font-medium">Tùy chọn ghi đè:</div>
            <Space direction="vertical">
              <Checkbox
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              >
                Ghi đè deadline cũ (nếu có)
              </Checkbox>
              <Checkbox
                checked={!overwrite}
                onChange={(e) => setOverwrite(!e.target.checked)}
              >
                Bỏ qua các đề cương đã có deadline
              </Checkbox>
            </Space>
          </div>
        </div>
      </Modal>

      <Modal
        title="Chọn giảng viên phụ trách"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div className="mb-4">
          <Input.Search
            placeholder="Tìm kiếm giảng viên (Tên, Email, Username)..."
            allowClear
            onSearch={(value) => {
              setLecturerQ(value);
              setLecturerPage(1);
            }}
            onChange={(e) => {
              if (lecturerSearchTimeoutRef.current)
                clearTimeout(lecturerSearchTimeoutRef.current);
              lecturerSearchTimeoutRef.current = setTimeout(() => {
                setLecturerQ(e.target.value);
                setLecturerPage(1);
              }, 500);
            }}
          />
        </div>

        <Table
          columns={lecturerColumns}
          dataSource={lecturers}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{y: 400}}
          loading={loading && lecturerPage === 1}
        />

        {hasNextLecturer && (
          <div className="mt-4 flex justify-center">
            <Button
              type="default"
              onClick={() => setLecturerPage((prev) => prev + 1)}
              loading={loading}
            >
              Tải thêm giảng viên
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SyllabusesProgram;
