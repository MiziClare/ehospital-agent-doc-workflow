import { useState } from "react";
import { Button, Card, message, Spin, Form, Input, DatePicker, Select } from "antd";
import { ExperimentOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { createEmptyRequisition, completeRequisition } from "../apis/patient";
import { useRequisitionWorkflowStore } from "../store";

interface RequisitionGenerationProps {
  patientId: number;
}

const RequisitionGeneration: React.FC<RequisitionGenerationProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(false);
  const [requisitionSummary, setRequisitionSummary] = useState<any>(null);
  const { setRequisitionId, setHasGeneratedRequisition } = useRequisitionWorkflowStore();

  const generate = async () => {
    if (!patientId) {
      message.warning("Missing patient_id");
      return;
    }
    setLoading(true);
    try {
      const created = await createEmptyRequisition({ patient_id: patientId });
      const rid = created?.requisition_id || created?.requisition?.requisition_id;
      if (!rid) throw new Error("Failed to retrieve requisition_id");
      setRequisitionId(rid);
      const completed = await completeRequisition({ patient_id: patientId, requisition_id: rid });
      setHasGeneratedRequisition(true);
      setRequisitionSummary(completed?.requisition || completed);
      message.success("Requisition generated and completed successfully");
    } catch (e) {
      console.error(e);
      message.error("Failed to generate requisition. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Auto Requisition Generation</h2>
        <p className="text-slate-500">Create an empty requisition, then complete it via workflow.</p>
      </div>
      <div className="flex justify-center mb-6">
        <Button type="primary" icon={<ExperimentOutlined />} onClick={generate} disabled={loading}>
          Generate Requisition
        </Button>
      </div>
      {loading && (
        <div className="flex justify-center py-8"><Spin /></div>
      )}
      {requisitionSummary && (
        <Card title="Requisition Summary" bordered className="bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleOutlined className="text-green-600" />
            <span className="font-semibold">Requisition ID: {requisitionSummary.requisition_id}</span>
          </div>
          <Form layout="vertical">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
              <Form.Item label={<span className="text-green-800 font-semibold">Requisition ID</span>}>
                <Input value={requisitionSummary.requisition_id} readOnly className="font-semibold text-slate-800" />
              </Form.Item>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-green-200 pb-2">Test Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Department</span>}>
                  <Input value={requisitionSummary.department} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Status</span>}>
                  <Input value={requisitionSummary.status} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Test Type</span>}>
                  <Input value={requisitionSummary.test_type} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Test Code</span>}>
                  <Input value={requisitionSummary.test_code} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Priority</span>}>
                  <Input value={requisitionSummary.priority} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Date Requested</span>}>
                  <Input className="w-full font-semibold text-slate-800" readOnly value={requisitionSummary.date_requested ?? ""} />
                </Form.Item>
              </div>
              <Form.Item label={<span className="font-medium">Clinical Information</span>}>
                <Input.TextArea rows={3} value={requisitionSummary.clinical_info} readOnly className="text-slate-800" />
              </Form.Item>
              <Form.Item label={<span className="font-medium">Notes</span>}>
                <Input.TextArea rows={2} value={requisitionSummary.notes} readOnly className="text-slate-800" />
              </Form.Item>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default RequisitionGeneration;
