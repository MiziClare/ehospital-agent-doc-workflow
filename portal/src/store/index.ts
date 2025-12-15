// src/store/useStore.ts
import { create } from "zustand";
import type { DiagnosisInfo } from "../types/Diagnosis";


interface currentDiagnosisInfo {
  diagnosisInfo: DiagnosisInfo[] | null;
  updateDiagnosisInfo: (info: DiagnosisInfo[] | null) => void;
}
export const useCurrentDiagnosisInfoStore = create<currentDiagnosisInfo>((set) => ({
  diagnosisInfo: null,
  updateDiagnosisInfo: (info) => set(() => ({ diagnosisInfo: info })),
}));

interface SelectedPharmacyStore {
  selectedPharmacy: { pharmacy_id: number; name: string; address: string } | null;
  updateSelectedPharmacy: (pharmacy: { pharmacy_id: number; name: string; address: string } | null) => void;
}
export const useSelectedPharmacyStore = create<SelectedPharmacyStore>((set) => ({
  selectedPharmacy: null,
  updateSelectedPharmacy: (pharmacy) => set(() => ({ selectedPharmacy: pharmacy })),
}));

interface SelectedLabStore {
  selectedLab: { lab_id: number; name: string; address: string } | null;
  updateSelectedLab: (lab: { lab_id: number; name: string; address: string } | null) => void;
}
export const useSelectedLabStore = create<SelectedLabStore>((set) => ({
  selectedLab: null,
  updateSelectedLab: (lab) => set(() => ({ selectedLab: lab })),
}));

interface GeneratedOrdersStore {
  prescriptionId: string | null;
  requisitionId: string | null;
  updateOrderIds: (prescriptionId: string | null, requisitionId: string | null) => void;
}
export const useGeneratedOrdersStore = create<GeneratedOrdersStore>((set) => ({
  prescriptionId: null,
  requisitionId: null,
  updateOrderIds: (prescriptionId, requisitionId) => 
    set(() => ({ prescriptionId, requisitionId })),
}));

interface OrderSubmittedStore {
  isOrderSubmitted: boolean;
  setOrderSubmitted: (submitted: boolean) => void;
}
export const useOrderSubmittedStore = create<OrderSubmittedStore>((set) => ({
  isOrderSubmitted: false,
  setOrderSubmitted: (submitted) => set(() => ({ isOrderSubmitted: submitted })),
}));

interface FaxSentStore {
  prescriptionFaxSent: boolean;
  requisitionFaxSent: boolean;
  setPrescriptionFaxSent: (sent: boolean) => void;
  setRequisitionFaxSent: (sent: boolean) => void;
}
export const useFaxSentStore = create<FaxSentStore>((set) => ({
  prescriptionFaxSent: false,
  requisitionFaxSent: false,
  setPrescriptionFaxSent: (sent) => set(() => ({ prescriptionFaxSent: sent })),
  setRequisitionFaxSent: (sent) => set(() => ({ requisitionFaxSent: sent })),
}));

interface WorkflowGenerationStore {
  hasGeneratedOrders: boolean;
  setHasGeneratedOrders: (generated: boolean) => void;
}

export const useWorkflowGenerationStore = create<WorkflowGenerationStore>(
  (set) => ({
    hasGeneratedOrders: false,
    setHasGeneratedOrders: (generated) =>
      set(() => ({ hasGeneratedOrders: generated })),
  })
);

// Single-form workflow stores
interface PrescriptionWorkflowStore {
  prescriptionId: string | null;
  hasGeneratedPrescription: boolean;
  setPrescriptionId: (id: string | null) => void;
  setHasGeneratedPrescription: (v: boolean) => void;
}

export const usePrescriptionWorkflowStore = create<PrescriptionWorkflowStore>((set) => ({
  prescriptionId: null,
  hasGeneratedPrescription: false,
  setPrescriptionId: (id) => set(() => ({ prescriptionId: id })),
  setHasGeneratedPrescription: (v) => set(() => ({ hasGeneratedPrescription: v })),
}));

interface RequisitionWorkflowStore {
  requisitionId: string | null;
  hasGeneratedRequisition: boolean;
  setRequisitionId: (id: string | null) => void;
  setHasGeneratedRequisition: (v: boolean) => void;
}

export const useRequisitionWorkflowStore = create<RequisitionWorkflowStore>((set) => ({
  requisitionId: null,
  hasGeneratedRequisition: false,
  setRequisitionId: (id) => set(() => ({ requisitionId: id })),
  setHasGeneratedRequisition: (v) => set(() => ({ hasGeneratedRequisition: v })),
}));
