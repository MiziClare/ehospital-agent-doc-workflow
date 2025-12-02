import json
from typing import Dict, Any
from openai import OpenAI
from app.config import settings
from datetime import datetime, timedelta
from . import crud, schemas
import time # 引入 time 模块用于计时

client = OpenAI(api_key=settings.openai_api_key)

# --- 统一的工具注册和执行机制 ---

# 工具注册表：function_name -> callable
TOOLS: Dict[str, Any] = {}

def register_tool(func):
    """装饰器：将一个函数注册为可被 LLM 调用的工具。"""
    TOOLS[func.__name__] = func
    return func

def execute_tool(function_name: str, arguments: Dict[str, Any]) -> Any:
    """根据函数名和参数执行一个已注册的工具。"""
    if function_name not in TOOLS:
        raise ValueError(f"Unknown tool: {function_name}")
    func = TOOLS[function_name]
    # 注意：我们的工具函数都希望接收一个名为 'args' 的字典
    return func(args=arguments)


# --- 底层工具：负责将结构化数据写入数据库 ---

@register_tool
def tool_create_prescription_from_latest_diagnosis(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool: create_prescription_from_latest_diagnosis

    PURPOSE:
      For a given patient, create and persist a new PRESCRIPTION_FORM record
      into the remote table. The caller (LLM or another tool) MUST provide
      all necessary medical fields.

    EXPECTED INPUT (args dict):
      {
        "patient_id": <int>,              # REQUIRED. Target patient_id for this prescription.
        "prescriber_id": <str>,           # REQUIRED. Prescriber / doctor identifier.
        "medication_name": <str>,         # REQUIRED. Concrete drug name, e.g. "Amoxicillin".
        "medication_strength": <str>,     # REQUIRED. Human-readable strength, e.g. "500mg".
        "medication_form": <str>,         # REQUIRED. Dosage form, e.g. "Tablet".
        "dosage_instructions": <str>,     # REQUIRED. Full instructions string.
        "quantity": <int>,                # REQUIRED. Total units to dispense.
        "refills_allowed": <int>,         # REQUIRED. Number of refills.
        "status": <str>,                  # OPTIONAL. e.g. "active".
        "notes": <str>                    # OPTIONAL. Rationale / precautions.
      }

    AUTOMATICALLY SET BY TOOL:
      - date_prescribed: current UTC time.
      - expiry_date: 30 days from now.
      - pharmacy_id: always set to None.

    OUTPUT:
      The newly created PRESCRIPTION_FORM row as a plain dict.
    """
    patient_id = int(args["patient_id"])
    prescriber_id = str(args["prescriber_id"])

    now = datetime.utcnow()
    date_prescribed = now.isoformat() + "Z"
    expiry_date = (now + timedelta(days=30)).date().isoformat()

    payload = schemas.PrescriptionFormCreate(
        patient_id=patient_id,
        prescriber_id=prescriber_id,
        medication_name=str(args["medication_name"]),
        medication_strength=str(args["medication_strength"]),
        medication_form=str(args["medication_form"]),
        dosage_instructions=str(args["dosage_instructions"]),
        quantity=int(args["quantity"]),
        refills_allowed=int(args["refills_allowed"]),
        date_prescribed=date_prescribed,
        expiry_date=expiry_date,
        status=str(args.get("status") or "active"),
        notes=args.get("notes"),
        pharmacy_id=None,
    )

    res = crud.create_prescription(payload)
    if isinstance(res, dict) and "data" in res and isinstance(res["data"], list) and res["data"]:
        return res["data"][0]
    return res


@register_tool
def tool_create_requisition_from_latest_diagnosis(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool: create_requisition_from_latest_diagnosis

    PURPOSE:
      For a given patient, create and persist a new REQUISITION_FORM record
      into the remote table. The caller (LLM or another tool) MUST provide
      all necessary medical fields.

    EXPECTED INPUT (args dict):
      {
        "patient_id": <int>,          # REQUIRED. Target patient_id.
        "department": <str>,          # REQUIRED. Ordering department.
        "test_type": <str>,           # REQUIRED. High-level test description.
        "test_code": <str|null>,      # OPTIONAL. Coded identifier.
        "clinical_info": <str>,       # REQUIRED. Short clinical background.
        "priority": <str>,            # REQUIRED. e.g. "Routine", "Urgent".
        "status": <str>,              # OPTIONAL. e.g. "Pending".
        "notes": <str|null>           # OPTIONAL. Additional instructions.
      }

    AUTOMATICALLY SET BY TOOL:
      - lab_id: always set to None.
      - date_requested: current UTC time.
      - result_date: always set to None.

    OUTPUT:
      The newly created REQUISITION_FORM row as a plain dict.
    """
    patient_id = int(args["patient_id"])
    department = str(args["department"])

    now = datetime.utcnow()
    date_requested = now.isoformat() + "Z"

    payload = schemas.RequisitionFormCreate(
        patient_id=patient_id,
        lab_id=None,
        department=department,
        test_type=str(args["test_type"]),
        test_code=args.get("test_code"),
        clinical_info=str(args["clinical_info"]),
        date_requested=date_requested,
        priority=str(args["priority"]),
        status=str(args.get("status") or "Pending"),
        result_date=None,
        notes=args.get("notes"),
    )

    res = crud.create_requisition(payload)
    if isinstance(res, dict) and "data" in res and isinstance(res["data"], list) and res["data"]:
        return res["data"][0]
    return res


# --- 高层工作流工具：封装了 AI 推理和底层工具调用 ---

@register_tool
def tool_generate_orders_from_latest_diagnosis(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool: generate_orders_from_latest_diagnosis

    PURPOSE:
      High-level workflow tool. For a given patient_id, automatically:
        1) Reads the latest diagnosis_description of this patient.
        2) Asks an AI to design a prescription and a lab requisition.
        3) Persists BOTH records into the database via other tools.

    INPUT (args dict):
      {
        "patient_id": <int>   # REQUIRED. The patient for whom to generate orders.
      }

    OUTPUT:
      {
        "patient_id": <int>,
        "diagnosis": {...latest diagnosis row...},
        "prescription": {...created prescription row...},
        "requisition": {...created requisition row...}
      }
    """
    start_time = time.time()
    print(f"\n[DEBUG] --- Starting tool_generate_orders_from_latest_diagnosis for patient_id={args.get('patient_id')} ---")

    try:
        patient_id = int(args["patient_id"])

        # 1) 获取最新诊断
        print(f"[DEBUG] Step 1: Fetching latest diagnosis for patient_id={patient_id}...")
        dx = crud.get_latest_diagnosis_by_patient(patient_id)
        if not dx:
            raise ValueError(f"No latest diagnosis found for patient_id={patient_id}")
        print(f"[DEBUG] Step 1: Success. Diagnosis found.")

        diag_desc = (dx.get("diagnosis_description") or "").strip()
        if not diag_desc:
            raise ValueError(f"Latest diagnosis for patient_id={patient_id} has empty description")
        print(f"[DEBUG] Diagnosis description: '{diag_desc[:100]}...'")

        # 2) 调用 LLM（function calling）生成两套结构化字段
        print(f"[DEBUG] Step 2: Calling OpenAI API to design orders...")
        system_prompt = (
            "You are a clinical decision support assistant. "
            "Given a patient's latest diagnosis description, you MUST design "
            "one medication prescription and one lab requisition. "
            "You MUST respond ONLY via the provided JSON tool schema. "
            "Do NOT output natural-language text."
        )

        user_prompt = (
            f"Patient id: {patient_id}\n"
            f"Latest diagnosis_description:\n"
            f"--------------------\n{diag_desc}\n--------------------\n"
            "1) Propose an appropriate medication-based treatment plan.\n"
            "2) Propose an appropriate lab investigation plan.\n"
            "3) You MUST NOT invent any pharmacy_id or lab_id.\n"
            "4) You MUST fill all required fields in the JSON schema."
        )

        tools_spec = [
            {
                "type": "function",
                "function": {
                    "name": "propose_orders_from_diagnosis",
                    "description": "Propose both a prescription and a requisition payload.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "prescription": {
                                "type": "object",
                                "properties": {
                                    "prescriber_id": {"type": "string"},
                                    "medication_name": {"type": "string"},
                                    "medication_strength": {"type": "string"},
                                    "medication_form": {"type": "string"},
                                    "dosage_instructions": {"type": "string"},
                                    "quantity": {"type": "integer"},
                                    "refills_allowed": {"type": "integer"},
                                    "status": {"type": "string"},
                                    "notes": {"type": "string"}
                                },
                                "required": ["prescriber_id", "medication_name", "medication_strength", "medication_form", "dosage_instructions", "quantity", "refills_allowed"]
                            },
                            "requisition": {
                                "type": "object",
                                "properties": {
                                    "department": {"type": "string"},
                                    "test_type": {"type": "string"},
                                    "test_code": {"type": ["string", "null"]},
                                    "clinical_info": {"type": "string"},
                                    "priority": {"type": "string"},
                                    "status": {"type": "string"},
                                    "notes": {"type": ["string", "null"]}
                                },
                                "required": ["department", "test_type", "clinical_info", "priority"]
                            }
                        },
                        "required": ["prescription", "requisition"]
                    }
                }
            }
        ]

        llm_start_time = time.time()
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            tools=tools_spec,
            tool_choice={"type": "function", "function": {"name": "propose_orders_from_diagnosis"}},
        )
        llm_end_time = time.time()
        print(f"[DEBUG] Step 2: OpenAI API call successful. Time taken: {llm_end_time - llm_start_time:.2f} seconds.")

        msg = response.choices[0].message
        if not msg.tool_calls:
            raise ValueError("Model did not output tool calls for propose_orders_from_diagnosis")

        tc = msg.tool_calls[0]
        tool_args = json.loads(tc.function.arguments)

        prescription_design = tool_args["prescription"]
        requisition_design = tool_args["requisition"]
        print("[DEBUG] Step 2: Successfully parsed AI-generated prescription and requisition designs.")

        # 3) 用生成的字段 + patient_id 调用底层两个工具完成真正入库
        print("[DEBUG] Step 3: Persisting generated orders into the database...")
        pres_args = {"patient_id": patient_id, **prescription_design}
        req_args = {"patient_id": patient_id, **requisition_design}

        print("[DEBUG] Creating prescription...")
        created_pres = tool_create_prescription_from_latest_diagnosis(pres_args)
        print("[DEBUG] Prescription created successfully.")

        print("[DEBUG] Creating requisition...")
        created_req = tool_create_requisition_from_latest_diagnosis(req_args)
        print("[DEBUG] Requisition created successfully.")

        final_result = {
            "patient_id": patient_id,
            "diagnosis": dx,
            "prescription": created_pres,
            "requisition": created_req,
        }

        end_time = time.time()
        print(f"[DEBUG] --- tool_generate_orders_from_latest_diagnosis finished successfully. Total time: {end_time - start_time:.2f} seconds. ---\n")
        return final_result

    except Exception as e:
        # 捕获并打印任何异常，这对于调试至关重要
        print(f"\n[ERROR] An exception occurred in tool_generate_orders_from_latest_diagnosis: {type(e).__name__}: {e}")
        # 重新引发异常，以便 FastAPI 可以将其作为 5xx 错误返回给客户端
        raise


# --- 新增：补全已有 PRESCRIPTION_FORM（不改 pharmacy_id） ---

@register_tool
def tool_complete_prescription_from_diagnosis(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool: complete_prescription_from_diagnosis

    PURPOSE:
      Given a patient_id and an existing PRESCRIPTION_FORM (by prescription_id),
      use the latest diagnosis_description plus current form content to COMPLETE
      or refine the prescription fields. The pharmacy_id MUST remain unchanged.

    EXPECTED INPUT (args dict):
      {
        "patient_id": <int>,          # REQUIRED. Patient id.
        "prescription_id": <str>      # REQUIRED. Existing prescription_id to complete.
      }

    BEHAVIOR:
      1) Load latest diagnosis for this patient.
      2) Load existing prescription form by prescription_id.
      3) Ask an AI (OpenAI) to propose updated values ONLY for:
           - medication_name
           - medication_strength
           - medication_form
           - dosage_instructions
           - quantity
           - refills_allowed
           - expiry_date
           - status
           - notes
         based on diagnosis_description and current prescription content.
      4) Call crud.update_prescription(...) to persist changes.
      5) Return the updated prescription row as dict.
    """
    start_time = time.time()
    patient_id = int(args["patient_id"])
    prescription_id = str(args["prescription_id"])

    # 1) 获取最新诊断
    dx = crud.get_latest_diagnosis_by_patient(patient_id)
    if not dx:
        raise ValueError(f"No latest diagnosis found for patient_id={patient_id}")
    diag_desc = (dx.get("diagnosis_description") or "").strip()
    if not diag_desc:
        raise ValueError(f"Latest diagnosis for patient_id={patient_id} has empty description")

    # 2) 获取已有处方
    pres = crud.get_prescription(prescription_id)
    if not pres:
        raise ValueError(f"Prescription with id={prescription_id} not found")

    # 保留原 pharmacy_id，不允许 AI 修改
    original_pharmacy_id = pres.get("pharmacy_id")

    # 3) 调用 OpenAI 生成“补全字段”
    system_prompt = (
        "You are a clinical decision support assistant. "
        "You are given:\n"
        "1) A patient's latest diagnosis description.\n"
        "2) An existing prescription form (JSON).\n\n"
        "Your task: propose UPDATED values ONLY for editable fields, to make the prescription\n"
        "clinically appropriate and complete. Do NOT invent or modify any pharmacy_id.\n"
        "You MUST respond ONLY with JSON according to the provided tool schema."
    )

    user_prompt = (
        f"Patient id: {patient_id}\n"
        f"Latest diagnosis_description:\n"
        f"--------------------\n{diag_desc}\n--------------------\n\n"
        f"Existing prescription JSON:\n"
        f"{json.dumps(pres, indent=2)}\n\n"
        "Please fill or adjust ONLY these fields:\n"
        "- medication_name\n"
        "- medication_strength\n"
        "- medication_form\n"
        "- dosage_instructions\n"
        "- quantity\n"
        "- refills_allowed\n"
        "- expiry_date (ISO date, e.g. 2025-12-31)\n"
        "- status\n"
        "- notes\n"
        "Do NOT include pharmacy_id in your output."
    )

    tools_spec = [
        {
            "type": "function",
            "function": {
                "name": "propose_completed_prescription",
                "description": "Propose updated fields for an existing prescription form.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "medication_name": {"type": "string"},
                        "medication_strength": {"type": "string"},
                        "medication_form": {"type": "string"},
                        "dosage_instructions": {"type": "string"},
                        "quantity": {"type": "integer"},
                        "refills_allowed": {"type": "integer"},
                        "expiry_date": {"type": "string"},
                        "status": {"type": "string"},
                        "notes": {"type": "string"}
                    },
                    "required": [
                        "medication_name",
                        "medication_strength",
                        "medication_form",
                        "dosage_instructions",
                        "quantity",
                        "refills_allowed",
                        "expiry_date",
                        "status",
                        "notes"
                    ]
                },
            },
        }
    ]

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        tools=tools_spec,
        tool_choice={"type": "function", "function": {"name": "propose_completed_prescription"}},
    )

    msg = resp.choices[0].message
    if not msg.tool_calls:
        raise ValueError("Model did not output tool calls for propose_completed_prescription")

    tc = msg.tool_calls[0]
    tool_args = json.loads(tc.function.arguments)

    # 4) 构造更新 payload，只填可编辑字段
    update_payload = schemas.PrescriptionFormUpdate(
        medication_name=tool_args.get("medication_name"),
        medication_strength=tool_args.get("medication_strength"),
        medication_form=tool_args.get("medication_form"),
        dosage_instructions=tool_args.get("dosage_instructions"),
        quantity=tool_args.get("quantity"),
        refills_allowed=tool_args.get("refills_allowed"),
        expiry_date=tool_args.get("expiry_date"),
        status=tool_args.get("status"),
        notes=tool_args.get("notes"),
    )

    updated = crud.update_prescription(prescription_id, update_payload) or pres

    # 强制确保 pharmacy_id 不被修改
    if updated.get("pharmacy_id") != original_pharmacy_id:
        updated["pharmacy_id"] = original_pharmacy_id

    end_time = time.time()
    print(f"[DEBUG] tool_complete_prescription_from_diagnosis finished in {end_time - start_time:.2f}s")
    return updated


# --- 新增：补全已有 REQUISITION_FORM（不改 lab_id） ---

@register_tool
def tool_complete_requisition_from_diagnosis(args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tool: complete_requisition_from_diagnosis

    PURPOSE:
      Given a patient_id and an existing REQUISITION_FORM (by requisition_id),
      use the latest diagnosis_description plus current form content to COMPLETE
      or refine the requisition fields. The lab_id MUST remain unchanged.

    EXPECTED INPUT (args dict):
      {
        "patient_id": <int>,          # REQUIRED. Patient id.
        "requisition_id": <str>       # REQUIRED. Existing requisition_id to complete.
      }

    BEHAVIOR:
      1) Load latest diagnosis for this patient.
      2) Load existing requisition form by requisition_id.
      3) Ask an AI (OpenAI) to propose updated values ONLY for:
           - department
           - test_type
           - test_code
           - clinical_info
           - priority
           - status
           - result_date
           - notes
         based on diagnosis_description and current requisition content.
      4) Call crud.update_requisition(...) to persist changes.
      5) Return the updated requisition row as dict.
    """
    start_time = time.time()
    patient_id = int(args["patient_id"])
    requisition_id = str(args["requisition_id"])

    dx = crud.get_latest_diagnosis_by_patient(patient_id)
    if not dx:
        raise ValueError(f"No latest diagnosis found for patient_id={patient_id}")
    diag_desc = (dx.get("diagnosis_description") or "").strip()
    if not diag_desc:
        raise ValueError(f"Latest diagnosis for patient_id={patient_id} has empty description")

    req = crud.get_requisition(requisition_id)
    if not req:
        raise ValueError(f"Requisition with id={requisition_id} not found")

    original_lab_id = req.get("lab_id")

    system_prompt = (
        "You are a clinical decision support assistant.\n"
        "You are given:\n"
        "1) A patient's latest diagnosis description.\n"
        "2) An existing lab requisition form (JSON).\n\n"
        "Your task: propose UPDATED values ONLY for editable fields, to make the requisition\n"
        "clinically appropriate and complete. Do NOT invent or modify any lab_id.\n"
        "You MUST respond ONLY with JSON according to the provided tool schema."
    )

    user_prompt = (
        f"Patient id: {patient_id}\n"
        f"Latest diagnosis_description:\n"
        f"--------------------\n{diag_desc}\n--------------------\n\n"
        f"Existing requisition JSON:\n"
        f"{json.dumps(req, indent=2)}\n\n"
        "Please fill or adjust ONLY these fields:\n"
        "- department\n"
        "- test_type\n"
        "- test_code\n"
        "- clinical_info\n"
        "- priority\n"
        "- status\n"
        "- result_date (ISO datetime, e.g. 2025-11-25T10:00:00.000Z or null)\n"
        "- notes\n"
        "Do NOT include lab_id in your output."
    )

    tools_spec = [
        {
            "type": "function",
            "function": {
                "name": "propose_completed_requisition",
                "description": "Propose updated fields for an existing requisition form.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "department": {"type": "string"},
                        "test_type": {"type": "string"},
                        "test_code": {"type": ["string", "null"]},
                        "clinical_info": {"type": "string"},
                        "priority": {"type": "string"},
                        "status": {"type": "string"},
                        "result_date": {"type": ["string", "null"]},
                        "notes": {"type": "string"}
                    },
                    "required": [
                        "department",
                        "test_type",
                        "clinical_info",
                        "priority",
                        "status",
                        "result_date",
                        "notes"
                    ]
                },
            },
        }
    ]

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        tools=tools_spec,
        tool_choice={"type": "function", "function": {"name": "propose_completed_requisition"}},
    )

    msg = resp.choices[0].message
    if not msg.tool_calls:
        raise ValueError("Model did not output tool calls for propose_completed_requisition")

    tc = msg.tool_calls[0]
    tool_args = json.loads(tc.function.arguments)

    update_payload = schemas.RequisitionFormUpdate(
        department=tool_args.get("department"),
        test_type=tool_args.get("test_type"),
        test_code=tool_args.get("test_code"),
        clinical_info=tool_args.get("clinical_info"),
        priority=tool_args.get("priority"),
        status=tool_args.get("status"),
        result_date=tool_args.get("result_date"),
        notes=tool_args.get("notes"),
    )

    updated = crud.update_requisition(requisition_id, update_payload) or req

    # 强制确保 lab_id 不被修改
    if updated.get("lab_id") != original_lab_id:
        updated["lab_id"] = original_lab_id

    end_time = time.time()
    print(f"[DEBUG] tool_complete_requisition_from_diagnosis finished in {end_time - start_time:.2f}s")
    return updated

