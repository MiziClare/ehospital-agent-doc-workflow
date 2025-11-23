import requests
from typing import Any, Dict, List, Optional
from . import schemas

# 远端表 URL 映射
REMOTE_TABLES = {
    "patients_registration": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/patients_registration",
    "diagnosis": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/diagnosis",
    "patient_preference": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/patient_preference",
    "prescription_form": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/prescription_form",
    "requisition_form": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/requisition_form",
    "pharmacy_registration": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/pharmacy_registration",
    "lab_registration": "https://aetab8pjmb.us-east-1.awsapprunner.com/table/lab_registration",
}

TIMEOUT = 60  # seconds. Increased to handle long-running AI workflows.


def _get_remote(table: str) -> Dict[str, Any]:
    url = REMOTE_TABLES[table]
    resp = requests.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _post_remote(table: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = REMOTE_TABLES[table]
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def _extract_records(data: Any) -> List[Dict[str, Any]]:
    """统一从远端响应中提取记录列表."""
    if isinstance(data, dict) and "data" in data:
        records = data["data"]
    else:
        records = data
    return records if isinstance(records, list) else []


# ---------------- Patients ----------------

def create_patient(obj_in: schemas.PatientsRegistrationCreate) -> Dict[str, Any]:
    payload = obj_in.dict()
    return _post_remote("patients_registration", payload)


def get_patients(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("patients_registration")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    data = _get_remote("patients_registration")
    records = _extract_records(data)
    for rec in records:
        if rec.get("patient_id") == patient_id or rec.get("id") == patient_id:
            return rec
    return None


# ---------------- Diagnosis ----------------

def create_diagnosis(obj_in: schemas.DiagnosisCreate) -> Dict[str, Any]:
    payload = obj_in.dict()
    return _post_remote("diagnosis", payload)


def get_diagnoses(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("diagnosis")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_diagnosis(diagnosis_id: int):
    data = _get_remote("diagnosis")
    records = _extract_records(data)
    if not isinstance(records, list):
        return None
    for rec in records:
        if rec.get("diagnosis_id") == diagnosis_id or rec.get("id") == diagnosis_id:
            return rec


def get_diagnoses_by_patient(patient_id: int) -> List[Dict[str, Any]]:
    """返回某个 patient 的全部 diagnosis."""
    data = _get_remote("diagnosis")
    records = _extract_records(data)
    return [r for r in records if r.get("patient_id") == patient_id]


def get_latest_diagnosis_by_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    """返回某个 patient 最新一条 diagnosis."""
    records = get_diagnoses_by_patient(patient_id)
    if not records:
        return None

    def _key(r: Dict[str, Any]):
        return (r.get("diagnosis_date") or "", r.get("diagnosis_id") or 0)

    records.sort(key=_key, reverse=True)
    return records[0]


# ---------------- Patient Preference ----------------

def create_preference(obj_in: schemas.PatientPreferenceCreate) -> Dict[str, Any]:
    payload = obj_in.dict()
    return _post_remote("patient_preference", payload)


def get_preferences(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("patient_preference")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_preferences_by_patient_and_type(patient_id: int, preference_type: str) -> List[Dict[str, Any]]:
    data = _get_remote("patient_preference")
    records = _extract_records(data)
    return [
        r
        for r in records
        if r.get("patient_id") == patient_id and r.get("preference_type") == preference_type
    ]


# 新增：专门获取 pharmacy 偏好
def get_pharmacy_preferences_by_patient(patient_id: int) -> List[Dict[str, Any]]:
    """
    返回某个 patient 所有 preference_type = 'pharmacy' 的偏好记录。
    """
    return get_preferences_by_patient_and_type(patient_id, "pharmacy")


# 新增：专门获取 lab 偏好
def get_lab_preferences_by_patient(patient_id: int) -> List[Dict[str, Any]]:
    """
    返回某个 patient 所有 preference_type = 'lab' 的偏好记录。
    """
    return get_preferences_by_patient_and_type(patient_id, "lab")


# ---------------- Prescription ----------------

def create_prescription(obj_in: schemas.PrescriptionFormCreate) -> Dict[str, Any]:
    """生成自增 prescription_id 并调用远端 POST."""
    data = _get_remote("prescription_form")
    records = _extract_records(data)

    max_id = 0
    for r in records:
        rid = r.get("prescription_id") or r.get("id")
        if rid is None:
            continue
        try:
            rid_int = int(rid)
        except (TypeError, ValueError):
            continue
        max_id = max(max_id, rid_int)

    new_id = str(max_id + 1 if max_id > 0 else 1)
    payload = obj_in.dict()
    payload["prescription_id"] = new_id

    # 调用远端 API 写入数据
    _post_remote("prescription_form", payload)

    # 直接返回我们自己构造的、结构完整的 payload，而不是远端 API 的响应
    return payload


def get_prescriptions(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("prescription_form")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_prescription(prescription_id: str) -> Optional[Dict[str, Any]]:
    data = _get_remote("prescription_form")
    records = _extract_records(data)
    for rec in records:
        if str(rec.get("prescription_id") or rec.get("id")) == str(prescription_id):
            return rec
    return None


def get_latest_prescription_by_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    data = _get_remote("prescription_form")
    records = _extract_records(data)
    records = [r for r in records if r.get("patient_id") == patient_id]
    if not records:
        return None

    def _key(r: Dict[str, Any]):
        return (r.get("date_prescribed") or "", r.get("prescription_id") or 0)

    records.sort(key=_key, reverse=True)
    return records[0]


# ---------------- Requisition ----------------

def create_requisition(obj_in: schemas.RequisitionFormCreate) -> Dict[str, Any]:
    """生成自增 requisition_id 并调用远端 POST."""
    data = _get_remote("requisition_form")
    records = _extract_records(data)

    max_id = 0
    for r in records:
        rid = r.get("requisition_id") or r.get("id")
        if rid is None:
            continue
        try:
            rid_int = int(rid)
        except (TypeError, ValueError):
            continue
        max_id = max(max_id, rid_int)

    new_id = str(max_id + 1 if max_id > 0 else 1)
    payload = obj_in.dict()
    payload["requisition_id"] = new_id

    # 调用远端 API 写入数据
    _post_remote("requisition_form", payload)

    # 直接返回我们自己构造的、结构完整的 payload，而不是远端 API 的响应
    return payload


def get_requisitions(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("requisition_form")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_requisition(requisition_id: str) -> Optional[Dict[str, Any]]:
    data = _get_remote("requisition_form")
    records = _extract_records(data)
    for rec in records:
        if str(rec.get("requisition_id") or rec.get("id")) == str(requisition_id):
            return rec
    return None


def get_latest_requisition_by_patient(patient_id: int) -> Optional[Dict[str, Any]]:
    data = _get_remote("requisition_form")
    records = _extract_records(data)
    records = [r for r in records if r.get("patient_id") == patient_id]
    if not records:
        return None

    def _key(r: Dict[str, Any]):
        return (r.get("date_requested") or "", r.get("requisition_id") or 0)

    records.sort(key=_key, reverse=True)
    return records[0]


# ---------------- Pharmacy ----------------

def create_pharmacy(obj_in: schemas.PharmacyRegistrationCreate) -> Dict[str, Any]:
    payload = obj_in.dict()
    return _post_remote("pharmacy_registration", payload)


def get_pharmacies(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("pharmacy_registration")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_pharmacy(pharmacy_id: int) -> Optional[Dict[str, Any]]:
    data = _get_remote("pharmacy_registration")
    records = _extract_records(data)
    for rec in records:
        if rec.get("pharmacy_id") == pharmacy_id or rec.get("id") == pharmacy_id:
            return rec
    return None


# ---------------- Lab ----------------

def create_lab(obj_in: schemas.LabRegistrationCreate) -> Dict[str, Any]:
    payload = obj_in.dict()
    return _post_remote("lab_registration", payload)


def get_labs(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    data = _get_remote("lab_registration")
    records = _extract_records(data)
    return records[skip: skip + limit]


def get_lab(lab_id: int) -> Optional[Dict[str, Any]]:
    data = _get_remote("lab_registration")
    records = _extract_records(data)
    for rec in records:
        if rec.get("lab_id") == lab_id or rec.get("id") == lab_id:
            return rec
    return None
