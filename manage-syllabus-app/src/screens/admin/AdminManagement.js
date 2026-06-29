import React from "react";
import {Card} from "antd";
import {useNavigate} from "react-router-dom";
import {
  BankOutlined,
  BookOutlined,
  ReadOutlined,
  ProfileOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

const AdminManagement = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: "Quản lý Khoa",
      description: "Quản lý thông tin các Khoa trong trường",
      icon: <BankOutlined className="text-4xl text-blue-500" />,
      path: "/admin/faculties",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Quản lý Môn học",
      description: "Quản lý danh sách môn học và số tín chỉ",
      icon: <BookOutlined className="text-4xl text-green-500" />,
      path: "/admin/subjects",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Quản lý Ngành",
      description: "Quản lý danh mục chuyên ngành đào tạo",
      icon: <ReadOutlined className="text-4xl text-purple-500" />,
      path: "/admin/majors",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Chương trình đào tạo",
      description: "Quản lý CTĐT theo từng năm học",
      icon: <ProfileOutlined className="text-4xl text-orange-500" />,
      path: "/admin/training-programs",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      title: "Quản lý Người dùng",
      description: "Quản lý tài khoản và phân quyền hệ thống",
      icon: <TeamOutlined className="text-4xl text-rose-500" />,
      path: "/admin/users",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bảng điều khiển Admin
        </h1>
        <p className="text-gray-500 mt-2">
          Chọn một chức năng bên dưới để bắt đầu quản lý hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminFeatures.map((feature, index) => (
          <Card
            key={index}
            hoverable
            onClick={() => navigate(feature.path)}
            className={`border ${feature.borderColor} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
            bodyStyle={{padding: 0}}
          >
            <div className="flex flex-col h-full">
              <div
                className={`${feature.bgColor} p-6 flex justify-center items-center border-b ${feature.borderColor}`}
              >
                {feature.icon}
              </div>

              <div className="p-5 bg-white text-center flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminManagement;
