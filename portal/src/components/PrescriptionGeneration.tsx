import { useState } from "react";
import { Button, Card, message, Spin, Form, Input, InputNumber, DatePicker, Select } from "antd";
import { MedicineBoxOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { createEmptyPrescription, completePrescription } from "../apis/patient";
import { usePrescriptionWorkflowStore } from "../store";

interface PrescriptionGenerationProps {
  patientId: number;
}

const PrescriptionGeneration: React.FC<PrescriptionGenerationProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(false);
  const [prescriptionSummary, setPrescriptionSummary] = useState<any>(null);
  const { setPrescriptionId, setHasGeneratedPrescription } = usePrescriptionWorkflowStore();

  const generate = async () => {
    if (!patientId) {
      message.warning("Missing patient_id");
      return;
    }
    setLoading(true);
    try {
      const created = await createEmptyPrescription({ patient_id: patientId });
      const pid = created?.prescription_id || created?.prescription?.prescription_id;
      if (!pid) throw new Error("Failed to retrieve prescription_id");
      setPrescriptionId(pid);
      const completed = await completePrescription({ patient_id: patientId, prescription_id: pid });
      setHasGeneratedPrescription(true);
      setPrescriptionSummary(completed?.prescription || completed);
      message.success("Prescription generated and completed successfully");
    } catch (e) {
      console.error(e);
      message.error("Failed to generate prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Auto Prescription Generation</h2>
        <p className="text-slate-500">Create an empty prescription, then complete it via workflow.</p>
      </div>
      <div className="flex justify-center mb-6">
        <Button type="primary" icon={<MedicineBoxOutlined />} onClick={generate} disabled={loading}>
          Generate Prescription
        </Button>
      </div>
      {loading && (
        <div className="flex justify-center py-8"><Spin /></div>
      )}
      {prescriptionSummary && (
        <Card title="Prescription Summary" bordered className="bg-white rounded-3xl shadow-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleOutlined className="text-green-600" />
            <span className="font-semibold">Prescription ID: {prescriptionSummary.prescription_id}</span>
          </div>
          <Form layout="vertical">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
              <Form.Item label={<span className="text-blue-800 font-semibold">Prescription ID</span>}>
                <Input value={prescriptionSummary.prescription_id} readOnly className="font-semibold text-slate-800" />
              </Form.Item>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-blue-200 pb-2">Medication Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Medication Name</span>}>
                  <Input value={prescriptionSummary.medication_name} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Status</span>}>
                  <Input value={prescriptionSummary.status} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Strength</span>}>
                  <Input value={prescriptionSummary.medication_strength} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Form</span>}>
                  <Input value={prescriptionSummary.medication_form} readOnly className="font-semibold text-slate-800" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Quantity</span>}>
                  <Input className="w-full font-semibold text-slate-800" value={String(prescriptionSummary.quantity ?? "")} readOnly />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Refills Allowed</span>}>
                  <Input className="w-full font-semibold text-slate-800" value={String(prescriptionSummary.refills_allowed ?? "")} readOnly />
                </Form.Item>
              </div>
              <Form.Item label={<span className="font-medium">Dosage Instructions</span>}>
                <Input.TextArea rows={3} value={prescriptionSummary.dosage_instructions} readOnly className="text-slate-800" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label={<span className="font-medium">Date Prescribed</span>}>
                  <Input className="w-full font-semibold text-slate-800" readOnly value={prescriptionSummary.date_prescribed ?? ""} />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Expiry Date</span>}>
                  <Input className="w-full font-semibold text-slate-800" readOnly value={prescriptionSummary.expiry_date ?? ""} />
                </Form.Item>
              </div>
              <Form.Item label={<span className="font-medium">Notes</span>}>
                <Input.TextArea rows={2} value={prescriptionSummary.notes} readOnly className="text-slate-800" />
              </Form.Item>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default PrescriptionGeneration;
