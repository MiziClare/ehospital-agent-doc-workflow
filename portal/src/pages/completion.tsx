import { Result, Button, Card, Timeline } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  SendOutlined,
  HomeOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  useCurrentDiagnosisInfoStore,
  useSelectedPharmacyStore,
  useSelectedLabStore,
  useFaxSentStore,
  useGeneratedOrdersStore,
  useOrderSubmittedStore,
  useWorkflowGenerationStore,
} from "../store";

export const CompletionPage = () => {
  const navigate = useNavigate();
  const { diagnosisInfo, updateDiagnosisInfo } = useCurrentDiagnosisInfoStore();
  const { selectedPharmacy, updateSelectedPharmacy } =
    useSelectedPharmacyStore();
  const { selectedLab, updateSelectedLab } = useSelectedLabStore();
  const {
    prescriptionFaxSent,
    requisitionFaxSent,
    setPrescriptionFaxSent,
    setRequisitionFaxSent,
  } = useFaxSentStore();
  const { updateOrderIds } = useGeneratedOrdersStore();
  const { setOrderSubmitted } = useOrderSubmittedStore();
  const { setHasGeneratedOrders } = useWorkflowGenerationStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleRestart = () => {
    // Reset all states
    updateDiagnosisInfo(null);
    updateSelectedPharmacy(null);
    updateSelectedLab(null);
    setPrescriptionFaxSent(false);
    setRequisitionFaxSent(false);
    updateOrderIds(null, null);
    setOrderSubmitted(false);
    setHasGeneratedOrders(false);

    navigate("/landing");
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden p-8 md:p-12">
        <Result
          status="success"
          icon={
            <div className="relative inline-flex justify-center items-center">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
              <CheckCircleOutlined className="text-green-500 text-9xl relative z-10 drop-shadow-xl" />
            </div>
          }
          title={
            <div className="space-y-4 mt-4">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                All Processes Completed Successfully!
              </h1>
              <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
                Your medical documents have been processed, verified, and
                securely transmitted.
              </p>
            </div>
          }
          subTitle={
            <div className="mt-12 w-full text-left">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Patient Info Card */}
                <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 group rounded-2xl">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <CheckCircleOutlined className="text-2xl" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-900 m-0">
                        Patient Info
                      </h3>
                    </div>
                    {diagnosisInfo && diagnosisInfo.length > 0 && (
                      <div className="mt-auto space-y-3">
                        <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                            Diagnosis
                          </p>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">
                            {diagnosisInfo[0].diagnosis_description}
                          </p>
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                          ICD-10: {diagnosisInfo[0].diagnosis_code}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Pharmacy Card */}
                {selectedPharmacy && (
                  <Card
                    className={`h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group ${
                      prescriptionFaxSent
                        ? "bg-gradient-to-br from-purple-50 to-fuchsia-50 hover:from-purple-100 hover:to-fuchsia-100"
                        : "bg-gradient-to-br from-gray-50 to-slate-100"
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl ${
                            prescriptionFaxSent
                              ? "bg-purple-500 shadow-purple-200"
                              : "bg-gray-400"
                          } text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                        >
                          {prescriptionFaxSent ? (
                            <MedicineBoxOutlined className="text-2xl" />
                          ) : (
                            <CloseCircleOutlined className="text-2xl" />
                          )}
                        </div>
                        <h3
                          className={`text-lg font-bold ${
                            prescriptionFaxSent
                              ? "text-purple-900"
                              : "text-gray-600"
                          } m-0`}
                        >
                          Pharmacy
                        </h3>
                      </div>
                      <div className="mt-auto space-y-3">
                        <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                          <p className="text-sm font-bold text-gray-800 mb-1">
                            {selectedPharmacy.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-start gap-1">
                            <EnvironmentOutlined className="mt-0.5 shrink-0" />
                            <span className="line-clamp-2">
                              {selectedPharmacy.address}
                            </span>
                          </p>
                        </div>
                        {prescriptionFaxSent ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircleOutlined className="mr-1.5" /> Fax Sent
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-bold">
                            <CloseCircleOutlined className="mr-1.5" /> Not Sent
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Lab Card */}
                {selectedLab && (
                  <Card
                    className={`h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group ${
                      requisitionFaxSent
                        ? "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                        : "bg-gradient-to-br from-gray-50 to-slate-100"
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl ${
                            requisitionFaxSent
                              ? "bg-emerald-500 shadow-emerald-200"
                              : "bg-gray-400"
                          } text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                        >
                          {requisitionFaxSent ? (
                            <ExperimentOutlined className="text-2xl" />
                          ) : (
                            <CloseCircleOutlined className="text-2xl" />
                          )}
                        </div>
                        <h3
                          className={`text-lg font-bold ${
                            requisitionFaxSent
                              ? "text-emerald-900"
                              : "text-gray-600"
                          } m-0`}
                        >
                          Laboratory
                        </h3>
                      </div>
                      <div className="mt-auto space-y-3">
                        <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                          <p className="text-sm font-bold text-gray-800 mb-1">
                            {selectedLab.name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-start gap-1">
                            <EnvironmentOutlined className="mt-0.5 shrink-0" />
                            <span className="line-clamp-2">
                              {selectedLab.address}
                            </span>
                          </p>
                        </div>
                        {requisitionFaxSent ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircleOutlined className="mr-1.5" /> Fax Sent
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-bold">
                            <CloseCircleOutlined className="mr-1.5" /> Not Sent
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Completion Status Card */}
                <Card
                  className={`h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group ${
                    prescriptionFaxSent || requisitionFaxSent
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
                      : "bg-gradient-to-br from-gray-50 to-slate-100"
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${
                          prescriptionFaxSent || requisitionFaxSent
                            ? "bg-amber-500 shadow-amber-200"
                            : "bg-gray-400"
                        } text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <SendOutlined className="text-2xl" />
                      </div>
                      <h3
                        className={`text-lg font-bold ${
                          prescriptionFaxSent || requisitionFaxSent
                            ? "text-amber-900"
                            : "text-gray-600"
                        } m-0`}
                      >
                        Status
                      </h3>
                    </div>
                    <div className="mt-auto">
                      <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm min-h-[80px] flex items-center">
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                          {prescriptionFaxSent && requisitionFaxSent
                            ? "All documents successfully transmitted."
                            : prescriptionFaxSent
                            ? "Prescription sent only."
                            : requisitionFaxSent
                            ? "Requisition sent only."
                            : "No documents sent."}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Process Timeline */}
              <Card className="border-0 shadow-lg bg-gray-50/50 rounded-3xl p-2">
                <div className="flex items-center gap-3 mb-8 px-4 pt-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FileTextOutlined className="text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 m-0">
                    Workflow Summary
                  </h3>
                </div>
                <div className="px-4 pb-2">
                  <Timeline
                    mode="left"
                    items={[
                      {
                        color: "green",
                        dot: <CheckCircleOutlined className="text-xl" />,
                        children: (
                          <div className="pb-6">
                            <p className="font-bold text-gray-800 text-base m-0">
                              Patient Information Confirmed
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Patient diagnosis and details verified
                            </p>
                          </div>
                        ),
                      },
                      {
                        color: "green",
                        dot: <FileTextOutlined className="text-xl" />,
                        children: (
                          <div className="pb-6">
                            <p className="font-bold text-gray-800 text-base m-0">
                              Documents Generated
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Prescription and requisition created
                            </p>
                          </div>
                        ),
                      },
                      {
                        color: "green",
                        dot: <EnvironmentOutlined className="text-xl" />,
                        children: (
                          <div className="pb-6">
                            <p className="font-bold text-gray-800 text-base m-0">
                              Facilities Selected
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Pharmacy and laboratory assigned
                            </p>
                          </div>
                        ),
                      },
                      {
                        color: "green",
                        dot: <ExperimentOutlined className="text-xl" />,
                        children: (
                          <div className="pb-6">
                            <p className="font-bold text-gray-800 text-base m-0">
                              Forms Reviewed & Submitted
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Documents verified and approved
                            </p>
                          </div>
                        ),
                      },
                      {
                        color: "green",
                        dot: <SendOutlined className="text-xl" />,
                        children: (
                          <div>
                            <p className="font-bold text-gray-800 text-base m-0">
                              Faxes Sent Successfully
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              All documents delivered to destinations
                            </p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            </div>
          }
          extra={[
            <Button
              key="restart"
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleRestart}
              className="h-14 px-12 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 mt-8"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                border: "none",
              }}
            >
              Start New Workflow
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};
