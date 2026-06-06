import {useContext, useEffect, useState} from "react";
import {authApis, endpoints} from "../../config/Apis";
import MySpinner from "../../components/MySpinner";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Upload,
} from "antd";
import {UploadOutlined, UserOutlined} from "@ant-design/icons";
import {MyUserContext} from "../../config/contexts/MyContext";
const User = () => {
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [user, dispatch] = useContext(MyUserContext);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        room: user.lecturer?.room,
        faculty: user.lecturer?.faculty?.name,
      });
    } else {
      form.resetFields();
    }
  }, [user, form]);

  const onFinish = async (values) => {
    setSubmitLoading(true);
    try {
      console.log("Dữ liệu cập nhật:", values);
      const res = await authApis().patch(endpoints["profile"], values);
      if (res.status === 200) {
        message.success("Cập nhật thông tin thành cong!");
      } else {
        message.error("Có lỗi xảy ra khi cập nhật!");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật!");
    } finally {
      setSubmitLoading(false);
    }
  };

  const loadUser = async (e) => {
    if (!user) {
      try {
        const res = await authApis().get(endpoints["profile"]);
        dispatch({type: "login", payload: res.data});
      } catch (error) {
        dispatch({type: "logout"});
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);
  return (
    <>
      {loading === true ? (
        <MySpinner />
      ) : (
        <Card
          title="HỒ SƠ CÁ NHÂN"
          style={{
            maxWidth: 800,
            margin: "40px auto",
            borderColor: "#00529C",
            borderRadius: 8,
          }}
          headStyle={{
            color: "#00529C",
            textAlign: "center",
            fontSize: "20px",
          }}
        >
          <Row gutter={40}>
            <Col
              span={8}
              style={{textAlign: "center", borderRight: "1px solid #f0f0f0"}}
            >
              <Avatar
                size={160}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{marginBottom: 20, border: "2px solid #00529C"}}
              />
              <br />
              <Upload showUploadList={false}>
                <Button icon={<UploadOutlined />}>Đổi ảnh đại diện</Button>
              </Upload>
            </Col>

            <Col span={16}>
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Họ" name="first_name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Tên" name="last_name">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Email" name="email">
                  <Input type="email" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Phòng làm việc" name="room">
                      <Input placeholder="Nhập phòng làm việc" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Khoa" name="faculty">
                      <Input placeholder="Nhập tên khoa" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{textAlign: "right", marginTop: 10}}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoading}
                    style={{backgroundColor: "#00529C", width: "150px"}}
                  >
                    LƯU THAY ĐỔI
                  </Button>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>
      )}
    </>
  );
};

export default User;
