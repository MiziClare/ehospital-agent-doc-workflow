# eHealth API 文档

Base URL: `http://127.0.0.1:8000/api`

所有接口均返回 JSON；错误时返回形如：

```json
{
  "detail": "Error message ..."
}
```

---

## 0. 重要说明（数据库与地址经纬度约定）

### 0.1 使用的远端数据库表

本服务所有业务数据均来自远端的“表 API”，通过 HTTP 代理访问，不直接使用本地 SQLite 持久化（本地 `app/models.py` / `app/database.py` 仅作文档和未来迁移预留）。

当前使用的远端表及 URL：

```python
tables = [
    ("patients_registration", "https://aetab8pjmb.us-east-1.awsapprunner.com/table/patients_registration"),
    ("diagnosis",             "https://aetab8pjmb.us-east-1.awsapprunner.com/table/diagnosis"),
    ("patient_preference",    "https://aetab8pjmb.us-east-1.awsapprunner.com/table/patient_preference"),
    ("prescription_form",     "https://aetab8pjmb.us-east-1.awsapprunner.com/table/prescription_form"),
    ("requisition_form",      "https://aetab8pjmb.us-east-1.awsapprunner.com/table/requisition_form"),
    ("pharmacy_registration", "https://aetab8pjmb.us-east-1.awsapprunner.com/table/pharmacy_registration"),
    ("lab_registration",      "https://aetab8pjmb.us-east-1.awsapprunner.com/table/lab_registration"),
]
```

所有 CRUD 都是对这些 URL 做 `GET/POST/PUT` 调用。

---

### 0.2 地址字段 + 经纬度编码格式（非常重要）

由于当前数据库 schema 没有单独的 `lat` / `lng` 列，我们在部分表中采用了统一的“地址 + 坐标”编码格式：

```text
原始地址字符串||{"lat": 45.4215, "lng": -75.6972}
```

**使用该格式的字段：**

1. `patients_registration.contact_info`  
2. `pharmacy_registration.address`  
3. `lab_registration.address`  

例如：

```text
2640 Lancaster Road, Unit C, Ottawa, Ontario, K1B 4Z4||{"lat": 45.4615063322454, "lng": -75.72924164728838}
```

#### 约定说明：

1. `||` 之前是普通可读地址（患者地址 / 药店地址 / 实验室地址）。
2. `||` 用作分隔符，真实地址中几乎不会出现。
3. `||` 之后是一个 JSON 字符串，包含 `lat`、`lng`，例如：

   ```json
   {"lat": 45.4615063322454, "lng": -75.72924164728838}
   ```

4. 后端解析逻辑（在 `app/crud.py` 的 `_parse_address_with_coords` 中）：
   - 使用 `value.split("||", 1)`：
     - 第一部分 → 纯地址字符串（用于显示等）
     - 第二部分 → 使用 `json.loads` 解析为 `{ "lat": ..., "lng": ... }`
   - 若解析失败或缺少 `lat` / `lng`，视为无坐标。

5. 距离计算接口依赖这些坐标：
   - `/pharmacies/nearest/{patient_id}`：使用患者 contact_info 与 pharmacy address 的经纬度计算距离；
   - `/labs/nearest/{patient_id}`：使用患者 contact_info 与 lab address 的经纬度计算距离。

#### 对数据库维护人员的要求：

- 以后凡是希望参与“距离计算 / 地图展示 / 附近搜索”的记录，其地址字段都应按上述格式写入；
- 当前之所以采用此方案，是受现有 DB 结构限制；
- **未来建议**：
  1. 为上述含地址字段的表增加显式的 `lat` / `lng` 列；
  2. 将现有 `"||{...}"` 中的经纬度迁移到新列；
  3. 同步修改依赖经纬度的后端逻辑与其他系统。

---

> 下文为各 HTTP 接口的中文说明，前端与其他成员在使用时建议先阅读本节的“远端表 + 地址经纬度约定”。

---

## 1. Patients（病人）

### 1.1 创建病人

- **URL**: `POST /patients`
- **Body** (`PatientsRegistrationCreate`):

```json
{
  "name": "Test Patient 01",
  "dob": "1980-01-01",
  "gender": "Male",
  "contact_info": "123 Test Street||{\"lat\": 45.42, \"lng\": -75.69}",
  "phone_number": "123-456-7890",
  "OHIP_code": null,
  "private_insurance_name": null,
  "private_insurance_id": null,
  "weight_kg": "70",
  "height_cm": "175",
  "family_doctor_id": null
}
```

- **Response** (`PatientsRegistrationOut`):

```json
{
  "name": "...",
  "dob": "...",
  "gender": "...",
  "contact_info": "...",
  "phone_number": "...",
  "OHIP_code": null,
  "private_insurance_name": null,
  "private_insurance_id": null,
  "weight_kg": "...",
  "height_cm": "...",
  "family_doctor_id": null,
  "patient_id": 1
}
```

---

### 1.2 列出病人

- **URL**: `GET /patients`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100, max=1000)
- **Response**: `PatientsRegistrationOut[]`

---

### 1.3 获取单个病人

- **URL**: `GET /patients/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `PatientsRegistrationOut`
- **Errors**:
  - `404 Patient not found`

---

## 2. Diagnosis（诊断）

### 2.1 创建诊断

- **URL**: `POST /diagnosis`
- **Body** (`DiagnosisCreate`):

```json
{
  "patient_id": 1,
  "doctor_id": 1,
  "diagnosis_code": "DX001",
  "diagnosis_description": "Some detailed diagnosis text",
  "diagnosis_date": "2025-05-17"
}
```

- **Response** (`DiagnosisOut`): 上述字段 + `diagnosis_id`.

---

### 2.2 按 patient_id 查询所有诊断（query）

- **URL**: `GET /diagnosis`
- **Query**:
  - `patient_id` (int, required)
- **Response**: `DiagnosisOut[]`
- **Errors**:
  - `400 patient_id is required`

---

### 2.3 按 patient_id 查询所有诊断（path）

- **URL**: `GET /diagnosis/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `DiagnosisOut[]`

---

### 2.4 获取病人最新诊断

- **URL**: `GET /diagnosis/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `DiagnosisOut`
- **Errors**:
  - `404 Diagnosis not found for patient`

---

## 3. Patient Preference（偏好：药店 / 实验室）

### 3.1 创建偏好

- **URL**: `POST /preferences`
- **Body** (`PatientPreferenceCreate`):

```json
{
  "patient_id": 1,
  "preference_type": "pharmacy",   // 或 "lab"
  "pharmacy_id": 1,                // 当 preference_type="pharmacy" 时必填
  "lab_id": null,                  // 必须为 null
  "notes": "Preferred pharmacy"
}
```

- 验证规则：
  - 当 `preference_type = "pharmacy"`:
    - `pharmacy_id` 必须有值
    - `lab_id` 必须为 `null`
  - 当 `preference_type = "lab"`:
    - `lab_id` 必须有值
    - `pharmacy_id` 必须为 `null`
- **Response** (`PatientPreferenceOut`): 上述字段 + `preference_id`.

---

### 3.2 列出所有偏好

- **URL**: `GET /preferences`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `PatientPreferenceOut[]`

---

### 3.3 按 patient_id + type 返回精简偏好列表

- **URL**: `GET /preferences/by-patient`
- **Query**:
  - `patient_id` (int, required)
  - `preference_type` (str, `"pharmacy"` 或 `"lab"`)
- **Response** (`PatientPreferenceSlimOut[]`):

```json
[
  {
    "target_id": 1,     // pharmacy_id 或 lab_id
    "notes": "..."
  }
]
```

---

### 3.4 获取病人的 pharmacy 偏好（含详细信息 + 距离）

- **URL**: `GET /preferences/pharmacy`
- **Query**:
  - `patient_id` (int, required)
- **行为**：
  - 读取该病人的 `contact_info`，解析经纬度；
  - 遍历 `pharmacy_registration` 表中所有药店；
  - 对每个偏好对应的 pharmacy 计算距离并返回详细信息及备注。
- **Response** (`PreferredPharmacyOut[]`):

```json
[
  {
    "pharmacy_id": 1,
    "name": "Pharmacy Name",
    "email": "xxx@example.com",
    "phone_number": "555-123",
    "address": "123 Street, City",       // 去掉 "||{lat,lng}" 后的纯地址
    "coordinates": { "lat": 45.42, "lng": -75.69 },
    "distance_km": 1.23,
    "notes": "Preferred pharmacy for ..."
  }
]
```

---

### 3.5 获取病人的 lab 偏好（含详细信息 + 距离）

- **URL**: `GET /preferences/lab`
- **Query**:
  - `patient_id` (int, required)
- **Response** (`PreferredLabOut[]`):

```json
[
  {
    "lab_id": 1,
    "name": "Lab Name",
    "email": "lab@example.com",
    "phone_number": "555-987",
    "address": "456 Lab Avenue, City",
    "coordinates": { "lat": 45.42, "lng": -75.69 },
    "distance_km": 2.34,
    "notes": "Preferred lab for tests"
  }
]
```

---

## 4. Prescription（处方）

### 4.1 创建处方（自增 prescription_id）

- **URL**: `POST /prescriptions`
- **Body** (`PrescriptionFormCreate`):

```json
{
  "patient_id": 1,
  "prescriber_id": "DOC001",
  "medication_name": "Amoxicillin",
  "medication_strength": "500mg",
  "medication_form": "Tablet",
  "dosage_instructions": "Take 1 tablet 3 times daily with food",
  "quantity": 21,
  "refills_allowed": 2,
  "date_prescribed": "2025-11-22T00:00:00.000Z",
  "expiry_date": "2025-12-31",
  "status": "active",
  "notes": "Complete full course...",
  "pharmacy_id": 1
}
```

- **行为**：
  - 从远端 `prescription_form` 读出所有记录；
  - 本地计算最大的 numeric `prescription_id`，加 1 作为新的 id；
  - 写入远端表。
- **Response** (`PrescriptionFormOut`):

```json
{
  "...": "...",
  "prescription_id": "1763831311"
}
```

---

### 4.2 列出所有处方（带 pharmacy 信息）

- **URL**: `GET /prescriptions`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response** (`PrescriptionWithPharmacyOut[]`):

```json
[
  {
    "prescription": { /* PrescriptionFormOut */ },
    "pharmacy_name": "Wagner Group",
    "pharmacy_address": "13741 Williams Summit Suite 524, New Anthonyshire, SD 60977"
  }
]
```

其中 `pharmacy_address` 是去除 `"||{\"lat\":...}"` 后的纯地址。

---

### 4.3 获取单个处方（带 pharmacy 信息）

- **URL**: `GET /prescriptions/{prescription_id}`
- **Path**:
  - `prescription_id` (str)
- **Response** (`PrescriptionWithPharmacyOut`):

```json
{
  "prescription": {
    "patient_id": 1,
    "prescriber_id": "1",
    "medication_name": "Penicillin V",
    "medication_strength": "500 mg",
    "medication_form": "tablet",
    "dosage_instructions": "Take one tablet orally every 6 hours for 10 days",
    "quantity": 40,
    "refills_allowed": 0,
    "date_prescribed": "2025-11-23T08:40:35.000Z",
    "expiry_date": "2025-12-23",
    "status": "active",
    "notes": "Complete the full course as prescribed.",
    "pharmacy_id": 2,
    "prescription_id": "1763831311"
  },
  "pharmacy_name": "Wagner Group",
  "pharmacy_address": "13741 Williams Summit Suite 524, New Anthonyshire, SD 60977"
}
```

- **Errors**:
  - `404 Prescription not found`

---

### 4.4 部分更新处方（PATCH）

- **URL**: `PATCH /prescriptions/{prescription_id}`
- **Path**:
  - `prescription_id` (str)
- **Body** (`PrescriptionFormUpdate`，所有字段可选):

```json
{
  "medication_name": "...",
  "medication_strength": "...",
  "medication_form": "...",
  "dosage_instructions": "...",
  "quantity": 10,
  "refills_allowed": 0,
  "expiry_date": "2025-12-31",
  "status": "completed",
  "notes": "..."
}
```

- **行为**：
  - 先从远端查现有记录，若不存在则返回 404；
  - 过滤掉与原值相同的字段（无实际变化时不发 PUT）；
  - 对有变化的字段调用远端 PUT `/table/prescription_form/{id}`；
  - 再返回最新记录。
- **Response**: 更新后的 `PrescriptionFormOut`
- **Errors**:
  - `404 Prescription not found to update.`

---

### 4.5 获取病人最新处方（含 pharmacy 信息）

- **URL**: `GET /prescriptions/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **行为**：
  - 在 `prescription_form` 中按 `patient_id` 过滤；
  - 按 `date_prescribed` + `prescription_id` 排序取最新；
  - 如果有 `pharmacy_id`，从 `pharmacy_registration` 读出名称和地址，并去掉地址中的经纬度部分。
- **Response** (`PrescriptionWithPharmacyOut`):

```json
{
  "prescription": { /* PrescriptionFormOut */ },
  "pharmacy_name": "Wagner Group",
  "pharmacy_address": "13741 Williams Summit Suite 524, New Anthonyshire, SD 60977"
}
```

---

### 4.6 为指定处方设置 pharmacy_id（幂等）

- **URL**: `PUT /prescriptions/{prescription_id}/pharmacy`
- **Path**:
  - `prescription_id` (str)
- **Body** (`UpdatePrescriptionPharmacyRequest`):

```json
{
  "pharmacy_id": 2
}
```

- **行为**：
  - 通过 `crud.get_prescription` 检查记录是否存在；
  - 若记录不存在 → `404 Could not find prescription to update.`；
  - 若当前 `pharmacy_id` 与请求相同 → 视为幂等成功，不调用远端 PUT，直接返回现有记录；
  - 否则调用远端 `PUT /table/prescription_form/{prescription_id}` 更新 `pharmacy_id`；
  - 最后重新读取并返回更新后的记录。
- **Response**: `PrescriptionFormOut`

---

### 4.7 模拟将处方传真到对应 pharmacy

- **URL**: `POST /prescriptions/{prescription_id}/fax`
- **Path**:
  - `prescription_id` (str)
- **行为**：
  - 从 `PRESCRIPTION_FORM` 获取一条记录；
  - 若不存在 → `404 Prescription with ID ... not found.`；
  - 若该记录 `pharmacy_id` 为空 → `400 Prescription ... has no associated pharmacy_id.`；
  - 否则读取 `patient_id` 和 `pharmacy_id`，在服务器控制台打印模拟日志：
    - `[FAX SIMULATION] Fax sent for patient (ID: X)'s prescription form (ID: Y) to pharmacy (ID: Z).`
  - 同时以字符串形式返回这句话。
- **Response** (string):

```text
"Fax sent for patient (ID: 1)'s prescription form (ID: 1763831311) to pharmacy (ID: 2)."
```

---

## 5. Requisition（检验申请）

### 5.1 创建检验申请（自增 requisition_id）

- **URL**: `POST /requisitions`
- **Body** (`RequisitionFormCreate`):

```json
{
  "patient_id": 1,
  "lab_id": 1,
  "department": "General Medicine",
  "test_type": "Laboratory Test",
  "test_code": null,
  "clinical_info": null,
  "date_requested": "2025-11-22T00:00:00.000Z",
  "priority": "Routine",
  "status": "Pending",
  "result_date": null,
  "notes": "Initial blood work"
}
```

- **行为**：
  - 从远端表读取所有记录，按 numeric requisition_id 计算下一个 ID；
  - 写入远端表。
- **Response** (`RequisitionFormOut`)

---

### 5.2 列出所有检验申请（带 lab 信息）

- **URL**: `GET /requisitions`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response** (`RequisitionWithLabOut[]`):

```json
[
  {
    "requisition": { /* RequisitionFormOut */ },
    "lab_name": "Lab Name",
    "lab_address": "210 Centrum Blvd, Orléans, ON, K1E 2P5"
  }
]
```

---

### 5.3 获取单个检验申请（带 lab 信息）

- **URL**: `GET /requisitions/{requisition_id}`
- **Path**:
  - `requisition_id` (str)
- **Response** (`RequisitionWithLabOut`):

```json
{
  "requisition": {
    "patient_id": 1,
    "lab_id": 2,
    "department": "Microbiology",
    "test_type": "Throat Culture",
    "test_code": null,
    "clinical_info": "Suspected acute streptococcal pharyngitis with sore throat, fever, and swollen tonsils. Culture to confirm diagnosis and guide antibiotic therapy.",
    "date_requested": "2025-11-23T08:40:36.000Z",
    "priority": "urgent",
    "status": "requested",
    "result_date": null,
    "notes": "Please process promptly.",
    "requisition_id": "1763837271"
  },
  "lab_name": "Bio-Test Main Lab (Bells Corners)",
  "lab_address": "2006 Robertson Rd, Ottawa, ON, K2H 1A5"
}
```

- **Errors**:
  - `404 Requisition not found`

---

### 5.4 部分更新检验申请（PATCH）

- **URL**: `PATCH /requisitions/{requisition_id}`
- **Path**:
  - `requisition_id` (str)
- **Body** (`RequisitionFormUpdate`，字段均可选):

```json
{
  "department": "General Medicine",
  "test_type": "CBC",
  "test_code": "CBC",
  "clinical_info": "updated info",
  "priority": "Urgent",
  "status": "Completed",
  "result_date": "2025-11-25T10:00:00.000Z",
  "notes": "..."
}
```

- **行为**：
  - 获取现有记录；
  - 过滤掉与原值相同的字段；
  - 有变化时调用远端 PUT 更新；
  - 返回最新记录。
- **Response**: `RequisitionFormOut`
- **Errors**:
  - `404 Requisition not found to update.`

---

### 5.5 获取病人最新检验申请（含 lab 信息）

- **URL**: `GET /requisitions/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response** (`RequisitionWithLabOut`):

```json
{
  "requisition": { /* RequisitionFormOut */ },
  "lab_name": "Bio-Test Laboratory - Centrum PSC",
  "lab_address": "210 Centrum Blvd, Orléans, ON, K1E 2P5"
}
```

---

### 5.6 为指定检验申请设置 lab_id（幂等）

- **URL**: `PUT /requisitions/{requisition_id}/lab`
- **Path**:
  - `requisition_id` (str)
- **Body**:

```json
{
  "lab_id": 2
}
```

- **行为**：
  - 通过 `crud.get_requisition` 检查记录是否存在；
  - 若记录不存在 → `404 Requisition not found.`；
  - 若当前 `lab_id` 与请求相同 → 幂等成功，不发 PUT，直接返回现有记录；
  - 否则调用远端 `PUT /table/requisition_form/{requisition_id}` 更新 `lab_id`；
  - 返回更新后的记录。
- **Response**: `RequisitionFormOut`

---

### 5.7 模拟将检验申请传真到对应 lab

- **URL**: `POST /requisitions/{requisition_id}/fax`
- **Path**:
  - `requisition_id` (str)
- **行为**：
  - 从 `REQUISITION_FORM` 获取记录；
  - 若不存在 → `404 Requisition with ID ... not found.`；
  - 若 `lab_id` 为空 → `400 Requisition ... has no associated lab_id.`；
  - 否则打印模拟传真日志：
    - `[FAX SIMULATION] Fax sent for patient (ID: X)'s requisition form (ID: Y) to lab (ID: Z).`
  - 同时将该句英文作为响应返回。
- **Response** (string):

```text
"Fax sent for patient (ID: 1)'s requisition form (ID: 1763837273) to lab (ID: 3)."
```

---

## 6. Pharmacy（药店）

### 6.1 创建 Pharmacy

- **URL**: `POST /pharmacies`
- **Body** (`PharmacyRegistrationCreate`):

```json
{
  "name": "Test Pharmacy 01",
  "email": "pharmacy01@example.com",
  "phone_number": "555-111-2222",
  "address": "174 Bank St, Ottawa, ON K2P 1W6||{\"lat\": 45.4209, \"lng\": -75.6950}",
  "license_no": "LIC-0001",
  "status": "active",
  "registered_on": "2025-07-11T20:42:41.000Z"
}
```

- **Response** (`PharmacyRegistrationOut`):

```json
{
  "...": "...",
  "pharmacy_id": 1
}
```

---

### 6.2 列出 Pharmacy

- **URL**: `GET /pharmacies`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `PharmacyRegistrationOut[]`

---

### 6.3 获取单个 Pharmacy

- **URL**: `GET /pharmacies/{pharmacy_id}`
- **Path**:
  - `pharmacy_id` (int)
- **Response**: `PharmacyRegistrationOut`
- **Errors**:
  - `404 Pharmacy not found`

---

### 6.4 获取距离病人最近的 5 个药店

- **URL**: `GET /pharmacies/nearest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **行为**：
  - 使用 `patients_registration.contact_info` 的经纬度，与每个 pharmacy 的 `address` 中的经纬度计算 haversine 距离；
  - 按距离排序，返回前 5 个。
- **Response** (`NearbyPharmacyOut[]`):

```json
[
  {
    "pharmacy_id": 8,
    "name": "Collins LLC",
    "email": "lisahaley@lopez.com",
    "phone_number": "(773)798-9683x555",
    "address": "36862 Nelson Loop, North Tami, HI 06262",
    "coordinates": {
      "lat": 45.415650249941976,
      "lng": -75.70097863099235
    },
    "distance_km": 2.02
  }
]
```

---

## 7. Lab（实验室）

### 7.1 创建 Lab

- **URL**: `POST /labs`
- **Body** (`LabRegistrationCreate`):

```json
{
  "name": "Test Lab 01",
  "email": "test.lab@example.com",
  "phone_number": "555-987-6543",
  "address": "456 Lab Avenue, Ottawa, ON||{\"lat\": 45.4215, \"lng\": -75.6972}",
  "license_no": "LAB-TEST-0001",
  "status": "active",
  "registered_on": "2025-11-22T19:02:08.000Z"
}
```

- **Response** (`LabRegistrationOut`)

---

### 7.2 列出 Lab

- **URL**: `GET /labs`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `LabRegistrationOut[]`

---

### 7.3 获取单个 Lab

- **URL**: `GET /labs/{lab_id}`
- **Path**:
  - `lab_id` (int)
- **Response**: `LabRegistrationOut`
- **Errors**:
  - `404 Lab not found`

---

### 7.4 获取距离病人最近的 5 个实验室

- **URL**: `GET /labs/nearest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response** (`NearbyLabOut[]`):

```json
[
  {
    "lab_id": 6,
    "name": "Bio-Test Laboratory - Centrum PSC",
    "email": "info.biotestlaboratorycentrumpsc@aetab.ca",
    "phone_number": "613-588-4243",
    "address": "210 Centrum Blvd, Orléans, ON, K1E 2P5",
    "coordinates": {
      "lat": 45.40815438161423,
      "lng": -75.7262129688103
    },
    "distance_km": 1.02
  }
]
```

---

## 8. Workflow / Agent 工具

### 8.1 通用工具执行入口

- **URL**: `POST /workflow`
- **Body** (`WorkflowRequest`):

```json
{
  "tool": "tool_create_prescription_from_latest_diagnosis",
  "arguments": {
    "...": "tool-specific fields..."
  },
  "query": "optional natural language, not used by backend"
}
```

- **行为**：
  - 根据 `tool` 名从 `app.llm_tools.TOOLS` 中找到对应函数；
  - 以 `arguments` 作为 `args` 调用该函数；
  - 将返回值放入 `result` 字段返回。
- **Response** (`WorkflowResponse`):

```json
{
  "tool": "tool_create_prescription_from_latest_diagnosis",
  "arguments": { "...": "..." },
  "result": { "...": "tool return JSON..." }
}
```

当前已注册的主要工具包括（但不限于）：

- `tool_create_prescription_from_latest_diagnosis`
- `tool_create_requisition_from_latest_diagnosis`
- `tool_generate_orders_from_latest_diagnosis`
- `tool_complete_prescription_from_diagnosis`
- `tool_complete_requisition_from_diagnosis`

---

### 8.2 高层工作流：根据最新诊断自动生成处方 + 检验单

- **URL**: `POST /workflow/generate-orders`
- **Body** (`AutoOrdersRequest`):

```json
{
  "patient_id": 1
}
```

- **行为**：
  - 后端调用工具 `tool_generate_orders_from_latest_diagnosis`：
    1. 使用 `crud.get_latest_diagnosis_by_patient` 读取该病人最新诊断；
    2. 调用 OpenAI（function calling）由 AI 设计一份处方和一份检验申请；
    3. 分别调用 `tool_create_prescription_from_latest_diagnosis` /
       `tool_create_requisition_from_latest_diagnosis` 入库；
       - 新建处方的 `pharmacy_id` 为 `null`；
       - 新建检验申请的 `lab_id` 为 `null`。
  - 返回创建的两条记录。
- **Response** (`AutoOrdersResponse`):

```json
{
  "patient_id": 1,
  "prescription": { /* PrescriptionFormOut */ },
  "requisition": { /* RequisitionFormOut */ }
}
```

---

### 8.3 高层工作流：补全已有处方（不改 pharmacy_id）

- **URL**: `POST /workflow/complete-prescription`
- **Body** (`CompletePrescriptionRequest`):

```json
{
  "patient_id": 1,
  "prescription_id": "1764717231"
}
```

- **行为**：
  - 后端调用工具 `tool_complete_prescription_from_diagnosis`：
    1. 根据 `patient_id` 读取最新诊断（`diagnosis_description`）；
    2. 根据 `prescription_id` 读取现有 `PRESCRIPTION_FORM` 记录；
    3. 将诊断描述 + 当前处方 JSON 一并发给 OpenAI，请 AI 仅补全 / 修改可编辑字段：
       - `medication_name`
       - `medication_strength`
       - `medication_form`
       - `dosage_instructions`
       - `quantity`
       - `refills_allowed`
       - `expiry_date`
       - `status`
       - `notes`
       （绝不修改 `pharmacy_id`）；
    4. 将 AI 返回的字段映射到 `PrescriptionFormUpdate`，调用 `crud.update_prescription` 入库；
    5. 返回更新后的处方。
- **Response** (`CompletePrescriptionResponse`):

```json
{
  "patient_id": 1,
  "prescription": { /* PrescriptionFormOut */ }
}
```

---

### 8.4 高层工作流：补全已有检验申请（不改 lab_id）

- **URL**: `POST /workflow/complete-requisition`
- **Body** (`CompleteRequisitionRequest`):

```json
{
  "patient_id": 1,
  "requisition_id": "1763837273"
}
```

- **行为**：
  - 后端调用工具 `tool_complete_requisition_from_diagnosis`：
    1. 根据 `patient_id` 读取该病人最新诊断；
    2. 根据 `requisition_id` 读取现有 `REQUISITION_FORM` 记录；
    3. 将诊断描述 + 当前 requisition JSON 发给 OpenAI，请 AI 仅补全 / 修改可编辑字段：
       - `department`
       - `test_type`
       - `test_code`
       - `clinical_info`
       - `priority`
       - `status`
       - `result_date`
       - `notes`
       （不修改 `lab_id`）；
    4. 将 AI 返回的字段映射为 `RequisitionFormUpdate`，调用 `crud.update_requisition` 入库；
    5. 返回更新后的检验申请。
- **Response** (`CompleteRequisitionResponse`):

```json
{
  "patient_id": 1,
  "requisition": { /* RequisitionFormOut */ }
}
```

---

> 本文档与当前仓库代码（`app/routers.py`, `app/schemas.py`, `app/llm_tools.py`, `app/crud.py`）保持一致。如未来调整后端实现，请同步更新本文件。
