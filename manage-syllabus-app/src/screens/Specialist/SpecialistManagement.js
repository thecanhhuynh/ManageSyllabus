import React from "react";
import {Card} from "antd";
import {useNavigate} from "react-router-dom";
import {BankOutlined} from "@ant-design/icons";

const SpecialistManagement = () => {
  const navigate = useNavigate();

  const adminFeatures = [
    {
      title: "Quản lý Phiên bản đề cương",
      description: "Quản lý thông tin các phiên bản đề cương",
      icon: <BankOutlined className="text-4xl text-blue-500" />,
      path: "/specialist/templates",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Bảng điều khiển Specialist Template
        </h1>
        <p className="text-gray-500 mt-2">
          Chọn một chức năng bên dưới để bắt đầu.
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

export default SpecialistManagement;
