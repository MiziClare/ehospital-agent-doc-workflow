import React, { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, DatePicker, message } from "antd";
import dayjs from "dayjs";
import {
  createEmptyPrescription,
  completePrescription,
  updatePrescriptionById,
  getPrescriptionById,
} from "../apis/patient";
import { usePrescriptionWorkflowStore, useOrderSubmittedStore } from "../store";

interface Props {
  patientId: number;
}

const ManualPrescriptionEditor: React.FC<Props> = ({ patientId }) => {
  const { prescriptionId, setPrescriptionId, setHasGeneratedPrescription } = usePrescriptionWorkflowStore();
  const { setOrderSubmitted } = useOrderSubmittedStore();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setOrderSubmitted(false);
    const init = async () => {
      try {
        setLoading(true);
        const created = await createEmptyPrescription({ patient_id: patientId });
        const id = created?.prescription_id ?? created?.prescription?.prescription_id;
        if (!id) throw new Error("Failed to create empty prescription");
        setPrescriptionId(String(id));
        setHasGeneratedPrescription(true);
        // Load latest record to populate
        const rec = await getPrescriptionById(String(id));
        const p = rec.prescription ?? rec;
        form.setFieldsValue({
          medication_name: p.medication_name || "",
          medication_strength: p.medication_strength || "",
          medication_form: p.medication_form || "",
          dosage_instructions: p.dosage_instructions || "",
          quantity: p.quantity ?? 0,
          refills_allowed: p.refills_allowed ?? 0,
          expiry_date: p.expiry_date ? dayjs(p.expiry_date) : null,
          status: p.status || "",
          notes: p.notes || "",
        });
      } catch (e: any) {
        message.error(e.message || "Failed to initialize prescription");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleSave = async () => {
    try {
      if (!prescriptionId) return;
      const values = form.getFieldsValue();
      const payload = {
        medication_name: values.medication_name,
        medication_strength: values.medication_strength,
        medication_form: values.medication_form,
        dosage_instructions: values.dosage_instructions,
        quantity: Number(values.quantity || 0),
        refills_allowed: Number(values.refills_allowed || 0),
        expiry_date: values.expiry_date ? values.expiry_date.format("YYYY-MM-DD") : "",
        status: values.status,
        notes: values.notes,
      };
      setLoading(true);
      await updatePrescriptionById(prescriptionId, payload);
      message.success("Prescription saved");
    } catch (e: any) {
      message.error(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleAiAssist = async () => {
    try {
      if (!prescriptionId) return;
      setAiLoading(true);
      const res = await completePrescription({ patient_id: patientId, prescription_id: prescriptionId });
      const updated = res.prescription ?? res;
      form.setFieldsValue({
        medication_name: updated.medication_name || "",
        medication_strength: updated.medication_strength || "",
        medication_form: updated.medication_form || "",
        dosage_instructions: updated.dosage_instructions || "",
        quantity: updated.quantity ?? 0,
        refills_allowed: updated.refills_allowed ?? 0,
        expiry_date: updated.expiry_date ? dayjs(updated.expiry_date) : null,
        status: updated.status || "",
        notes: updated.notes || "",
      });
      message.success("AI has completed the form");
    } catch (e: any) {
      message.error(e.message || "AI assist failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" className="premium-button" onClick={handleAiAssist} loading={aiLoading}
          style={{ background: "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)", border: "none" }}>
          AI Complete Form
        </Button>
      </div>
      <Form form={form} layout="vertical" disabled={loading}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form.Item name="medication_name" label="Medication Name">
            <Input placeholder="e.g., Amoxicillin" />
          </Form.Item>
          <Form.Item name="medication_strength" label="Medication Strength">
            <Input placeholder="e.g., 500mg" />
          </Form.Item>
          <Form.Item name="medication_form" label="Medication Form">
            <Input placeholder="e.g., Tablet" />
          </Form.Item>
          <Form.Item name="dosage_instructions" label="Dosage Instructions">
            <Input.TextArea rows={3} placeholder="e.g., Take 1 tablet 3 times daily with food" />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="refills_allowed" label="Refills Allowed">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="expiry_date" label="Expiry Date">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Input placeholder="e.g., active" />
          </Form.Item>
          <Form.Item name="notes" label="Notes" className="md:col-span-2">
            <Input.TextArea rows={4} placeholder="Additional notes" />
          </Form.Item>
        </div>
        <div className="flex justify-end mt-4">
          <Button type="primary" onClick={handleSave} loading={loading} className="premium-button"
            style={{ background: "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)", border: "none" }}>
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ManualPrescriptionEditor;
