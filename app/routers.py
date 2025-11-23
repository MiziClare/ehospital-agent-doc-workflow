from fastapi import APIRouter, HTTPException, Query, Path
from . import crud, schemas
from app.schemas import WorkflowRequest, WorkflowResponse
from app.llm_tools import llm_route_to_tool, execute_tool

router = APIRouter()

# Patients
@router.post("/patients", response_model=schemas.PatientsRegistrationOut)
def create_patient(payload: schemas.PatientsRegistrationCreate):
    try:
        res = crud.create_patient(payload)
        # 远端返回可能是完整结构或包装结构，尝试返回字段
        if isinstance(res, dict) and "data" in res and isinstance(res["data"], list):
            return res["data"][0]
        return res
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/patients", response_model=list[schemas.PatientsRegistrationOut])
def list_patients(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_patients(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/patients/{patient_id}", response_model=schemas.PatientsRegistrationOut)
def get_patient(patient_id: int):
    try:
        obj = crud.get_patient(patient_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Patient not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Diagnosis
@router.post("/diagnosis", response_model=schemas.DiagnosisOut)
def create_diagnosis(payload: schemas.DiagnosisCreate):
    try:
        return crud.create_diagnosis(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/diagnosis", response_model=list[schemas.DiagnosisOut])
def list_diagnoses_by_patient(
    patient_id: int | None = Query(
        None,
        description="Patient ID（必填：不传则返回 400 提示）",
    )
):
    """
    根据 patient_id 返回该病人所有 diagnosis。
    """
    if patient_id is None:
        raise HTTPException(status_code=400, detail="patient_id is required")
    try:
        records = crud.get_diagnoses_by_patient(patient_id)
        return records
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# 新增：path 形式 /diagnosis/{patient_id}，根据 patient_id 返回所有 diagnosis
@router.get("/diagnosis/{patient_id}", response_model=list[schemas.DiagnosisOut])
def list_diagnoses_by_patient_path(patient_id: int):
    """
    path 形式按 patient_id 返回该病人所有 diagnosis。
    例如：GET /diagnosis/1
    """
    try:
        records = crud.get_diagnoses_by_patient(patient_id)
        return records
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# 只保留 path 形式的 latest：/diagnosis/latest/{patient_id}
@router.get("/diagnosis/latest/{patient_id}", response_model=schemas.DiagnosisOut)
def get_latest_diagnosis_path(patient_id: int):
    """根据 patient_id 返回该病人最新的 diagnosis（path 形式）。"""
    try:
        obj = crud.get_latest_diagnosis_by_patient(patient_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Diagnosis not found for patient")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Patient Preference
@router.post("/preferences", response_model=schemas.PatientPreferenceOut)
def create_preference(payload: schemas.PatientPreferenceCreate):
    try:
        return crud.create_preference(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/preferences", response_model=list[schemas.PatientPreferenceOut])
def list_preferences(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_preferences(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get(
    "/preferences/by-patient",
    response_model=list[schemas.PatientPreferenceSlimOut],
)
def get_preferences_by_patient_and_type(
    patient_id: int = Query(..., description="Patient ID"),
    preference_type: str = Query(..., regex="^(pharmacy|lab)$"),
):
    """
    根据 patient_id + preference_type 返回相关条目的：
    - target_id: pharmacy_id 或 lab_id
    - notes
    """
    try:
        records = crud.get_preferences_by_patient_and_type(patient_id, preference_type)
        result = []
        for r in records:
            if preference_type == "pharmacy":
                target_id = r.get("pharmacy_id")
            else:
                target_id = r.get("lab_id")
            if target_id is None:
                continue
            result.append(
                schemas.PatientPreferenceSlimOut(
                    target_id=target_id,
                    notes=r.get("notes"),
                )
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Prescription
@router.post("/prescriptions", response_model=schemas.PrescriptionFormOut)
def create_prescription(payload: schemas.PrescriptionFormCreate):
    """
    增：不需要前端提供 prescription_id，由服务器在远端现有记录基础上生成自增 id。
    """
    try:
        res = crud.create_prescription(payload)
        # 远端可能返回包装结构，这里做一次解包尝试
        if isinstance(res, dict) and "data" in res and isinstance(res["data"], list) and res["data"]:
            return res["data"][0]
        return res
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/prescriptions", response_model=list[schemas.PrescriptionFormOut])
def list_prescriptions(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_prescriptions(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/prescriptions/{prescription_id}", response_model=schemas.PrescriptionFormOut)
def get_prescription(prescription_id: str):
    try:
        obj = crud.get_prescription(prescription_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Prescription not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# 只保留 path 形式的 latest：/prescriptions/latest/{patient_id}
@router.get(
    "/prescriptions/latest/{patient_id}",
    response_model=schemas.PrescriptionWithPharmacyOut,
)
def get_latest_prescription_with_pharmacy(patient_id: int = Path(..., description="Patient ID")):
    """
    根据 patient_id 返回最新的处方 + 关联 pharmacy 的 name/address。
    仅提供 path 形式：GET /prescriptions/latest/{patient_id}
    """
    try:
        pres = crud.get_latest_prescription_by_patient(patient_id)
        if not pres:
            raise HTTPException(status_code=404, detail="Prescription not found for patient")

        pharmacy_name = None
        pharmacy_address = None
        pharmacy_id = pres.get("pharmacy_id")
        if pharmacy_id is not None:
            ph = crud.get_pharmacy(pharmacy_id)
            if ph:
                pharmacy_name = ph.get("name")
                pharmacy_address = ph.get("address")

        pres_out = schemas.PrescriptionFormOut(**pres)
        return schemas.PrescriptionWithPharmacyOut(
            prescription=pres_out,
            pharmacy_name=pharmacy_name,
            pharmacy_address=pharmacy_address,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# Requisition
@router.post("/requisitions", response_model=schemas.RequisitionFormOut)
def create_requisition(payload: schemas.RequisitionFormCreate):
    """
    增：不需要前端提供 requisition_id，由服务器在远端现有记录基础上生成自增 id。
    """
    try:
        res = crud.create_requisition(payload)
        if isinstance(res, dict) and "data" in res and isinstance(res["data"], list) and res["data"]:
            return res["data"][0]
        return res
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/requisitions", response_model=list[schemas.RequisitionFormOut])
def list_requisitions(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_requisitions(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/requisitions/{requisition_id}", response_model=schemas.RequisitionFormOut)
def get_requisition(requisition_id: str):
    try:
        obj = crud.get_requisition(requisition_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Requisition not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# 只保留 path 形式的 latest：/requisitions/latest/{patient_id}
@router.get(
    "/requisitions/latest/{patient_id}",
    response_model=schemas.RequisitionWithLabOut,
)
def get_latest_requisition_with_lab(patient_id: int = Path(..., description="Patient ID")):
    """
    根据 patient_id 返回最新的检验申请 + 关联 lab 的 name/address。
    仅提供 path 形式：GET /requisitions/latest/{patient_id}
    """
    try:
        req = crud.get_latest_requisition_by_patient(patient_id)
        if not req:
            raise HTTPException(status_code=404, detail="Requisition not found for patient")

        lab_name = None
        lab_address = None
        lab_id = req.get("lab_id")
        if lab_id is not None:
            lab = crud.get_lab(lab_id)
            if lab:
                lab_name = lab.get("name")
                lab_address = lab.get("address")

        req_out = schemas.RequisitionFormOut(**req)
        return schemas.RequisitionWithLabOut(
            requisition=req_out,
            lab_name=lab_name,
            lab_address=lab_address,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# Pharmacy
@router.post("/pharmacies", response_model=schemas.PharmacyRegistrationOut)
def create_pharmacy(payload: schemas.PharmacyRegistrationCreate):
    try:
        return crud.create_pharmacy(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/pharmacies", response_model=list[schemas.PharmacyRegistrationOut])
def list_pharmacies(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_pharmacies(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/pharmacies/{pharmacy_id}", response_model=schemas.PharmacyRegistrationOut)
def get_pharmacy(pharmacy_id: int):
    try:
        obj = crud.get_pharmacy(pharmacy_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Pharmacy not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# Lab
@router.post("/labs", response_model=schemas.LabRegistrationOut)
def create_lab(payload: schemas.LabRegistrationCreate):
    try:
        return crud.create_lab(payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/labs", response_model=list[schemas.LabRegistrationOut])
def list_labs(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        return crud.get_labs(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/labs/{lab_id}", response_model=schemas.LabRegistrationOut)
def get_lab(lab_id: int):
    try:
        obj = crud.get_lab(lab_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Lab not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # ----------- AI function calling demo -----------

@router.post("/workflow", response_model=WorkflowResponse)
def run_workflow(payload: WorkflowRequest):
    """
    工作流入口：
    - 模型决定要调用哪个工具
    - 我们执行工具
    - 返回工具执行结果
    """

    # ① 模型决定调用哪个工具
    route = llm_route_to_tool(payload.query)

    # route = { "function_name": "...", "arguments": {...}}

    # ② 执行工具
    result = execute_tool(route["function_name"], route["arguments"])

    # ③ 返回工具执行结果（无自然语言）
    return WorkflowResponse(
        tool=route["function_name"],
        arguments=route["arguments"],
        result=result
    )

