from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional

# ---------------- Patients ----------------

class PatientsRegistrationCreate(BaseModel):
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    contact_info: Optional[str] = None
    phone_number: Optional[str] = None
    OHIP_code: Optional[str] = None
    private_insurance_name: Optional[str] = None
    private_insurance_id: Optional[str] = None
    weight_kg: Optional[str] = None
    height_cm: Optional[str] = None
    family_doctor_id: Optional[str] = None


class PatientsRegistrationOut(PatientsRegistrationCreate):
    patient_id: int

    class Config:
        orm_mode = True


# ---------------- Diagnosis ----------------

class DiagnosisCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    diagnosis_code: Optional[str] = None
    diagnosis_description: Optional[str] = None
    diagnosis_date: Optional[str] = None


class DiagnosisOut(DiagnosisCreate):
    diagnosis_id: int

    class Config:
        orm_mode = True


# ---------------- Patient Preference ----------------

class PatientPreferenceCreate(BaseModel):
    patient_id: int
    preference_type: str
    pharmacy_id: Optional[int] = None
    lab_id: Optional[int] = None
    notes: Optional[str] = None

    @validator("preference_type")
    def check_type(cls, v):
        if v not in ("pharmacy", "lab"):
            raise ValueError("preference_type must be 'pharmacy' or 'lab'")
        return v

    @validator("pharmacy_id", always=True)
    def check_preference_ids(cls, v, values):
        ptype = values.get("preference_type")
        lab = values.get("lab_id")
        if ptype == "pharmacy":
            if v is None:
                raise ValueError("pharmacy_id is required when preference_type is 'pharmacy'")
            if lab is not None:
                raise ValueError("lab_id must be empty when preference_type is 'pharmacy'")
        return v

    @validator("lab_id", always=True)
    def check_lab_id(cls, v, values):
        ptype = values.get("preference_type")
        pharmacy = values.get("pharmacy_id")
        if ptype == "lab":
            if v is None:
                raise ValueError("lab_id is required when preference_type is 'lab'")
            if pharmacy is not None:
                raise ValueError("pharmacy_id must be empty when preference_type is 'lab'")
        return v


class PatientPreferenceOut(PatientPreferenceCreate):
    preference_id: int

    class Config:
        orm_mode = True


# 只返回 pharmacy_id/lab_id + notes 的“精简版”schema
class PatientPreferenceSlimOut(BaseModel):
    target_id: int  # 根据 preference_type 映射: pharmacy_id 或 lab_id
    notes: Optional[str] = None


# ---------------- Prescription ----------------

# Create：不包含 prescription_id，自增
class PrescriptionFormCreate(BaseModel):
    patient_id: int
    prescriber_id: Optional[str] = None
    medication_name: Optional[str] = None
    medication_strength: Optional[str] = None
    medication_form: Optional[str] = None
    dosage_instructions: Optional[str] = None
    quantity: Optional[int] = None
    refills_allowed: Optional[int] = None
    date_prescribed: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    pharmacy_id: Optional[int] = None


# Out：包含 prescription_id
class PrescriptionFormOut(PrescriptionFormCreate):
    prescription_id: str

    class Config:
        orm_mode = True


# 最新处方 + 关联 pharmacy 数据
class PrescriptionWithPharmacyOut(BaseModel):
    prescription: PrescriptionFormOut
    pharmacy_name: Optional[str] = None
    pharmacy_address: Optional[str] = None


# ---------------- Requisition ----------------

# Create：不包含 requisition_id，自增
class RequisitionFormCreate(BaseModel):
    patient_id: int
    lab_id: Optional[int] = None
    department: Optional[str] = None
    test_type: Optional[str] = None
    test_code: Optional[str] = None
    clinical_info: Optional[str] = None
    date_requested: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    result_date: Optional[str] = None
    notes: Optional[str] = None


# Out：包含 requisition_id
class RequisitionFormOut(RequisitionFormCreate):
    requisition_id: str

    class Config:
        orm_mode = True


class RequisitionWithLabOut(BaseModel):
    requisition: RequisitionFormOut
    lab_name: Optional[str] = None
    lab_address: Optional[str] = None


# ---------------- Pharmacy ----------------

class PharmacyRegistrationCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    license_no: Optional[str] = None
    status: Optional[str] = None
    registered_on: Optional[str] = None


class PharmacyRegistrationOut(PharmacyRegistrationCreate):
    pharmacy_id: int

    class Config:
        orm_mode = True


# ---------------- Lab ----------------

class LabRegistrationCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    license_no: Optional[str] = None
    status: Optional[str] = None
    registered_on: Optional[str] = None


class LabRegistrationOut(LabRegistrationCreate):
    lab_id: int

    class Config:
        orm_mode = True

# ---------------- Agent ----------------
class WorkflowRequest(BaseModel):
    query: str


class WorkflowResponse(BaseModel):
    tool: str
    arguments: Dict[str, Any]
    result: Any