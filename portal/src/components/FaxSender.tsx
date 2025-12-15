import { useState, useEffect } from "react";
import { Button, message, Result, Alert, Tag } from "antd";
import {
  SendOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  LoadingOutlined,
  EnvironmentOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  useGeneratedOrdersStore,
  useSelectedPharmacyStore,
  useSelectedLabStore,
  useFaxSentStore,
  usePrescriptionWorkflowStore,
  useRequisitionWorkflowStore,
} from "../store";
import { sendPrescriptionFax, sendRequisitionFax, setPrescriptionPharmacy, setRequisitionLab } from "../apis/patient";

const FaxSender: React.FC<{ mode?: "dual" | "prescription-only" | "requisition-only" }> = ({ mode = "dual" }) => {
  const [prescriptionFaxSent, setPrescriptionFaxSent] = useState(false);
  const [requisitionFaxSent, setRequisitionFaxSent] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [requisitionLoading, setRequisitionLoading] = useState(false);
  const [prescriptionMessage, setPrescriptionMessage] = useState("");
  const [requisitionMessage, setRequisitionMessage] = useState("");
  const { prescriptionId: dualPrescriptionId, requisitionId: dualRequisitionId } = useGeneratedOrdersStore();
  const { prescriptionId: singlePrescriptionId } = usePrescriptionWorkflowStore();
  const { requisitionId: singleRequisitionId } = useRequisitionWorkflowStore();
  const prescriptionId = mode !== "requisition-only" ? (dualPrescriptionId || singlePrescriptionId) : null;
  const requisitionId = mode !== "prescription-only" ? (dualRequisitionId || singleRequisitionId) : null;
  const { selectedPharmacy } = useSelectedPharmacyStore();
  const { selectedLab } = useSelectedLabStore();
  const {
    setPrescriptionFaxSent: setGlobalPrescriptionFaxSent,
    setRequisitionFaxSent: setGlobalRequisitionFaxSent,
  } = useFaxSentStore();

  const allFaxesSent = (mode === "dual")
    ? (prescriptionFaxSent && requisitionFaxSent)
    : (mode === "prescription-only" ? prescriptionFaxSent : requisitionFaxSent);

  // Update store when faxes are sent
  useEffect(() => {
    if (prescriptionFaxSent) {
      setGlobalPrescriptionFaxSent(true);
    }
    if (requisitionFaxSent) {
      setGlobalRequisitionFaxSent(true);
    }
  }, [
    prescriptionFaxSent,
    requisitionFaxSent,
    setGlobalPrescriptionFaxSent,
    setGlobalRequisitionFaxSent,
  ]);

  const handleSendPrescriptionFax = async () => {
    if (!prescriptionId) {
      message.error("Prescription ID not found. Please generate orders first.");
      return;
    }

    // Ensure destination is bound (many backends require pharmacy_id before fax)
    if (!selectedPharmacy?.pharmacy_id) {
      message.warning("Please select a pharmacy in Step 3 and submit in Step 4 before faxing.");
      return;
    }

    setPrescriptionLoading(true);
    try {
      try {
        await setPrescriptionPharmacy(prescriptionId, selectedPharmacy.pharmacy_id);
      } catch (e) {
        // Continue; backend may already have the binding
      }
      const response = await sendPrescriptionFax(prescriptionId);
      setPrescriptionFaxSent(true);
      setPrescriptionMessage(response.message || "Fax sent successfully");
      message.success("Prescription fax sent successfully!");
    } catch (error) {
      message.error("Failed to send prescription fax. Please verify Step 4 submission and destination.");
      console.error("Error sending prescription fax:", error);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleSendRequisitionFax = async () => {
    if (!requisitionId) {
      message.error("Requisition ID not found. Please generate orders first.");
      return;
    }

    // Ensure destination is bound
    if (!selectedLab?.lab_id) {
      message.warning("Please select a lab in Step 3 and submit in Step 4 before faxing.");
      return;
    }

    setRequisitionLoading(true);
    try {
      try {
        await setRequisitionLab(requisitionId, selectedLab.lab_id);
      } catch (e) {
        // Continue if already bound
      }
      const response = await sendRequisitionFax(requisitionId);
      setRequisitionFaxSent(true);
      setRequisitionMessage(response.message || "Fax sent successfully");
      message.success("Requisition fax sent successfully!");
    } catch (error) {
      message.error("Failed to send requisition fax. Please verify Step 4 submission and destination.");
      console.error("Error sending requisition fax:", error);
    } finally {
      setRequisitionLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[500px] flex flex-col">
      {/* Header Info */}
      <Alert
        message="Fax Transmission"
        description="Transmit prescription to pharmacy and requisition to lab. Both transmissions required to complete workflow."
        type="info"
        showIcon
        className="mb-6"
      />

      {/* All Faxes Sent Success State */}
      {allFaxesSent && (
        <Result
          status="success"
          icon={<CheckCircleOutlined className="text-green-600" />}
          title={
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              All Faxes Sent Successfully!
            </span>
          }
          subTitle={mode === "dual" ? "Both prescription and requisition have been successfully faxed to their respective destinations." : (mode === "prescription-only" ? "Prescription has been successfully faxed to the pharmacy." : "Requisition has been successfully faxed to the lab.")}
          extra={
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className={`grid ${mode === "dual" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-6`}>
                {(mode !== "requisition-only") && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                      <MedicineBoxOutlined className="text-2xl text-white" />
                    </div>
                    <span className="font-bold text-blue-800 text-lg">
                      Prescription Fax
                    </span>
                  </div>
                  {selectedPharmacy && (
                    <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <ShopOutlined className="text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm mb-1">
                            {selectedPharmacy.name}
                          </p>
                          <div className="flex items-start gap-1">
                            <EnvironmentOutlined className="text-blue-500 text-xs mt-0.5" />
                            <p className="text-xs text-gray-600">
                              {selectedPharmacy.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      ✓ {prescriptionMessage}
                    </p>
                  </div>
                </div>
                )}
                {(mode !== "prescription-only") && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <ExperimentOutlined className="text-2xl text-white" />
                    </div>
                    <span className="font-bold text-green-800 text-lg">
                      Requisition Fax
                    </span>
                  </div>
                  {selectedLab && (
                    <div className="bg-white rounded-lg p-3 mb-3 border border-green-100">
                      <div className="flex items-start gap-2">
                        <ShopOutlined className="text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm mb-1">
                            {selectedLab.name}
                          </p>
                          <div className="flex items-start gap-1">
                            <EnvironmentOutlined className="text-green-500 text-xs mt-0.5" />
                            <p className="text-xs text-gray-600">
                              {selectedLab.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      ✓ {requisitionMessage}
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
          }
        />
      )}

      {/* Fax Sending Interface */}
      {!allFaxesSent && (
        <div className="space-y-6 flex-1">
          {/* Individual Fax Cards */}
          <div className={`grid ${mode === "dual" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-6`}>
            {/* Prescription Fax Card */}
            {(mode !== "requisition-only") && (<div
              className={`shadow-lg transition-all duration-300 rounded-3xl p-6 ${
                prescriptionFaxSent
                  ? "border-2 border-green-400 bg-green-50"
                  : "border-2 border-blue-300 hover:shadow-xl bg-white"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3 py-4 h-full">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    prescriptionFaxSent
                      ? "bg-green-500 animate-pulse"
                      : "bg-gradient-to-br from-blue-400 to-blue-600"
                  }`}
                >
                  {prescriptionFaxSent ? (
                    <CheckCircleOutlined className="text-3xl text-white" />
                  ) : (
                    <MedicineBoxOutlined className="text-3xl text-white" />
                  )}
                </div>

                <div className="w-full flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <MedicineBoxOutlined className="text-blue-600" />
                    Prescription Fax
                  </h3>

                  {selectedPharmacy ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-left border border-blue-100">
                      <div className="flex items-start gap-2">
                        <ShopOutlined className="text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm mb-1">
                            {selectedPharmacy.name}
                          </p>
                          <div className="flex items-start gap-1">
                            <EnvironmentOutlined className="text-blue-500 mt-0.5 text-xs" />
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {selectedPharmacy.address}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* <Tag color="blue" className="mt-2">
                        Pharmacy ID: {selectedPharmacy.pharmacy_id}
                      </Tag> */}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No pharmacy selected
                    </p>
                  )}

                  {prescriptionId && (
                    <div className="mt-2">
                      <Tag color="cyan">Prescription ID: {prescriptionId}</Tag>
                    </div>
                  )}
                </div>

                {prescriptionFaxSent ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 w-full text-left">
                    <div className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-600 text-base mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-green-800 font-medium">
                          Fax sent successfully
                        </p>
                        {prescriptionMessage && (
                          <p className="text-xs text-gray-600 mt-1">
                            {prescriptionMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="primary"
                    icon={
                      prescriptionLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <SendOutlined />
                      )
                    }
                    onClick={handleSendPrescriptionFax}
                    loading={prescriptionLoading}
                    disabled={!prescriptionId}
                    className="h-10 px-8 font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                      border: "none",
                    }}
                  >
                    Send Fax
                  </Button>
                )}
              </div>
            </div>)}

            {/* Requisition Fax Card */}
            {(mode !== "prescription-only") && (<div
              className={`shadow-lg transition-all duration-300 rounded-3xl p-6 ${
                requisitionFaxSent
                  ? "border-2 border-green-400 bg-green-50"
                  : "border-2 border-green-300 hover:shadow-xl bg-white"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3 py-4 h-full">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    requisitionFaxSent
                      ? "bg-green-500 animate-pulse"
                      : "bg-gradient-to-br from-green-400 to-green-600"
                  }`}
                >
                  {requisitionFaxSent ? (
                    <CheckCircleOutlined className="text-3xl text-white" />
                  ) : (
                    <ExperimentOutlined className="text-3xl text-white" />
                  )}
                </div>

                <div className="w-full flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <ExperimentOutlined className="text-green-600" />
                    Requisition Fax
                  </h3>

                  {selectedLab ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-left border border-green-100">
                      <div className="flex items-start gap-2">
                        <ShopOutlined className="text-green-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm mb-1">
                            {selectedLab.name}
                          </p>
                          <div className="flex items-start gap-1">
                            <EnvironmentOutlined className="text-green-500 mt-0.5 text-xs" />
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {selectedLab.address}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* <Tag color="green" className="mt-2">
                        Lab ID: {selectedLab.lab_id}
                      </Tag> */}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No lab selected</p>
                  )}

                  {requisitionId && (
                    <div className="mt-2">
                      <Tag color="lime">Requisition ID: {requisitionId}</Tag>
                    </div>
                  )}
                </div>

                {requisitionFaxSent ? (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 w-full text-left">
                    <div className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-600 text-base mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-green-800 font-medium">
                          Fax sent successfully
                        </p>
                        {requisitionMessage && (
                          <p className="text-xs text-gray-600 mt-1">
                            {requisitionMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="primary"
                    icon={
                      requisitionLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <SendOutlined />
                      )
                    }
                    onClick={handleSendRequisitionFax}
                    loading={requisitionLoading}
                    disabled={!requisitionId}
                    className="h-10 px-8 font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                      border: "none",
                    }}
                  >
                    Send Fax
                  </Button>
                )}
              </div>
            </div>)}
          </div>

          {/* Warning if IDs are missing */}
          {(mode === "dual" && (!prescriptionId || !requisitionId)) && (
            <Alert
              message="Missing Order Information"
              description="You can sending faxes individually."
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FaxSender;
