export interface PrescriptionOrder {
  patient_id: number;
  prescriber_id: string;
  medication_name: string;
  medication_strength: string;
  medication_form: string;
  dosage_instructions: string;
  quantity: number;
  refills_allowed: number;
  date_prescribed: string;
  expiry_date: string;
  status: string;
  notes: string;
  pharmacy_id: number | null;
  prescription_id: string;
}

export interface RequisitionOrder {
  patient_id: number;
  lab_id: number | null;
  department: string;
  test_type: string;
  test_code: string | null;
  clinical_info: string;
  date_requested: string;
  priority: string;
  status: string;
  result_date: string | null;
  notes: string;
  requisition_id: string;
}

export interface WorkflowOrderResponse {
  patient_id: number;
  prescription: PrescriptionOrder;
  requisition: RequisitionOrder;
}
