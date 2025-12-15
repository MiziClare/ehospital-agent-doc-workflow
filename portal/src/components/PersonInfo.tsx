import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Form, Descriptions, message, Spin, Alert } from "antd";
import {
  UserOutlined,
  SearchOutlined,
  IdcardOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { getLatestDiagnosisByPatientId } from "../apis/patient";
import type { DiagnosisInfo } from "../types/Diagnosis";
import { useCurrentDiagnosisInfoStore } from "../store";

const PersonInfo: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisInfo[] | null>(
    null
  );
  const { updateDiagnosisInfo } = useCurrentDiagnosisInfoStore();
  const hasAutoLoaded = useRef(false);

  const handleSearch = async (values: { patientId: string }) => {
    const patientId = parseInt(values.patientId);

    if (!patientId || patientId <= 0) {
      message.error("Please enter a valid patient ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getLatestDiagnosisByPatientId(patientId);
      console.log("Received diagnosis data:", data);

      // 检查数据是否有效
      if (!data || (Array.isArray(data) && data.length === 0)) {
        setError("No diagnosis information found for this patient");
        setDiagnosisData(null);
        message.warning("No diagnosis information found");
        return;
      }

      const diagnosisArray = Array.isArray(data) ? data : [data];
      setDiagnosisData(diagnosisArray);
      updateDiagnosisInfo(diagnosisArray);
      message.success("Diagnosis information loaded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Diagnosis information not found or network error";
      setError(errorMessage);
      setDiagnosisData(null);
      console.error("Error:", err);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill and search from URL parameter
  useEffect(() => {
    if (hasAutoLoaded.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get("patient_id");

    if (patientId && /^\d+$/.test(patientId)) {
      hasAutoLoaded.current = true;
      form.setFieldsValue({ patientId });
      handleSearch({ patientId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full h-full space-y-8">
      {/* Client ID Search Area */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm">
            <SearchOutlined className="text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 m-0">
              Latest Diagnosis Search
            </h2>
            <p className="text-slate-500 m-0">
              Enter patient ID to retrieve medical records
            </p>
          </div>
        </div>

        <Form
          form={form}
          onFinish={handleSearch}
          layout="vertical"
          className="w-full relative z-10"
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <Form.Item
              name="patientId"
              label={
                <span className="font-semibold text-slate-700 text-base">
                  Patient ID
                </span>
              }
              rules={[
                { required: true, message: "Please enter patient ID" },
                {
                  pattern: /^\d+$/,
                  message: "Please enter a valid numeric ID",
                },
              ]}
              className="flex-1 w-full mb-0"
            >
              <Input
                placeholder="e.g. 12345"
                size="large"
                disabled={loading}
                prefix={
                  <IdcardOutlined className="text-slate-400 text-lg mr-2" />
                }
                className="h-14 rounded-xl border-slate-200 hover:border-cyan-400 focus:border-cyan-500 text-lg"
              />
            </Form.Item>
            <Form.Item className="mb-0 w-full md:w-auto">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<SearchOutlined />}
                className="h-14 px-8 rounded-xl text-lg font-bold shadow-lg shadow-cyan-200 hover:shadow-cyan-300 transition-all w-full md:w-auto"
                style={{
                  background:
                    "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                  border: "none",
                }}
              >
                Search Records
              </Button>
            </Form.Item>
          </div>
        </Form>
      </div>

      {/* Error Message Display */}
      {error && (
        <Alert
          message="Search Failed"
          description={error}
          type="error"
          showIcon
          className="rounded-2xl border-red-100 bg-red-50 text-red-800 shadow-sm"
          closable
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-lg border border-slate-100">
          <Spin size="large" />
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-semibold text-slate-700">
              Retrieving Records...
            </h3>
            <p className="text-slate-500">
              Please wait while we fetch the diagnosis information
            </p>
          </div>
        </div>
      )}

      {/* Diagnosis Information Display */}
      {diagnosisData && diagnosisData.length > 0 && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {diagnosisData.map((diagnosis, index) => (
            <div
              key={diagnosis.diagnosis_id}
              className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <FileTextOutlined className="text-xl" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 m-0">
                    Diagnosis Record #{index + 1}
                  </h3>
                </div>
                <div className="px-4 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-bold border border-purple-100">
                  Active
                </div>
              </div>

              <div className="p-6">
                <Descriptions
                  bordered
                  column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
                  size="middle"
                  className="rounded-xl overflow-hidden border-slate-200"
                  labelStyle={{
                    backgroundColor: "#f8fafc",
                    fontWeight: 600,
                    color: "#475569",
                    width: "160px",
                    fontSize: "13px",
                  }}
                  contentStyle={{
                    fontSize: "14px",
                    backgroundColor: "#fff",
                  }}
                >
                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <IdcardOutlined className="text-purple-500" />
                        <span>Diagnosis ID</span>
                      </div>
                    }
                  >
                    <span className="font-bold text-purple-600 text-base">
                      #{diagnosis.diagnosis_id}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-cyan-500" />
                        <span>Patient ID</span>
                      </div>
                    }
                  >
                    <span className="font-semibold text-slate-700">
                      {diagnosis.patient_id}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-blue-500" />
                        <span>Doctor ID</span>
                      </div>
                    }
                  >
                    <span className="text-slate-700">
                      {diagnosis.doctor_id}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <FileTextOutlined className="text-green-500" />
                        <span>Diagnosis Code</span>
                      </div>
                    }
                    span={2}
                  >
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-700 text-base font-bold border border-slate-200">
                      {diagnosis.diagnosis_code}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-orange-500" />
                        <span>Date</span>
                      </div>
                    }
                  >
                    <span className="text-slate-700">
                      {formatDate(diagnosis.diagnosis_date)}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item
                    label={
                      <div className="flex items-center gap-2">
                        <FileTextOutlined className="text-amber-500" />
                        <span>Description</span>
                      </div>
                    }
                    span={3}
                  >
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap m-0">
                        {diagnosis.diagnosis_description}
                      </p>
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!diagnosisData && !loading && !error && (
        <div className="bg-white rounded-3xl text-center py-16 shadow-sm border-2 border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center">
            <FileTextOutlined className="text-6xl text-slate-200 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              No Diagnosis Information
            </h3>
            <p className="text-slate-400 text-base">
              Please enter a patient ID above to search for diagnosis details
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonInfo;
