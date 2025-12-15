import { Button } from "antd";
import { useEffect } from "react";
import {
  UserOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const patientOptions = [
    { id: 1, name: "John Smith", condition: "Diabetes Type 2" },
    { id: 2, name: "Sarah Johnson", condition: "Hypertension" },
    { id: 3, name: "Michael Chen", condition: "Asthma" },
    { id: 4, name: "Emma Wilson", condition: "Arthritis" },
  ];

  const handlePatientSelect = (patientId: number) => {
    // Navigate to workflow with patient_id parameter
    navigate(`/workflow?patient_id=${patientId}`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-50/80 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />
      <div className="absolute top-1/3 -left-24 w-72 h-72 bg-teal-100/50 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl mb-8 animate-bounce-slow ring-4 ring-cyan-50">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
              <MedicineBoxOutlined className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
            Digital Medical <br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Document System
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Streamline your healthcare workflow with intelligent automation.
            <span className="block text-slate-400 text-lg mt-2 font-normal">
              Secure, efficient, and compliant processing.
            </span>
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <UserOutlined />,
              title: "Patient Management",
              desc: "Access and manage patient diagnoses with ease",
              bgClass: "bg-cyan-50",
              textClass: "text-cyan-600",
              borderClass: "group-hover:border-cyan-200",
            },
            {
              icon: <MedicineBoxOutlined />,
              title: "Prescription Processing",
              desc: "Generate and send prescriptions instantly",
              bgClass: "bg-teal-50",
              textClass: "text-teal-600",
              borderClass: "group-hover:border-teal-200",
            },
            {
              icon: <ExperimentOutlined />,
              title: "Lab Requisitions",
              desc: "Create and transmit lab orders efficiently",
              bgClass: "bg-blue-50",
              textClass: "text-blue-600",
              borderClass: "group-hover:border-blue-200",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`group bg-white rounded-[2rem] p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100 ${feature.borderClass}`}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${feature.bgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
              >
                <span className={`text-3xl ${feature.textClass}`}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-slate-900">
                {feature.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Patient Selection Section */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-8 md:p-16 shadow-2xl border border-white/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Select a Patient
            </h2>
            <p className="text-slate-500 text-lg">
              Choose a patient profile to initiate the workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto relative z-10">
            {patientOptions.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handlePatientSelect(patient.id)}
                className="group relative bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 hover:border-cyan-200 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-125" />

                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-50 transition-colors duration-300">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-cyan-300/50 transition-all duration-300 group-hover:scale-110">
                      <span className="text-white text-2xl font-bold">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-800 mb-1 truncate group-hover:text-cyan-700 transition-colors">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 font-mono tracking-wide">
                      ID: #{patient.id.toString().padStart(4, "0")}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full group-hover:bg-cyan-100 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2 animate-pulse" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-cyan-700 uppercase tracking-wider">
                        {patient.condition}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={<RocketOutlined />}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 border-none shadow-lg hover:shadow-cyan-300/50 flex items-center justify-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-slate-400 font-medium">
              Or enter a custom patient ID in the next step
            </p>
          </div>
        </div>

        {/* Workflow Shortcuts */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="group bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-cyan-200 cursor-pointer"
            onClick={() => navigate(`/workflow/manual-prescription`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <MedicineBoxOutlined className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Manual Prescription + AI Assist</h3>
                <p className="text-slate-500">Create empty prescription, edit, or let AI complete</p>
              </div>
            </div>
          </div>
          <div
            className="group bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-cyan-200 cursor-pointer"
            onClick={() => navigate(`/workflow/manual-requisition`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                <ExperimentOutlined className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Manual Requisition + AI Assist</h3>
                <p className="text-slate-500">Create empty requisition, edit, or let AI complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-20 pb-8">
          <div className="inline-flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm font-semibold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              Secure
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
              Encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
