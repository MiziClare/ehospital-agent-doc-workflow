import requests
from typing import Any, Dict, List, Optional
from . import schemas
import json
from math import radians, sin, cos, sqrt, atan2

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


def _put_remote(table: str, record_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    使用 PUT 方法更新远端服务器上的现有记录。
    """
    url = f"{REMOTE_TABLES[table]}/{record_id}"
    resp = requests.put(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    # PUT 请求成功后，远端 API 可能返回空内容或确认消息，
    # 我们直接返回我们发送的 payload 作为确认。
    return payload


def _extract_records(data: Any) -> List[Dict[str, Any]]:
    """统一从远端响应中提取记录列表."""
    if isinstance(data, dict) and "data" in data:
        records = data["data"]
    else:
        records = data
    return records if isinstance(records, list) else []


# --- 新增：地理位置计算辅助函数 ---

def _parse_address_with_coords(address_str: Optional[str]) -> (Optional[str], Optional[Dict[str, float]]):
    """
    解析 "地址||{json}" 格式的字符串。
    返回 (地址, 坐标字典) 的元组。
    """
    if not address_str:
        return None, None
    parts = address_str.split("||", 1)
    plain_address = parts[0].strip()
    coords = None
    if len(parts) > 1:
        try:
            coords = json.loads(parts[1])
            if not isinstance(coords.get("lat"), (int, float)) or not isinstance(coords.get("lng"), (int, float)):
                coords = None
        except (json.JSONDecodeError, TypeError):
            coords = None
    return plain_address, coords


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    使用 Haversine 公式计算两个经纬度点之间的距离（公里）。
    """
    R = 6371  # 地球半径（公里）
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(radians, [lat1, lon1, lat2, lon2])

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance


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


# 新增：获取详细的偏好药店信息
def get_detailed_pharmacy_preferences(patient_id: int) -> List[Dict[str, Any]]:
    """获取病人的偏好药店，并附带完整的药店详情和距离。"""
    patient = get_patient(patient_id)
    if not patient:
        return []

    _, patient_coords = _parse_address_with_coords(patient.get("contact_info"))

    preferences = get_pharmacy_preferences_by_patient(patient_id)
    detailed_preferences = []

    for pref in preferences:
        pharmacy_id = pref.get("pharmacy_id")
        if not pharmacy_id:
            continue

        pharmacy_details = get_pharmacy(pharmacy_id)
        if not pharmacy_details:
            continue

        plain_address, pharmacy_coords = _parse_address_with_coords(pharmacy_details.get("address"))
        distance = None
        if patient_coords and pharmacy_coords:
            distance = _haversine_distance(
                patient_coords["lat"], patient_coords["lng"],
                pharmacy_coords["lat"], pharmacy_coords["lng"]
            )

        detailed_preferences.append({
            **pharmacy_details,
            "address": plain_address,
            "coordinates": pharmacy_coords,
            "distance_km": round(distance, 2) if distance is not None else None,
            "notes": pref.get("notes")  # 附加偏好备注
        })

    return detailed_preferences


# ---------------- Prescription ----------------

def create_prescription(obj_in: schemas.PrescriptionFormCreate) -> Dict[str, Any]:
    """生成自增 prescription_id 并调用远端 POST."""

    # 步骤 1: 读取所有数据
    data = _get_remote("prescription_form") # <-- 第一次网络请求 (GET)
    records = _extract_records(data)

    # 步骤 2: 在本地计算下一个 ID
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

    # 步骤 3: 写入新数据
    _post_remote("prescription_form", payload) # <-- 第二次网络请求 (POST)

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


# 新增：部分更新一个处方记录
def update_prescription(prescription_id: str, obj_in: schemas.PrescriptionFormUpdate) -> Optional[Dict[str, Any]]:
    """部分更新一个已有的处方记录。"""

    # 1) 先取出现有记录，若不存在则返回 None，让上层路由返回 404
    existing = get_prescription(prescription_id)
    if not existing:
        return None

    # 2) 拿到本次请求里“显式要改”的字段
    raw_update = obj_in.dict(exclude_unset=True)

    # 3) 过滤掉值未变化的字段（幂等 PATCH 不再调用远端）
    update_data = {k: v for k, v in raw_update.items() if existing.get(k) != v}

    if not update_data:
        # 没有任何实际变化，直接返回现有记录，避免远端 404/出错
        return existing

    # 4) 只有在确实有变化时才调用远端 PUT
    _put_remote("prescription_form", prescription_id, update_data)

    # 5) 返回更新后的完整记录
    return get_prescription(prescription_id)


# 修改：不再依赖“最新”，而是通过 ID 更新
def update_prescription_pharmacy(prescription_id: str, pharmacy_id: int) -> Optional[Dict[str, Any]]:
    """为指定的处方记录更新其 pharmacy_id（幂等：若值相同则不下发 PUT）。"""
    # 先检查记录是否存在
    existing = get_prescription(prescription_id)
    if not existing:
        return None

    # 如果当前 pharmacy_id 与要设置的一样，就视为幂等成功，直接返回
    current_pharmacy_id = existing.get("pharmacy_id")
    if current_pharmacy_id == pharmacy_id:
        return existing

    # 否则才真正下发 PUT
    update_payload = {"pharmacy_id": pharmacy_id}
    _put_remote("prescription_form", prescription_id, update_payload)
    return get_prescription(prescription_id)


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


# 新增：部分更新一个检验申请记录
def update_requisition(requisition_id: str, obj_in: schemas.RequisitionFormUpdate) -> Optional[Dict[str, Any]]:
    """部分更新一个已有的检验申请记录。"""

    existing = get_requisition(requisition_id)
    if not existing:
        return None

    raw_update = obj_in.dict(exclude_unset=True)
    update_data = {k: v for k, v in raw_update.items() if existing.get(k) != v}

    if not update_data:
        return existing

    _put_remote("requisition_form", requisition_id, update_data)
    return get_requisition(requisition_id)


# 修改：不再依赖“最新”，而是通过 ID 更新
def update_requisition_lab(requisition_id: str, lab_id: int) -> Optional[Dict[str, Any]]:
    """为指定的检验申请记录更新其 lab_id（幂等：若值相同则不下发 PUT）。"""
    existing = get_requisition(requisition_id)
    if not existing:
        return None

    # 如果当前 lab_id 已经等于要设置的值，则直接返回现有记录
    current_lab_id = existing.get("lab_id")
    if current_lab_id == lab_id:
        return existing

    # 否则才真正下发 PUT
    update_payload = {"lab_id": lab_id}
    _put_remote("requisition_form", requisition_id, update_payload)
    return get_requisition(requisition_id)


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


# 新增：获取最近的药店
def get_nearest_pharmacies(patient_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """获取距离指定病人最近的药店列表。"""
    patient = get_patient(patient_id)
    if not patient:
        return []

    _, patient_coords = _parse_address_with_coords(patient.get("contact_info"))
    if not patient_coords:
        return []

    all_pharmacies = get_pharmacies()
    pharmacies_with_distance = []

    for pharmacy in all_pharmacies:
        plain_address, pharmacy_coords = _parse_address_with_coords(pharmacy.get("address"))
        if pharmacy_coords:
            distance = _haversine_distance(
                patient_coords["lat"], patient_coords["lng"],
                pharmacy_coords["lat"], pharmacy_coords["lng"]
            )
            pharmacies_with_distance.append({
                **pharmacy,
                "address": plain_address,
                "coordinates": pharmacy_coords,
                "distance_km": round(distance, 2)
            })

    pharmacies_with_distance.sort(key=lambda p: p["distance_km"])
    return pharmacies_with_distance[:limit]


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


# 新增：获取详细的偏好实验室信息
def get_detailed_lab_preferences(patient_id: int) -> List[Dict[str, Any]]:
    """获取病人的偏好实验室，并附带完整的实验室详情和距离。"""
    patient = get_patient(patient_id)
    if not patient:
        return []

    _, patient_coords = _parse_address_with_coords(patient.get("contact_info"))

    preferences = get_lab_preferences_by_patient(patient_id)
    detailed_preferences = []

    for pref in preferences:
        lab_id = pref.get("lab_id")
        if not lab_id:
            continue

        lab_details = get_lab(lab_id)
        if not lab_details:
            continue

        plain_address, lab_coords = _parse_address_with_coords(lab_details.get("address"))
        distance = None
        if patient_coords and lab_coords:
            distance = _haversine_distance(
                patient_coords["lat"], patient_coords["lng"],
                lab_coords["lat"], lab_coords["lng"]
            )

        detailed_preferences.append({
            **lab_details,
            "address": plain_address,
            "coordinates": lab_coords,
            "distance_km": round(distance, 2) if distance is not None else None,
            "notes": pref.get("notes")  # 附加偏好备注
        })

    return detailed_preferences


# 新增：获取最近的实验室
def get_nearest_labs(patient_id: int, limit: int = 5) -> List[Dict[str, Any]]:
    """获取距离指定病人最近的实验室列表。"""
    patient = get_patient(patient_id)
    if not patient:
        return []

    _, patient_coords = _parse_address_with_coords(patient.get("contact_info"))
    if not patient_coords:
        return []

    all_labs = get_labs()
    labs_with_distance = []

    for lab in all_labs:
        plain_address, lab_coords = _parse_address_with_coords(lab.get("address"))
        if lab_coords:
            distance = _haversine_distance(
                patient_coords["lat"], patient_coords["lng"],
                lab_coords["lat"], lab_coords["lng"]
            )
            labs_with_distance.append({
                **lab,
                "address": plain_address,
                "coordinates": lab_coords,
                "distance_km": round(distance, 2)
            })

    labs_with_distance.sort(key=lambda l: l["distance_km"])
    return labs_with_distance[:limit]
