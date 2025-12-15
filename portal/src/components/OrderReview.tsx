import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  InputNumber,
  DatePicker,
  Select,
} from "antd";
import {
  MedicineBoxOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  getPrescriptionById,
  getRequisitionById,
  updatePrescriptionById,
  updateRequisitionById,
  setPrescriptionPharmacy,
  setRequisitionLab,
} from "../apis/patient";
import {
  useSelectedPharmacyStore,
  useSelectedLabStore,
  useGeneratedOrdersStore,
  useOrderSubmittedStore,
  usePrescriptionWorkflowStore,
  useRequisitionWorkflowStore,
} from "../store";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

const OrderReview: React.FC<{ mode?: "dual" | "prescription-only" | "requisition-only" }> = ({ mode = "dual" }) => {
  const [initialLoading, setInitialLoading] = useState(false);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [requisitionLoading, setRequisitionLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isPrescriptionChanged, setIsPrescriptionChanged] = useState(false);
  const [isRequisitionChanged, setIsRequisitionChanged] = useState(false);
  const [prescriptionForm] = Form.useForm();
  const [requisitionForm] = Form.useForm();
  const { selectedPharmacy } = useSelectedPharmacyStore();
  const { selectedLab } = useSelectedLabStore();
  const { prescriptionId: dualPrescriptionId, requisitionId: dualRequisitionId } = useGeneratedOrdersStore();
  const { prescriptionId: singlePrescriptionId } = usePrescriptionWorkflowStore();
  const { requisitionId: singleRequisitionId } = useRequisitionWorkflowStore();
  const { setOrderSubmitted, isOrderSubmitted } = useOrderSubmittedStore();

  const fetchOrderData = async () => {
    // Resolve IDs based on mode
    const prescriptionId = mode !== "requisition-only" ? (dualPrescriptionId || singlePrescriptionId) : null;
    const requisitionId = mode !== "prescription-only" ? (dualRequisitionId || singleRequisitionId) : null;

    if ((mode === "dual" && (!prescriptionId || !requisitionId)) || (mode === "prescription-only" && !prescriptionId) || (mode === "requisition-only" && !requisitionId)) {
      message.warning("Please generate orders first in Step 2");
      return;
    }

    setInitialLoading(true);
    try {
      const presPromise = prescriptionId ? getPrescriptionById(prescriptionId) : Promise.resolve(null);
      const reqPromise = requisitionId ? getRequisitionById(requisitionId) : Promise.resolve(null);
      const [prescriptionRes, requisitionRes] = await Promise.all([presPromise, reqPromise]);

      // Set form values with store data override for pharmacy/lab
      if (prescriptionRes) {
        prescriptionForm.setFieldsValue({
          prescription_id: prescriptionRes.prescription.prescription_id,
          ...prescriptionRes.prescription,
          date_prescribed: dayjs(prescriptionRes.prescription.date_prescribed),
          expiry_date: dayjs(prescriptionRes.prescription.expiry_date),
          pharmacy_name:
            selectedPharmacy?.name || prescriptionRes.pharmacy_name,
          pharmacy_address:
            selectedPharmacy?.address || prescriptionRes.pharmacy_address,
        });
      }
      if (requisitionRes) {
        requisitionForm.setFieldsValue({
          requisition_id: requisitionRes.requisition.requisition_id,
          ...requisitionRes.requisition,
          date_requested: dayjs(requisitionRes.requisition.date_requested),
          lab_name: selectedLab?.name || requisitionRes.lab_name,
          lab_address: selectedLab?.address || requisitionRes.lab_address,
        });
      }
    } catch (error) {
      message.error("Failed to load order data");
      console.error("Error loading order data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // Ensure we start with submit button visible when entering Review step
    setOrderSubmitted(false);
    fetchOrderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleUpdatePrescription = async () => {
    try {
      const prescriptionValues = await prescriptionForm.validateFields();
      const prescriptionId = dualPrescriptionId || singlePrescriptionId;
      if (!prescriptionId) {
        message.error("Prescription ID not found.");
        return;
      }

      setPrescriptionLoading(true);

      // Prepare prescription update data
      const prescriptionUpdateData = {
        status: prescriptionValues.status,
        notes: prescriptionValues.notes,
        medication_name: prescriptionValues.medication_name,
        medication_strength: prescriptionValues.medication_strength,
        medication_form: prescriptionValues.medication_form,
        dosage_instructions: prescriptionValues.dosage_instructions,
        quantity: prescriptionValues.quantity,
        refills_allowed: prescriptionValues.refills_allowed,
        expiry_date: prescriptionValues.expiry_date
          ? prescriptionValues.expiry_date.format("YYYY-MM-DD")
          : undefined,
      };

      await updatePrescriptionById(prescriptionId, prescriptionUpdateData);
      message.success("Prescription updated successfully!");
      setIsPrescriptionChanged(false); // Reset change state after successful update
    } catch (error) {
      message.error("Failed to update prescription. Please try again.");
      console.error("Update prescription failed:", error);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleUpdateRequisition = async () => {
    try {
      const requisitionValues = await requisitionForm.validateFields();
      const requisitionId = dualRequisitionId || singleRequisitionId;
      if (!requisitionId) {
        message.error("Requisition ID not found.");
        return;
      }

      setRequisitionLoading(true);

      // Prepare requisition update data
      const requisitionUpdateData = {
        status: requisitionValues.status,
        notes: requisitionValues.notes,
        department: requisitionValues.department,
        test_type: requisitionValues.test_type,
        test_code: requisitionValues.test_code,
        clinical_info: requisitionValues.clinical_info,
        priority: requisitionValues.priority,
      };

      await updateRequisitionById(requisitionId, requisitionUpdateData);
      message.success("Requisition updated successfully!");
      setIsRequisitionChanged(false); // Reset change state after successful update
    } catch (error) {
      message.error("Failed to update requisition. Please try again.");
      console.error("Update requisition failed:", error);
    } finally {
      setRequisitionLoading(false);
    }
  };

  const handleSubmitOrders = async () => {
    try {
      // Check if there are unsaved changes
      if (isPrescriptionChanged || isRequisitionChanged) {
        message.warning({
          content:
            "Please save your changes before submitting orders. Click the Update buttons in the form headers to save your changes.",
          duration: 5,
        });
        return;
      }

      // Validate both forms
      const presValues = mode !== "requisition-only" ? await prescriptionForm.validateFields() : null;
      const reqValues = mode !== "prescription-only" ? await requisitionForm.validateFields() : null;
      const prescriptionId = mode !== "requisition-only" ? (dualPrescriptionId || singlePrescriptionId) : null;
      const requisitionId = mode !== "prescription-only" ? (dualRequisitionId || singleRequisitionId) : null;
      if ((mode === "dual" && (!prescriptionId || !requisitionId)) || (mode === "prescription-only" && !prescriptionId) || (mode === "requisition-only" && !requisitionId)) {
        message.error("Order IDs not found. Please generate orders first.");
        return;
      }

      setSubmitLoading(true);

      // Prepare prescription update data (only editable fields)
      const prescriptionUpdateData = presValues
        ? {
            status: presValues.status,
            notes: presValues.notes,
            medication_name: presValues.medication_name,
            medication_strength: presValues.medication_strength,
            medication_form: presValues.medication_form,
            dosage_instructions: presValues.dosage_instructions,
            quantity: presValues.quantity,
            refills_allowed: presValues.refills_allowed,
            expiry_date: presValues.expiry_date
              ? presValues.expiry_date.format("YYYY-MM-DD")
              : undefined,
          }
        : null;

      // Prepare requisition update data (only editable fields)
      const requisitionUpdateData = reqValues
        ? {
            status: reqValues.status,
            notes: reqValues.notes,
            department: reqValues.department,
            test_type: reqValues.test_type,
            test_code: reqValues.test_code,
            clinical_info: reqValues.clinical_info,
            priority: reqValues.priority,
          }
        : null;

      // Prepare API calls array
      const apiCalls: Promise<any>[] = [];
      if (prescriptionId && prescriptionUpdateData) {
        apiCalls.push(updatePrescriptionById(prescriptionId, prescriptionUpdateData));
      }
      if (requisitionId && requisitionUpdateData) {
        apiCalls.push(updateRequisitionById(requisitionId, requisitionUpdateData));
      }

      // Add pharmacy ID if selected
      if (prescriptionId && selectedPharmacy?.pharmacy_id) {
        apiCalls.push(setPrescriptionPharmacy(prescriptionId, selectedPharmacy.pharmacy_id));
      }

      // Add lab ID if selected
      if (requisitionId && selectedLab?.lab_id) {
        apiCalls.push(setRequisitionLab(requisitionId, selectedLab.lab_id));
      }

      // Call all APIs
      await Promise.all(apiCalls);

      setOrderSubmitted(true);
      message.success(
        "Orders submitted successfully! You can now proceed to the next step."
      );
    } catch (error) {
      message.error("Failed to submit orders. Please try again.");
      console.error("Validation or submission failed:", error);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Review & Confirm Orders
          </h1>
          <p className="text-gray-600 text-lg">
            Please review and confirm order details
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prescription Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
               style={mode === "requisition-only" ? { pointerEvents: "none", opacity: 0.4 } : undefined}>
            {/* Card Header - Sticky */}
            <div
              id="prescription-header"
              className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 shadow-sm py-4 px-6 flex items-center justify-between gap-4 rounded-t-3xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                  <MedicineBoxOutlined className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 m-0">
                  Prescription
                </h2>
              </div>

              {/* Update Button in Header */}
              <Button
                type="primary"
                size="middle"
                icon={<CheckCircleOutlined />}
                onClick={handleUpdatePrescription}
                loading={prescriptionLoading}
                disabled={mode === "requisition-only" || !isPrescriptionChanged}
                className={`
                  font-bold shadow-md border-none transition-all duration-300 rounded-xl px-6
                  ${
                    isPrescriptionChanged
                      ? "bg-amber-400 hover:bg-amber-500 text-slate-900 scale-105 animate-pulse"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200 opacity-50 cursor-not-allowed"
                  }
                `}
              >
                {isPrescriptionChanged ? "Save Changes" : "Update"}
              </Button>
            </div>

            {/* Card Body */}
            <div className="p-6 bg-white rounded-b-3xl">
              {mode !== "requisition-only" && (
              <Form
                form={prescriptionForm}
                layout="vertical"
                className="space-y-4"
                onValuesChange={() => setIsPrescriptionChanged(true)}
              >
                {/* ID Section */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <Form.Item
                    label={
                      <span className="text-blue-800 font-semibold">
                        Prescription ID
                      </span>
                    }
                    name="prescription_id"
                    className="mb-0"
                  >
                    <Input
                      disabled
                      className="font-mono text-lg"
                      style={{
                        fontWeight: "bold",
                        color: "#1e40af",
                        backgroundColor: "#dbeafe",
                        border: "2px solid #3b82f6",
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Medication Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-200 pb-2">
                    Medication Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={
                        <span className="font-medium">Medication Name</span>
                      }
                      name="medication_name"
                    >
                      <Input
                        className="rounded-lg"
                        placeholder="Enter medication name"
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="font-medium">Status</span>}
                      name="status"
                    >
                      <Select className="rounded-lg">
                        <Option value="active">Active</Option>
                        <Option value="pending">Pending</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="font-medium">Strength</span>}
                      name="medication_strength"
                    >
                      <Input className="rounded-lg" placeholder="e.g., 500mg" />
                    </Form.Item>
                    <Form.Item
                      label={<span className="font-medium">Form</span>}
                      name="medication_form"
                    >
                      <Input
                        className="rounded-lg"
                        placeholder="e.g., Tablet"
                      />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="font-medium">Quantity</span>}
                      name="quantity"
                    >
                      <InputNumber
                        min={1}
                        className="w-full rounded-lg"
                        placeholder="0"
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span className="font-medium">Refills Allowed</span>
                      }
                      name="refills_allowed"
                    >
                      <InputNumber
                        min={0}
                        className="w-full rounded-lg"
                        placeholder="0"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={
                      <span className="font-medium">Dosage Instructions</span>
                    }
                    name="dosage_instructions"
                  >
                    <TextArea
                      rows={3}
                      className="rounded-lg"
                      placeholder="Enter dosage instructions..."
                    />
                  </Form.Item>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={
                        <span className="font-medium">Date Prescribed</span>
                      }
                      name="date_prescribed"
                    >
                      <DatePicker
                        className="w-full rounded-lg"
                        format="YYYY-MM-DD"
                        disabled
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="font-medium">Expiry Date</span>}
                      name="expiry_date"
                    >
                      <DatePicker
                        className="w-full rounded-lg"
                        format="YYYY-MM-DD"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={<span className="font-medium">Notes</span>}
                    name="notes"
                  >
                    <TextArea
                      rows={2}
                      className="rounded-lg"
                      placeholder="Additional notes..."
                    />
                  </Form.Item>
                </div>

                {/* Pharmacy Information Section */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-300">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <MedicineBoxOutlined />
                    Selected Pharmacy
                  </h3>
                  <Form.Item
                    label={
                      <span className="font-medium text-blue-800">
                        Pharmacy Name
                      </span>
                    }
                    name="pharmacy_name"
                    className="mb-3"
                  >
                    <Input
                      disabled
                      className="rounded-lg"
                      style={{
                        color: "#1e40af",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                        border: "2px solid #3b82f6",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-blue-800">Address</span>
                    }
                    name="pharmacy_address"
                    className="mb-0"
                  >
                    <Input
                      disabled
                      className="rounded-lg"
                      style={{
                        color: "#1e40af",
                        backgroundColor: "#ffffff",
                        border: "2px solid #3b82f6",
                      }}
                    />
                  </Form.Item>
                </div>
              </Form>
              )}
            </div>
          </div>

          {/* Requisition Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300 group flex flex-col h-full"
               style={mode === "prescription-only" ? { pointerEvents: "none", opacity: 0.4 } : undefined}>
            {/* Card Header - Sticky */}
            <div
              id="requisition-header"
              className="sticky top-0 z-10 bg-gradient-to-r from-green-50 to-white border-b border-slate-100 shadow-sm py-4 px-6 flex items-center justify-between gap-4 rounded-t-3xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                  <ExperimentOutlined className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 m-0">
                  Lab Requisition
                </h2>
              </div>

              {/* Update Button in Header */}
              <Button
                type="primary"
                size="middle"
                icon={<CheckCircleOutlined />}
                onClick={handleUpdateRequisition}
                loading={requisitionLoading}
                disabled={mode === "prescription-only" || !isRequisitionChanged}
                className={`
                  font-bold shadow-md border-none transition-all duration-300 rounded-xl px-6
                  ${
                    isRequisitionChanged
                      ? "bg-amber-400 hover:bg-amber-500 text-slate-900 scale-105 animate-pulse"
                      : "bg-green-100 text-green-600 hover:bg-green-200 opacity-50 cursor-not-allowed"
                  }
                `}
              >
                {isRequisitionChanged ? "Save Changes" : "Update"}
              </Button>
            </div>

            {/* Card Body */}
            <div className="p-6 bg-white rounded-b-3xl">
              {mode !== "prescription-only" && (
              <Form
                form={requisitionForm}
                layout="vertical"
                className="space-y-4"
                onValuesChange={() => setIsRequisitionChanged(true)}
              >
                {/* ID Section */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <Form.Item
                    label={
                      <span className="text-green-800 font-semibold">
                        Requisition ID
                      </span>
                    }
                    name="requisition_id"
                    className="mb-0"
                  >
                    <Input
                      disabled
                      className="font-mono text-lg"
                      style={{
                        fontWeight: "bold",
                        color: "#16a34a",
                        backgroundColor: "#dcfce7",
                        border: "2px solid #22c55e",
                      }}
                    />
                  </Form.Item>
                </div>

                {/* Test Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-green-200 pb-2">
                    Test Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="font-medium">Department</span>}
                      name="department"
                    >
                      <Input
                        className="rounded-lg"
                        placeholder="Enter department"
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="font-medium">Status</span>}
                      name="status"
                    >
                      <Select className="rounded-lg">
                        <Option value="pending">Pending</Option>
                        <Option value="in_progress">In Progress</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="cancelled">Cancelled</Option>
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="font-medium">Test Type</span>}
                      name="test_type"
                    >
                      <Input
                        className="rounded-lg"
                        placeholder="Enter test type"
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span className="font-medium">Test Code</span>}
                      name="test_code"
                    >
                      <Input
                        className="rounded-lg"
                        placeholder="Enter test code"
                      />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      label={<span className="font-medium">Priority</span>}
                      name="priority"
                    >
                      <Select className="rounded-lg">
                        <Option value="routine">Routine</Option>
                        <Option value="urgent">Urgent</Option>
                        <Option value="stat">STAT</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      label={
                        <span className="font-medium">Date Requested</span>
                      }
                      name="date_requested"
                    >
                      <DatePicker
                        className="w-full rounded-lg"
                        format="YYYY-MM-DD"
                        disabled
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    label={
                      <span className="font-medium">Clinical Information</span>
                    }
                    name="clinical_info"
                  >
                    <TextArea
                      rows={3}
                      className="rounded-lg"
                      placeholder="Enter clinical information..."
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span className="font-medium">Notes</span>}
                    name="notes"
                  >
                    <TextArea
                      rows={2}
                      className="rounded-lg"
                      placeholder="Additional notes..."
                    />
                  </Form.Item>
                </div>

                {/* Lab Information Section */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-300">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <ExperimentOutlined />
                    Selected Laboratory
                  </h3>
                  <Form.Item
                    label={
                      <span className="font-medium text-green-800">
                        Lab Name
                      </span>
                    }
                    name="lab_name"
                    className="mb-3"
                  >
                    <Input
                      disabled
                      className="rounded-lg"
                      style={{
                        color: "#16a34a",
                        fontWeight: "600",
                        backgroundColor: "#ffffff",
                        border: "2px solid #22c55e",
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span className="font-medium text-green-800">
                        Address
                      </span>
                    }
                    name="lab_address"
                    className="mb-0"
                  >
                    <Input
                      disabled
                      className="rounded-lg"
                      style={{
                        color: "#16a34a",
                        backgroundColor: "#ffffff",
                        border: "2px solid #22c55e",
                      }}
                    />
                  </Form.Item>
                </div>
              </Form>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-8">
          {isOrderSubmitted ? (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircleOutlined className="text-4xl text-green-600" />
                <div>
                  <p className="text-xl font-bold text-green-800 mb-1">
                    Orders Submitted Successfully!
                  </p>
                  <p className="text-sm text-green-600">
                    Your prescription and requisition have been submitted. You
                    can now proceed to the next step.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 border-none h-14 px-12 text-xl font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 rounded-xl"
              onClick={handleSubmitOrders}
              loading={submitLoading}
            >
              Submit Orders
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderReview;
