import { Button } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThunderboltOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  RobotOutlined,
} from "@ant-design/icons";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const actions = [
    {
      key: "auto-prescription",
      title: "Auto Prescription",
      desc: "Automatically generate Prescription based on Diagnosis",
      icon: <FileTextOutlined />,
      typeLabel: "Auto",
      onClick: () => navigate("/workflow/auto-prescription"),
    },
    {
      key: "auto-requisition",
      title: "Auto Requisition",
      desc: "Automatically generate Lab Requisition from Diagnosis",
      icon: <ExperimentOutlined />,
      typeLabel: "Auto",
      onClick: () => navigate("/workflow/auto-requisition"),
    },
    {
      key: "auto-dual-forms",
      title: "Auto Dual-Forms",
      desc: "Auto generate Prescription + Requisition, then Review & Fax",
      icon: <ThunderboltOutlined />,
      typeLabel: "Auto",
      primary: true,
      onClick: () => navigate("/workflow"),
    },
    {
      key: "manual-prescription-ai",
      title: "Manual Prescription + AI Assist",
      desc: "Manual entry with AI suggestions for medications",
      icon: <RobotOutlined />,
      typeLabel: "Manual + AI Assist",
      onClick: () => navigate("/workflow/manual-prescription"),
    },
    {
      key: "manual-requisition-ai",
      title: "Manual Requisition + AI Assist",
      desc: "Manual order with AI recommendations for labs",
      icon: <RobotOutlined />,
      typeLabel: "Manual + AI Assist",
      onClick: () => navigate("/workflow/manual-requisition"),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-b from-cyan-50/80 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Digital Medical <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Document Workflow</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Agent-driven E-Health App for Seamless Prescription & Requisition
          </p>
        </div>

        {/* Actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action) => (
            <div
              key={action.key}
              className={`group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-cyan-200 ${
                action.primary ? "ring-2 ring-cyan-200" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    action.primary ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-slate-100"
                  } text-2xl text-white`}
                >
                  <span className={action.primary ? "" : "text-slate-600"}>{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase tracking-wide">
                      {action.typeLabel}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{action.title}</h3>
                  <p className="text-slate-500 text-sm">{action.desc}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  type={action.primary ? "primary" : "default"}
                  className={
                    action.primary
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-none"
                      : ""
                  }
                  onClick={action.onClick}
                >
                  {action.primary ? "Start Auto Dual-Forms" : "Go"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;