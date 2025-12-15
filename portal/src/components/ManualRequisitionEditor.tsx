import React, { useEffect, useState } from "react";
import { Button, Form, Input, DatePicker, InputNumber, message } from "antd";
import dayjs from "dayjs";
import {
  createEmptyRequisition,
  completeRequisition,
  updateRequisitionById,
  getRequisitionById,
} from "../apis/patient";
import { useRequisitionWorkflowStore, useOrderSubmittedStore } from "../store";

interface Props {
  patientId: number;
}

const ManualRequisitionEditor: React.FC<Props> = ({ patientId }) => {
  const { requisitionId, setRequisitionId, setHasGeneratedRequisition } = useRequisitionWorkflowStore();
  const { setOrderSubmitted } = useOrderSubmittedStore();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    setOrderSubmitted(false);
    const init = async () => {
      try {
        setLoading(true);
        const created = await createEmptyRequisition({ patient_id: patientId });
        const id = created?.requisition_id ?? created?.requisition?.requisition_id;
        if (!id) throw new Error("Failed to create empty requisition");
        setRequisitionId(String(id));
        setHasGeneratedRequisition(true);
        const rec = await getRequisitionById(String(id));
        const r = rec.requisition ?? rec;
        form.setFieldsValue({
          department: r.department || "",
          test_type: r.test_type || "",
          test_code: r.test_code || "",
          clinical_info: r.clinical_info || "",
          date_requested: r.date_requested ? dayjs(r.date_requested) : dayjs(),
          priority: r.priority || "",
          status: r.status || "",
          result_date: r.result_date ? dayjs(r.result_date) : null,
          notes: r.notes || "",
        });
      } catch (e: any) {
        message.error(e.message || "Failed to initialize requisition");
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleSave = async () => {
    try {
      if (!requisitionId) return;
      const values = form.getFieldsValue();
      const payload = {
        department: values.department,
        test_type: values.test_type,
        test_code: values.test_code || null,
        clinical_info: values.clinical_info || null,
        priority: values.priority,
        status: values.status,
        result_date: values.result_date ? values.result_date.toISOString() : null,
        notes: values.notes,
      };
      setLoading(true);
      await updateRequisitionById(requisitionId, payload);
      message.success("Requisition saved");
    } catch (e: any) {
      message.error(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleAiAssist = async () => {
    try {
      if (!requisitionId) return;
      setAiLoading(true);
      const res = await completeRequisition({ patient_id: patientId, requisition_id: requisitionId });
      const updated = res.requisition ?? res;
      form.setFieldsValue({
        department: updated.department || "",
        test_type: updated.test_type || "",
        test_code: updated.test_code || "",
        clinical_info: updated.clinical_info || "",
        date_requested: updated.date_requested ? dayjs(updated.date_requested) : dayjs(),
        priority: updated.priority || "",
        status: updated.status || "",
        result_date: updated.result_date ? dayjs(updated.result_date) : null,
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
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g., General Medicine" />
          </Form.Item>
          <Form.Item name="test_type" label="Test Type">
            <Input placeholder="e.g., Laboratory Test" />
          </Form.Item>
          <Form.Item name="test_code" label="Test Code">
            <Input placeholder="Optional" />
          </Form.Item>
          <Form.Item name="clinical_info" label="Clinical Info">
            <Input.TextArea rows={3} placeholder="Indications / details" />
          </Form.Item>
          <Form.Item name="date_requested" label="Date Requested">
            <DatePicker showTime className="w-full" />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Input placeholder="e.g., Routine" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Input placeholder="e.g., Pending" />
          </Form.Item>
          <Form.Item name="result_date" label="Result Date">
            <DatePicker showTime className="w-full" />
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

export default ManualRequisitionEditor;
