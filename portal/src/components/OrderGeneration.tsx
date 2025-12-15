import React, { useState } from "react";
import { Button, message, Spin, Empty, Tag } from "antd";
import {
  FileTextOutlined,
  ThunderboltOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { generateWorkflowOrders } from "../apis/patient";
import {
  useCurrentDiagnosisInfoStore,
  useGeneratedOrdersStore,
  useWorkflowGenerationStore,
} from "../store";
import type { WorkflowOrderResponse } from "../types/WorkflowOrder";

const OrderGeneration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<WorkflowOrderResponse | null>(
    null
  );
  const { diagnosisInfo } = useCurrentDiagnosisInfoStore();
  const { updateOrderIds } = useGeneratedOrdersStore();
  const { setHasGeneratedOrders } = useWorkflowGenerationStore();

  const handleGenerateOrders = async () => {
    if (!diagnosisInfo || diagnosisInfo.length === 0) {
      message.error("Please search for diagnosis information first");
      return;
    }

    const patientId = diagnosisInfo[0].patient_id;

    setLoading(true);
    try {
      const data = await generateWorkflowOrders(patientId);
      setOrderData(data);
      // Save the generated IDs to store
      updateOrderIds(
        data.prescription.prescription_id,
        data.requisition.requisition_id
      );
      setHasGeneratedOrders(true);
      message.success("Orders generated successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate orders. Please try again.";
      message.error(errorMessage);
      console.error("Error generating orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      // 只显示日期部分
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "--";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: "green",
      inactive: "red",
      requested: "blue",
      completed: "green",
      pending: "orange",
      routine: "blue",
      urgent: "red",
      stat: "red",
    };
    return statusMap[status.toLowerCase()] || "default";
  };

  return (
    <div className="w-full h-full space-y-8 p-2">
      {/* Diagnosis Description Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-white p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
            <FileTextOutlined className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 m-0">
            Patient Diagnosis
          </h2>
        </div>

        <div className="p-8">
          {diagnosisInfo && diagnosisInfo.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                <p className="text-slate-700 leading-relaxed text-lg m-0">
                  {diagnosisInfo[0].diagnosis_description}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">
                    Diagnosis Code:
                  </span>
                  <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    {diagnosisInfo[0].diagnosis_code}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">
                    Patient ID:
                  </span>
                  <span className="font-bold text-slate-700">
                    {diagnosisInfo[0].patient_id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <Empty
              description={
                <span className="text-slate-400">
                  No diagnosis information available. Please search for a
                  patient first.
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>

      {/* Generate Orders Button */}
      {!orderData && (
        <div className="flex justify-center py-8">
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateOrders}
            loading={loading}
            disabled={!diagnosisInfo || diagnosisInfo.length === 0}
            className="h-16 px-12 rounded-full text-lg font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              border: "none",
            }}
          >
            Generate Orders
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-lg border border-slate-100">
          <Spin size="large" />
          <p className="text-slate-500 mt-6 text-lg font-medium">
            Generating orders based on diagnosis...
          </p>
        </div>
      )}

      {/* Generated Orders Display */}
      {orderData && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Prescription Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                <MedicineBoxOutlined className="text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 m-0">
                Prescription Form
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-blue-600 font-bold uppercase tracking-wider">
                    Prescription ID
                  </span>
                  <span className="font-mono bg-white px-3 py-1 rounded-lg text-blue-700 font-bold text-lg shadow-sm border border-blue-100">
                    #{orderData.prescription.prescription_id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/60 p-2 rounded-lg">
                    <span className="text-slate-500 block text-xs mb-1">
                      Patient ID
                    </span>
                    <span className="font-bold text-slate-700">
                      {orderData.prescription.patient_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Prescriber ID:</span>
                    <span className="ml-2 font-semibold">
                      {orderData.prescription.prescriber_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medication Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1 font-bold">
                    Medication
                  </div>
                  <div className="text-xl font-bold text-blue-700">
                    {orderData.prescription.medication_name}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">
                      Strength
                    </div>
                    <div className="font-bold text-slate-800">
                      {orderData.prescription.medication_strength}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">
                      Form
                    </div>
                    <div className="font-bold text-slate-800 capitalize">
                      {orderData.prescription.medication_form}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">
                      Quantity
                    </div>
                    <div className="font-bold text-slate-800">
                      {orderData.prescription.quantity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dosage Instructions */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <div className="text-xs text-amber-700 uppercase tracking-wide mb-2 font-semibold">
                  Dosage Instructions
                </div>
                <div className="text-gray-800 leading-relaxed">
                  {orderData.prescription.dosage_instructions}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">
                    Date Prescribed
                  </div>
                  <div className="font-medium text-gray-800 text-sm">
                    {formatDateTime(orderData.prescription.date_prescribed)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                  <div className="font-medium text-gray-800 text-sm">
                    {formatDate(orderData.prescription.expiry_date)}
                  </div>
                </div>
              </div>

              {/* Status and Refills */}
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 mr-2">Status:</span>
                  <Tag
                    color={getStatusColor(orderData.prescription.status)}
                    className="text-sm font-semibold"
                  >
                    {orderData.prescription.status.toUpperCase()}
                  </Tag>
                </div>
                <div>
                  <span className="text-xs text-gray-500 mr-2">
                    Refills Allowed:
                  </span>
                  <span className="font-bold text-lg text-blue-600">
                    {orderData.prescription.refills_allowed}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {orderData.prescription.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs text-blue-700 uppercase tracking-wide mb-2 font-semibold">
                    Notes
                  </div>
                  <div className="text-gray-700 text-sm leading-relaxed">
                    {orderData.prescription.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requisition Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                <ExperimentOutlined className="text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 m-0">
                Requisition Form
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-green-600 font-bold uppercase tracking-wider">
                    Requisition ID
                  </span>
                  <span className="font-mono bg-white px-3 py-1 rounded-lg text-green-700 font-bold text-lg shadow-sm border border-green-100">
                    #{orderData.requisition.requisition_id}
                  </span>
                </div>
                <div className="bg-white/60 p-2 rounded-lg inline-block w-full">
                  <span className="text-slate-500 block text-xs mb-1">
                    Patient ID
                  </span>
                  <span className="font-bold text-slate-700">
                    {orderData.requisition.patient_id}
                  </span>
                </div>
              </div>

              {/* Department and Test Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-1 font-bold">
                    Department
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    {orderData.requisition.department}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-medium">
                      Test Type
                    </div>
                    <div className="font-bold text-slate-800 text-lg">
                      {orderData.requisition.test_type}
                    </div>
                  </div>
                  {orderData.requisition.test_code && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1 font-medium">
                        Test Code
                      </div>
                      <div className="font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block font-bold text-slate-600 border border-slate-200">
                        {orderData.requisition.test_code}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Information */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-bold">
                  Clinical Information
                </div>
                <div className="text-slate-700 leading-relaxed font-medium">
                  {orderData.requisition.clinical_info}
                </div>
              </div>

              {/* Date and Priority */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    Date Requested
                  </div>
                  <div className="font-medium text-slate-800">
                    {formatDateTime(orderData.requisition.date_requested)}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      Priority
                    </span>
                    <Tag
                      color={getStatusColor(orderData.requisition.priority)}
                      className="text-sm font-bold px-3 py-0.5 rounded-full border-0"
                    >
                      {orderData.requisition.priority.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      Status
                    </span>
                    <Tag
                      color={getStatusColor(orderData.requisition.status)}
                      className="text-sm font-bold px-3 py-0.5 rounded-full border-0"
                    >
                      {orderData.requisition.status.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </div>

              {/* Result Date */}
              {orderData.requisition.result_date && (
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="text-xs text-green-700 mb-1 font-bold">
                    Result Date
                  </div>
                  <div className="font-medium text-slate-800">
                    {formatDate(orderData.requisition.result_date)}
                  </div>
                </div>
              )}

              {/* Notes */}
              {orderData.requisition.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="text-xs text-amber-600 uppercase tracking-wide mb-2 font-bold">
                    Notes
                  </div>
                  <div className="text-slate-700 text-sm leading-relaxed">
                    {orderData.requisition.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Orders State */}
      {!orderData && !loading && diagnosisInfo && diagnosisInfo.length > 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <ThunderboltOutlined className="text-5xl text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-400 mb-3">
              No Orders Generated Yet
            </h3>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Click the button above to generate prescription and requisition
              forms based on the diagnosis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderGeneration;
