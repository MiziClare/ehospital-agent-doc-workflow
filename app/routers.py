from fastapi import APIRouter, HTTPException, Query, Path
from . import crud, schemas
from app.schemas import WorkflowRequest, WorkflowResponse
from app.llm_tools import execute_tool

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

# 新接口：patient 的 pharmacy 偏好（返回完整信息）
@router.get(
    "/preferences/pharmacy",
    response_model=list[schemas.PreferredPharmacyOut],
)
def get_pharmacy_preferences(
    patient_id: int = Query(..., description="Patient ID"),
):
    """
    根据 patient_id 返回该病人的所有 pharmacy 偏好，包含完整的药店信息和距离。
    """
    try:
        records = crud.get_detailed_pharmacy_preferences(patient_id)
        return records
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# 新接口：patient 的 lab 偏好（返回完整信息）
@router.get(
    "/preferences/lab",
    response_model=list[schemas.PreferredLabOut],
)
def get_lab_preferences(
    patient_id: int = Query(..., description="Patient ID"),
):
    """
    根据 patient_id 返回该病人的所有 lab 偏好，包含完整的实验室信息和距离。
    """
    try:
        records = crud.get_detailed_lab_preferences(patient_id)
        return records
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

# ✏️ 微调：列表处方时也返回 pharmacy_name + 纯地址
@router.get("/prescriptions", response_model=list[schemas.PrescriptionWithPharmacyOut])
def list_prescriptions(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        records = crud.get_prescriptions(skip=skip, limit=limit)
        result: list[schemas.PrescriptionWithPharmacyOut] = []

        for pres in records:
            pharmacy_name = None
            pharmacy_address = None
            pharmacy_id = pres.get("pharmacy_id")

            if pharmacy_id is not None:
                ph = crud.get_pharmacy(pharmacy_id)
                if ph:
                    pharmacy_name = ph.get("name")
                    raw_addr = ph.get("address")
                    if raw_addr and "||" in raw_addr:
                        pharmacy_address = raw_addr.split("||", 1)[0].strip()
                    else:
                        pharmacy_address = raw_addr

            pres_out = schemas.PrescriptionFormOut(**pres)
            result.append(
                schemas.PrescriptionWithPharmacyOut(
                    prescription=pres_out,
                    pharmacy_name=pharmacy_name,
                    pharmacy_address=pharmacy_address,
                )
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✏️ 微调：单条查询处方也返回带 pharmacy 信息的结构
@router.get("/prescriptions/{prescription_id}", response_model=schemas.PrescriptionWithPharmacyOut)
def get_prescription(prescription_id: str):
    """
    获取单条处方，返回结构与列表/最新接口一致：
    {
      "prescription": { ...PrescriptionFormOut... },
      "pharmacy_name": "...",
      "pharmacy_address": "纯地址（去掉经纬度 JSON）"
    }
    """
    try:
        pres = crud.get_prescription(prescription_id)
        if not pres:
            raise HTTPException(status_code=404, detail="Prescription not found")

        pharmacy_name = None
        pharmacy_address = None
        pharmacy_id = pres.get("pharmacy_id")

        if pharmacy_id is not None:
            ph = crud.get_pharmacy(pharmacy_id)
            if ph:
                pharmacy_name = ph.get("name")
                raw_addr = ph.get("address")
                if raw_addr and "||" in raw_addr:
                    pharmacy_address = raw_addr.split("||", 1)[0].strip()
                else:
                    pharmacy_address = raw_addr

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


@router.patch("/prescriptions/{prescription_id}", response_model=schemas.PrescriptionFormOut)
def update_prescription(prescription_id: str, payload: schemas.PrescriptionFormUpdate):
    """
    部分更新一个已有的处方。只发送需要修改的字段。
    """
    try:
        updated_prescription = crud.update_prescription(prescription_id, payload)
        if not updated_prescription:
            raise HTTPException(status_code=404, detail="Prescription not found to update.")
        return updated_prescription
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
                raw_addr = ph.get("address")
                if raw_addr and "||" in raw_addr:
                    pharmacy_address = raw_addr.split("||", 1)[0].strip()
                else:
                    pharmacy_address = raw_addr

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


# 修改：通过 ID 更新处方的药店
@router.put("/prescriptions/{prescription_id}/pharmacy", response_model=schemas.PrescriptionFormOut)
def update_prescription_pharmacy(prescription_id: str, payload: schemas.UpdatePrescriptionPharmacyRequest):
    """
    为指定的处方记录设置 pharmacy_id。
    """
    try:
        updated_prescription = crud.update_prescription_pharmacy(
            prescription_id=prescription_id,
            pharmacy_id=payload.pharmacy_id
        )
        if not updated_prescription:
            raise HTTPException(status_code=404, detail="Could not find prescription to update.")
        return updated_prescription
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✅ 新增：模拟发送处方传真到对应 pharmacy（根据 prescription_id 查询）
@router.post("/prescriptions/{prescription_id}/fax", response_model=str)
def fax_prescription(prescription_id: str):
    """
    Simulate sending a fax of a prescription form to its associated pharmacy.

    Response example:
      "Fax sent for patient (ID: 1)'s prescription form (ID: 1763831311) to pharmacy (ID: 2)."
    """
    try:
        pres = crud.get_prescription(prescription_id)
        if not pres:
            raise HTTPException(status_code=404, detail=f"Prescription with ID {prescription_id} not found.")

        patient_id = pres.get("patient_id")
        pharmacy_id = pres.get("pharmacy_id")

        if pharmacy_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Prescription {prescription_id} has no associated pharmacy_id."
            )

        message = (
            f"Fax sent for patient (ID: {patient_id})'s prescription form "
            f"(ID: {prescription_id}) to pharmacy (ID: {pharmacy_id})."
        )
        print(f"[FAX SIMULATION] {message}")
        return message
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

# ✏️ 微调：列表检验申请时也返回 lab_name + 纯地址
@router.get("/requisitions", response_model=list[schemas.RequisitionWithLabOut])
def list_requisitions(skip: int = 0, limit: int = Query(100, le=1000)):
    try:
        records = crud.get_requisitions(skip=skip, limit=limit)
        result: list[schemas.RequisitionWithLabOut] = []

        for req in records:
            lab_name = None
            lab_address = None
            lab_id = req.get("lab_id")

            if lab_id is not None:
                lab = crud.get_lab(lab_id)
                if lab:
                    lab_name = lab.get("name")
                    raw_addr = lab.get("address")
                    if raw_addr and "||" in raw_addr:
                        lab_address = raw_addr.split("||", 1)[0].strip()
                    else:
                        lab_address = raw_addr

            req_out = schemas.RequisitionFormOut(**req)
            result.append(
                schemas.RequisitionWithLabOut(
                    requisition=req_out,
                    lab_name=lab_name,
                    lab_address=lab_address,
                )
            )
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✏️ 微调：单条查询检验申请也返回带 lab 信息的结构
@router.get("/requisitions/{requisition_id}", response_model=schemas.RequisitionWithLabOut)
def get_requisition(requisition_id: str):
    """
    获取单条检验申请，返回结构与列表/最新接口一致：
    {
      "requisition": { ...RequisitionFormOut... },
      "lab_name": "...",
      "lab_address": "纯地址（去掉经纬度 JSON）"
    }
    """
    try:
        req = crud.get_requisition(requisition_id)
        if not req:
            raise HTTPException(status_code=404, detail="Requisition not found")

        lab_name = None
        lab_address = None
        lab_id = req.get("lab_id")

        if lab_id is not None:
            lab = crud.get_lab(lab_id)
            if lab:
                lab_name = lab.get("name")
                raw_addr = lab.get("address")
                if raw_addr and "||" in raw_addr:
                    lab_address = raw_addr.split("||", 1)[0].strip()
                else:
                    lab_address = raw_addr

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


@router.patch("/requisitions/{requisition_id}", response_model=schemas.RequisitionFormOut)
def update_requisition(requisition_id: str, payload: schemas.RequisitionFormUpdate):
    """
    部分更新一个已有的检验申请。只发送需要修改的字段。
    """
    try:
        updated_requisition = crud.update_requisition(requisition_id, payload)
        if not updated_requisition:
            raise HTTPException(status_code=404, detail="Requisition not found to update.")
        return updated_requisition
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.put("/requisitions/{requisition_id}/lab", response_model=schemas.RequisitionFormOut)
def set_requisition_lab(requisition_id: str, payload: dict):
    """
    为指定的 requisition 更新 lab_id。
    接收格式：
    {
        "lab_id": 2
    }
    """
    try:
        lab_id = payload.get("lab_id")
        if lab_id is None:
            raise HTTPException(status_code=400, detail="lab_id is required.")

        updated = crud.update_requisition_lab(requisition_id, lab_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Requisition not found.")

        return updated

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✅ 新增：模拟发送检验申请传真到对应 lab（根据 requisition_id 查询）
@router.post("/requisitions/{requisition_id}/fax", response_model=str)
def fax_requisition(requisition_id: str):
    """
    Simulate sending a fax of a requisition form to its associated lab.

    Response example:
      "Fax sent for patient (ID: 1)'s requisition form (ID: 1763837273) to lab (ID: 3)."
    """
    try:
        req = crud.get_requisition(requisition_id)
        if not req:
            raise HTTPException(status_code=404, detail=f"Requisition with ID {requisition_id} not found.")

        patient_id = req.get("patient_id")
        lab_id = req.get("lab_id")

        if lab_id is None:
            raise HTTPException(
                status_code=400,
                detail=f"Requisition {requisition_id} has no associated lab_id."
            )

        message = (
            f"Fax sent for patient (ID: {patient_id})'s requisition form "
            f"(ID: {requisition_id}) to lab (ID: {lab_id})."
        )
        print(f"[FAX SIMULATION] {message}")
        return message
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
                raw_addr = lab.get("address")
                if raw_addr and "||" in raw_addr:
                    lab_address = raw_addr.split("||", 1)[0].strip()
                else:
                    lab_address = raw_addr

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

# 新增：获取最近的5个药店
@router.get("/pharmacies/nearest/{patient_id}", response_model=list[schemas.NearbyPharmacyOut])
def get_nearest_pharmacies(patient_id: int):
    try:
        pharmacies = crud.get_nearest_pharmacies(patient_id)
        return pharmacies
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

# 新增：获取最近的5个实验室
@router.get("/labs/nearest/{patient_id}", response_model=list[schemas.NearbyLabOut])
def get_nearest_labs(patient_id: int):
    try:
        labs = crud.get_nearest_labs(patient_id)
        return labs
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ----------- AI function calling demo -----------

@router.post("/workflow", response_model=WorkflowResponse)
def run_workflow(payload: WorkflowRequest):
    """
    Workflow entry point.

    This endpoint is NOT a chat interface.
    It only executes a specific tool with structured JSON arguments.

    Request body:
      {
        "tool": "<tool_name>",        # e.g. "tool_create_prescription_from_latest_diagnosis"
        "arguments": { ... },         # tool-specific JSON payload
        "query": "...optional..."     # optional natural language prompt (not used here)
      }
    """
    try:
        # 我们的工具函数期望一个名为 'args' 的字典
        result = execute_tool(payload.tool, payload.arguments)
        return WorkflowResponse(
            tool=payload.tool,
            arguments=payload.arguments,
            result=result,
        )
    except Exception as e:
        # 抛给客户端，由上层 LLM 决定如何处理错误
        raise HTTPException(status_code=502, detail=str(e))


# ✅ 新增：高层 API，只要传 patient_id，让 AI 生成处方+检验单并入库 ⭐
@router.post("/workflow/generate-orders", response_model=schemas.AutoOrdersResponse)
def generate_orders_from_latest_diagnosis(body: schemas.AutoOrdersRequest):
    """
    High-level API for front-end.

    INPUT JSON:
      {
        "patient_id": 1
      }

    BEHAVIOR:
      - For this patient_id, backend:
        1) Reads the latest diagnosis (via CRUD).
        2) Uses the LLM tool 'tool_generate_orders_from_latest_diagnosis'
           to design BOTH:
             * one PRESCRIPTION_FORM record (pharmacy_id = null)
             * one REQUISITION_FORM record (lab_id = null)
        3) Persists both records into remote tables.
      - Returns the created rows.

    OUTPUT JSON:
      {
        "patient_id": 1,
        "prescription": { ...PrescriptionFormOut... },
        "requisition": { ...RequisitionFormOut... }
      }
    """
    try:
        # 我们的工具函数期望一个名为 'args' 的字典
        result = execute_tool(
            "tool_generate_orders_from_latest_diagnosis",
            {"patient_id": body.patient_id},
        )
        # result: {patient_id, diagnosis, prescription, requisition}
        pres = result["prescription"]
        req = result["requisition"]

        pres_out = schemas.PrescriptionFormOut(**pres)
        req_out = schemas.RequisitionFormOut(**req)

        return schemas.AutoOrdersResponse(
            patient_id=body.patient_id,
            prescription=pres_out,
            requisition=req_out,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✅ 新增：高层 API，根据最新诊断“补全已有处方” ⭐
@router.post(
    "/workflow/complete-prescription",
    response_model=schemas.CompletePrescriptionResponse,
)
def complete_prescription_from_latest_diagnosis(body: schemas.CompletePrescriptionRequest):
    """
    High-level API for front-end.

    INPUT JSON:
      {
        "patient_id": 1,
        "prescription_id": "1764717231"
      }

    BEHAVIOR:
      - For this patient_id and prescription_id, backend:
        1) Reads the latest diagnosis for the patient.
        2) Uses the LLM tool 'tool_complete_prescription_from_diagnosis'
           to COMPLETE / refine the existing PRESCRIPTION_FORM
           (pharmacy_id remains unchanged / may stay null).
        3) Persists the updated record into remote table.
      - Returns the updated prescription row.

    OUTPUT JSON:
      {
        "patient_id": 1,
        "prescription": { ...PrescriptionFormOut... }
      }
    """
    try:
        result = execute_tool(
            "tool_complete_prescription_from_diagnosis",
            {
                "patient_id": body.patient_id,
                "prescription_id": body.prescription_id,
            },
        )
        pres_out = schemas.PrescriptionFormOut(**result)
        return schemas.CompletePrescriptionResponse(
            patient_id=body.patient_id,
            prescription=pres_out,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


# ✅ 新增：高层 API，根据最新诊断“补全已有检验申请” ⭐
@router.post(
    "/workflow/complete-requisition",
    response_model=schemas.CompleteRequisitionResponse,
)
def complete_requisition_from_latest_diagnosis(body: schemas.CompleteRequisitionRequest):
    """
    High-level API for front-end.

    INPUT JSON:
      {
        "patient_id": 1,
        "requisition_id": "1763837273"
      }

    BEHAVIOR:
      - For this patient_id and requisition_id, backend:
        1) Reads the latest diagnosis for the patient.
        2) Uses the LLM tool 'tool_complete_requisition_from_diagnosis'
           to COMPLETE / refine the existing REQUISITION_FORM
           (lab_id remains unchanged / may stay null).
        3) Persists the updated record into remote table.
      - Returns the updated requisition row.

    OUTPUT JSON:
      {
        "patient_id": 1,
        "requisition": { ...RequisitionFormOut... }
      }
    """
    try:
        result = execute_tool(
            "tool_complete_requisition_from_diagnosis",
            {
                "patient_id": body.patient_id,
                "requisition_id": body.requisition_id,
            },
        )
        req_out = schemas.RequisitionFormOut(**result)
        return schemas.CompleteRequisitionResponse(
            patient_id=body.patient_id,
            requisition=req_out,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
