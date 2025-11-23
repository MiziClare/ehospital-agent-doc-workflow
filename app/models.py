from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

# NOTE: 模型保留用于文档和未来本地持久化，但当前路由/CRUD 已改为代理到远端 API。
class PatientsRegistration(Base):
    __tablename__ = "patients_registration"
    patient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    contact_info = Column(Text, nullable=True)
    phone_number = Column(String, nullable=True)
    OHIP_code = Column(String, nullable=True)
    private_insurance_name = Column(String, nullable=True)
    private_insurance_id = Column(String, nullable=True)
    weight_kg = Column(String, nullable=True)
    height_cm = Column(String, nullable=True)
    family_doctor_id = Column(String, nullable=True)

class Diagnosis(Base):
    __tablename__ = "diagnosis"
    diagnosis_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=True)
    diagnosis_code = Column(String, nullable=True)
    diagnosis_description = Column(Text, nullable=True)
    diagnosis_date = Column(String, nullable=True)

class PatientPreference(Base):
    __tablename__ = "patient_preference"
    preference_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    preference_type = Column(String, nullable=False)  # 'pharmacy' or 'lab'
    pharmacy_id = Column(Integer, nullable=True)
    lab_id = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

class PrescriptionForm(Base):
    __tablename__ = "prescription_form"
    prescription_id = Column(String, primary_key=True, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    prescriber_id = Column(String, nullable=True)
    medication_name = Column(String, nullable=True)
    medication_strength = Column(String, nullable=True)
    medication_form = Column(String, nullable=True)
    dosage_instructions = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=True)
    refills_allowed = Column(Integer, nullable=True)
    date_prescribed = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    status = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    pharmacy_id = Column(Integer, nullable=True)

class RequisitionForm(Base):
    __tablename__ = "requisition_form"
    requisition_id = Column(String, primary_key=True, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    lab_id = Column(Integer, nullable=True)
    department = Column(String, nullable=True)
    test_type = Column(String, nullable=True)
    test_code = Column(String, nullable=True)
    clinical_info = Column(Text, nullable=True)
    date_requested = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    status = Column(String, nullable=True)
    result_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class PharmacyRegistration(Base):
    __tablename__ = "pharmacy_registration"
    pharmacy_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    license_no = Column(String, nullable=True)
    status = Column(String, nullable=True)
    registered_on = Column(String, nullable=True)

class LabRegistration(Base):
    __tablename__ = "lab_registration"
    lab_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    license_no = Column(String, nullable=True)
    status = Column(String, nullable=True)
    registered_on = Column(String, nullable=True)
