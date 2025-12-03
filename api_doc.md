# eHealth API Documentation (EN)

Base URL: `http://127.0.0.1:8000/api`

---

## 0. Important Notes for Backend / DB Administrators

### 0.1 Remote Tables (Read/Write via HTTP)

All business data is stored in a remote table service and accessed by this API through HTTP proxy calls.

Current tables and their base URLs:

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

The FastAPI service does **not** persist clinical data in its local SQLite DB.  
The SQLite models under `app/models.py` and `app/database.py` are kept only for future migration and documentation.

All CRUD logic talks directly to these remote endpoints.

---

### 0.2 Address + Coordinates Encoding Convention (Very Important)

We use a **combined address + coordinates** format in several tables, because the existing DB schema does **not** have separate `lat` / `lng` columns.

This convention is critical for:

- Distance calculation APIs (`/pharmacies/nearest/{patient_id}`, `/labs/nearest/{patient_id}`);
- Patient / Pharmacy / Lab geospatial features;
- Any future Google Maps or map-based UI integrations.

#### 0.2.1 Columns that use this convention

1. `patients_registration.contact_info`  
2. `pharmacy_registration.address`  
3. `lab_registration.address`  

Each of these fields must be stored as:

```text
OriginalAddress||{"lat": 45.4215, "lng": -75.6972}
```

**Details:**

1. The first part is a human readable address string, e.g.  
   `2640 Lancaster Road, Unit C, Ottawa, Ontario, K1B 4Z4`
2. The separator is `||` (double pipe). It is chosen because it almost never appears in real-world addresses.
3. The second part is a JSON string with latitude and longitude:

   ```json
   {"lat": 45.4615063322454, "lng": -75.72924164728838}
   ```

   Full example:

   ```text
   2640 Lancaster Road, Unit C, Ottawa, Ontario, K1B 4Z4||{"lat": 45.4615063322454, "lng": -75.72924164728838}
   ```

4. Backend parsing logic (`crud._parse_address_with_coords`):

   - `field_value.split("||", 1)`
     - index 0 → plain address string (used for display / human reading)
     - index 1 → JSON string, parsed via `json.loads` to `{ "lat": ..., "lng": ... }`
   - If parsing fails or `lat` / `lng` are missing, coordinates are treated as `None`.

5. The distance APIs use these coordinates:

   - `/pharmacies/nearest/{patient_id}`:
     - reads `patients_registration.contact_info` + `pharmacy_registration.address`
   - `/labs/nearest/{patient_id}`:
     - reads `patients_registration.contact_info` + `lab_registration.address`

#### 0.2.2 DB Maintenance Guidelines

- Any new record in the above tables **must** follow this convention if it is expected to work with geospatial / distance APIs.
- For now we keep this encoding due to legacy schema limitations.
- A future migration plan should:
  1. Add explicit `lat` and `lng` columns to all tables with location fields;
  2. Migrate `||{...}` JSON data into those columns;
  3. Update backend parsing logic to prioritize the new columns and deprecate the string-encoded coordinates.

---

> The rest of this file documents each HTTP API endpoint for backend and frontend developers.  
> The Chinese version (`api_doc_CN.md`) carries the same information in Chinese.

---

## 1. Patients

### 1.1 Create Patient

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
  "family_doctor_id": null,
  "patient_id": 1
}
```

---

### 1.2 List Patients

- **URL**: `GET /patients`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100, max=1000)
- **Response**: `PatientsRegistrationOut[]`

---

### 1.3 Get Single Patient

- **URL**: `GET /patients/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `PatientsRegistrationOut`
- **Errors**:
  - `404 Patient not found`

---

## 2. Diagnosis

### 2.1 Create Diagnosis

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

- **Response** (`DiagnosisOut`): same fields + `diagnosis_id`.

---

### 2.2 List Diagnoses by Patient (query form)

- **URL**: `GET /diagnosis`
- **Query**:
  - `patient_id` (int, required)
- **Response**: `DiagnosisOut[]`
- **Errors**:
  - `400 patient_id is required`

---

### 2.3 List Diagnoses by Patient (path form)

- **URL**: `GET /diagnosis/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `DiagnosisOut[]`

---

### 2.4 Get Latest Diagnosis by Patient

- **URL**: `GET /diagnosis/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response**: `DiagnosisOut`
- **Errors**:
  - `404 Diagnosis not found for patient`

---

## 3. Patient Preference (Pharmacy / Lab)

### 3.1 Create Preference

- **URL**: `POST /preferences`
- **Body** (`PatientPreferenceCreate`):

```json
{
  "patient_id": 1,
  "preference_type": "pharmacy",   // or "lab"
  "pharmacy_id": 1,                // required if type = "pharmacy"
  "lab_id": null,                  // must be null if type = "pharmacy"
  "notes": "Preferred pharmacy"
}
```

- Validation rules:

  - When `preference_type = "pharmacy"`:
    - `pharmacy_id` must be non-null
    - `lab_id` must be null
  - When `preference_type = "lab"`:
    - `lab_id` must be non-null
    - `pharmacy_id` must be null

- **Response** (`PatientPreferenceOut`): above fields + `preference_id`.

---

### 3.2 List All Preferences (Raw)

- **URL**: `GET /preferences`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `PatientPreferenceOut[]`

---

### 3.3 Get Slim Preferences by Patient & Type

- **URL**: `GET /preferences/by-patient`
- **Query**:
  - `patient_id` (int, required)
  - `preference_type` (string, `"pharmacy"` or `"lab"`)
- **Response** (`PatientPreferenceSlimOut[]`):

```json
[
  {
    "target_id": 1,     // pharmacy_id or lab_id
    "notes": "Preferred pharmacy for ..."
  }
]
```

---

### 3.4 Get Pharmacy Preferences with Details + Distance

- **URL**: `GET /preferences/pharmacy`
- **Query**:
  - `patient_id` (int, required)
- **Behavior**:
  - Read patient’s `contact_info`, parse coordinates;
  - Load all `pharmacy_registration` records and filter those referenced by patient’s `patient_preference` rows (`preference_type="pharmacy"`);
  - For each preferred pharmacy, compute Haversine distance from patient.
- **Response** (`PreferredPharmacyOut[]`):

```json
[
  {
    "pharmacy_id": 8,
    "name": "Collins LLC",
    "email": "lisahaley@lopez.com",
    "phone_number": "(773)798-9683x555",
    "address": "36862 Nelson Loop, North Tami, HI 06262",
    "coordinates": { "lat": 45.415650249941976, "lng": -75.70097863099235 },
    "distance_km": 2.02,
    "notes": "Preferred pharmacy for regular meds"
  }
]
```

---

### 3.5 Get Lab Preferences with Details + Distance

- **URL**: `GET /preferences/lab`
- **Query**:
  - `patient_id` (int, required)
- **Response** (`PreferredLabOut[]`):

```json
[
  {
    "lab_id": 1,
    "name": "Test Lab",
    "email": "test.lab@example.com",
    "phone_number": "555-987-6543",
    "address": "456 Lab Avenue, Ottawa, ON",
    "coordinates": { "lat": 45.4215, "lng": -75.6972 },
    "distance_km": 1.23,
    "notes": "Preferred lab for blood tests"
  }
]
```

---

## 4. Prescription

### 4.1 Create Prescription (auto-increment `prescription_id`)

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
  "notes": "Complete full course even if feeling better",
  "pharmacy_id": 1
}
```

- **Behavior**:
  - Reads all records from `prescription_form`;
  - Computes max numeric `prescription_id`, uses `(max + 1)` as new id;
  - POSTs a new record to remote table;
  - Returns the payload composed locally.

- **Response** (`PrescriptionFormOut`):

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
  "notes": "Complete full course even if feeling better",
  "pharmacy_id": 1,
  "prescription_id": "1763831311"
}
```

---

### 4.2 List All Prescriptions (with Pharmacy Info)

- **URL**: `GET /prescriptions`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response** (`PrescriptionWithPharmacyOut[]`):

```json
[
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
]
```

> `pharmacy_address` is the plain address part before `"||{lat,lng}"`.

---

### 4.3 Get Single Prescription (with Pharmacy Info)

- **URL**: `GET /prescriptions/{prescription_id}`
- **Path**:
  - `prescription_id` (string)
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

### 4.4 Partially Update Prescription (PATCH)

- **URL**: `PATCH /prescriptions/{prescription_id}`
- **Path**:
  - `prescription_id` (string)
- **Body** (`PrescriptionFormUpdate`, all fields optional):

```json
{
  "medication_name": "New name",
  "medication_strength": "250 mg",
  "medication_form": "capsule",
  "dosage_instructions": "Take twice daily",
  "quantity": 10,
  "refills_allowed": 0,
  "expiry_date": "2025-12-31",
  "status": "completed",
  "notes": "<.  o _ o  .>"
}
```

- **Behavior**:
  - Loads current record; if missing → `404`.
  - Builds `update_data` only with fields that truly changed.
  - If `update_data` is empty, returns existing record (idempotent, no PUT).
  - Otherwise PUTs `update_data` to `prescription_form/{prescription_id}`.
  - Returns updated record.

- **Response**: `PrescriptionFormOut`
- **Errors**:
  - `404 Prescription not found to update.`

---

### 4.5 Get Latest Prescription by Patient (with Pharmacy Info)

- **URL**: `GET /prescriptions/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Behavior**:
  - Filters `prescription_form` by `patient_id`;
  - Sorts by `(date_prescribed, prescription_id)` descending;
  - If `pharmacy_id` exists, load from `pharmacy_registration`, strip `"||{lat,lng}"` from address.
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
  - `404 Prescription not found for patient`

---

### 4.6 Set Pharmacy for a Prescription (Idempotent)

- **URL**: `PUT /prescriptions/{prescription_id}/pharmacy`
- **Path**:
  - `prescription_id` (string)
- **Body** (`UpdatePrescriptionPharmacyRequest`):

```json
{
  "pharmacy_id": 11
}
```

- **Behavior**:
  - Loads prescription; if missing → `404`.
  - If `current_pharmacy_id == payload.pharmacy_id`, returns existing record (no PUT).
  - Otherwise PUTs `{"pharmacy_id": <new>}` to `prescription_form/{prescription_id}` and returns updated record.

- **Response**: `PrescriptionFormOut`

---

### 4.7 Simulate Faxing a Prescription to Pharmacy

- **URL**: `POST /prescriptions/{prescription_id}/fax`
- **Path**:
  - `prescription_id` (string)
- **Behavior**:
  - Loads prescription; if missing → `404`.
  - If `pharmacy_id` is null → `400`.
  - Otherwise prints a log line on server:

    ```
    [FAX SIMULATION] Fax sent for patient (ID: X)'s prescription form (ID: Y) to pharmacy (ID: Z).
    ```

  - Returns the same sentence as plain string.

- **Response** (string):

```text
"Fax sent for patient (ID: 1)'s prescription form (ID: 1763831311) to pharmacy (ID: 2)."
```

---

## 5. Requisition

### 5.1 Create Requisition (auto-increment `requisition_id`)

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

- **Behavior**:
  - Reads all records from `requisition_form`;
  - Computes max numeric `requisition_id`, uses `(max + 1)` as new id;
  - POSTs new record and returns the payload.

- **Response** (`RequisitionFormOut`)

---

### 5.2 List All Requisitions (with Lab Info)

- **URL**: `GET /requisitions`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response** (`RequisitionWithLabOut[]`):

```json
[
  {
    "requisition": {
      "patient_id": 1,
      "lab_id": 2,
      "department": "Microbiology",
      "test_type": "Throat Culture",
      "test_code": null,
      "clinical_info": "Suspected acute streptococcal pharyngitis...",
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
]
```

---

### 5.3 Get Single Requisition (with Lab Info)

- **URL**: `GET /requisitions/{requisition_id}`
- **Path**:
  - `requisition_id` (string)
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

### 5.4 Partially Update Requisition (PATCH)

- **URL**: `PATCH /requisitions/{requisition_id}`
- **Path**:
  - `requisition_id` (string)
- **Body** (`RequisitionFormUpdate`, all optional):

```json
{
  "department": "Nephrology",
  "test_type": "Comprehensive renal function panel",
  "test_code": "RENAL01",
  "clinical_info": "CKD follow-up",
  "priority": "Urgent",
  "status": "Completed",
  "result_date": "2025-11-25T10:00:00.000Z",
  "notes": "Please notify nephrologist with results."
}
```

- **Behavior**:
  - Loads existing record; if missing → `404`.
  - Filters unchanged fields; if no changes → returns existing record (no PUT).
  - Otherwise PUTs changed fields to `requisition_form/{requisition_id}` and returns updated record.

- **Response**: `RequisitionFormOut`
- **Errors**:
  - `404 Requisition not found to update.`

---

### 5.5 Get Latest Requisition by Patient (with Lab Info)

- **URL**: `GET /requisitions/latest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Response** (`RequisitionWithLabOut`):

```json
{
  "requisition": {
    "patient_id": 1,
    "lab_id": 2,
    "department": "Microbiology",
    "test_type": "Throat Culture",
    "test_code": null,
    "clinical_info": "Suspected acute streptococcal pharyngitis...",
    "date_requested": "2025-11-23T08:40:36.000Z",
    "priority": "urgent",
    "status": "requested",
    "result_date": null,
    "notes": "Please process promptly.",
    "requisition_id": "1763837271"
  },
  "lab_name": "Bio-Test Laboratory - Centrum PSC",
  "lab_address": "210 Centrum Blvd, Orléans, ON, K1E 2P5"
}
```

---

### 5.6 Set Lab for a Requisition (Idempotent)

- **URL**: `PUT /requisitions/{requisition_id}/lab`
- **Path**:
  - `requisition_id` (string)
- **Body**:

```json
{
  "lab_id": 2
}
```

- **Behavior**:
  - Loads requisition; if missing → `404`.
  - If current `lab_id` equals requested `lab_id`, returns existing record (no PUT).
  - Otherwise PUTs `{"lab_id": <new>}` to `requisition_form/{requisition_id}` and returns updated record.

- **Response**: `RequisitionFormOut`

---

### 5.7 Simulate Faxing a Requisition to Lab

- **URL**: `POST /requisitions/{requisition_id}/fax`
- **Path**:
  - `requisition_id` (string)
- **Behavior**:
  - Loads requisition; if missing → `404`.
  - If `lab_id` is null → `400`.
  - Otherwise logs:

    ```
    [FAX SIMULATION] Fax sent for patient (ID: X)'s requisition form (ID: Y) to lab (ID: Z).
    ```

  - Returns the same sentence as string.

- **Response** (string):

```text
"Fax sent for patient (ID: 1)'s requisition form (ID: 1763837273) to lab (ID: 3)."
```

---

## 6. Pharmacy

### 6.1 Create Pharmacy

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
  "name": "Test Pharmacy 01",
  "email": "pharmacy01@example.com",
  "phone_number": "555-111-2222",
  "address": "174 Bank St, Ottawa, ON K2P 1W6||{\"lat\": 45.4209, \"lng\": -75.6950}",
  "license_no": "LIC-0001",
  "status": "active",
  "registered_on": "2025-07-11T20:42:41.000Z",
  "pharmacy_id": 1
}
```

---

### 6.2 List Pharmacies

- **URL**: `GET /pharmacies`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `PharmacyRegistrationOut[]`

---

### 6.3 Get Single Pharmacy

- **URL**: `GET /pharmacies/{pharmacy_id}`
- **Path**:
  - `pharmacy_id` (int)
- **Response**: `PharmacyRegistrationOut`
- **Errors**:
  - `404 Pharmacy not found`

---

### 6.4 Get Nearest 5 Pharmacies by Patient

- **URL**: `GET /pharmacies/nearest/{patient_id}`
- **Path**:
  - `patient_id` (int)
- **Behavior**:
  - Parse coordinates from patient’s `contact_info` and each pharmacy’s `address` field;
  - Compute Haversine distance and return the 5 closest.

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

## 7. Lab

### 7.1 Create Lab

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

- **Response** (`LabRegistrationOut`):

```json
{
  "name": "Test Lab 01",
  "email": "test.lab@example.com",
  "phone_number": "555-987-6543",
  "address": "456 Lab Avenue, Ottawa, ON||{\"lat\": 45.4215, \"lng\": -75.6972}",
  "license_no": "LAB-TEST-0001",
  "status": "active",
  "registered_on": "2025-11-22T19:02:08.000Z",
  "lab_id": 1
}
```

---

### 7.2 List Labs

- **URL**: `GET /labs`
- **Query**:
  - `skip` (int, default=0)
  - `limit` (int, default=100)
- **Response**: `LabRegistrationOut[]`

---

### 7.3 Get Single Lab

- **URL**: `GET /labs/{lab_id}`
- **Path**:
  - `lab_id` (int)
- **Response**: `LabRegistrationOut`
- **Errors**:
  - `404 Lab not found`

---

### 7.4 Get Nearest 5 Labs by Patient

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

## 8. Workflow / Agent

These endpoints are used for AI-driven workflows and tools.

### 8.1 Generic Tool Execution Entry

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

- **Behavior**:
  - Lookup function by `tool` in `app.llm_tools.TOOLS`;
  - Call `func(args=arguments)`;
  - Wrap result into `WorkflowResponse`.

- **Response** (`WorkflowResponse`):

```json
{
  "tool": "tool_create_prescription_from_latest_diagnosis",
  "arguments": { "...": "..." },
  "result": { "...": "tool return JSON..." }
}
```

Known tools include (not exhaustive):

- `tool_create_prescription_from_latest_diagnosis`
- `tool_create_requisition_from_latest_diagnosis`
- `tool_generate_orders_from_latest_diagnosis`
- `tool_complete_prescription_from_diagnosis`
- `tool_complete_requisition_from_diagnosis`

---

### 8.2 High-Level Workflow: Generate New Prescription + Requisition from Latest Diagnosis

- **URL**: `POST /workflow/generate-orders`
- **Body** (`AutoOrdersRequest`):

```json
{
  "patient_id": 1
}
```

- **Behavior**:
  - Invokes `tool_generate_orders_from_latest_diagnosis`:
    1. Reads latest diagnosis for `patient_id` via CRUD.
    2. Uses OpenAI (function calling) to design:
       - one prescription
       - one lab requisition
    3. Calls `tool_create_prescription_from_latest_diagnosis` /
       `tool_create_requisition_from_latest_diagnosis` to persist:
       - new `PRESCRIPTION_FORM` (with `pharmacy_id = null`)
       - new `REQUISITION_FORM` (with `lab_id = null`).
  - Returns the created rows.

- **Response** (`AutoOrdersResponse`):

```json
{
  "patient_id": 1,
  "prescription": { /* PrescriptionFormOut */ },
  "requisition": { /* RequisitionFormOut */ }
}
```

---

### 8.3 High-Level Workflow: Complete Existing Prescription (Do Not Change `pharmacy_id`)

- **URL**: `POST /workflow/complete-prescription`
- **Body** (`CompletePrescriptionRequest`):

```json
{
  "patient_id": 1,
  "prescription_id": "1764717231"
}
```

- **Behavior**:
  - Backend calls tool `tool_complete_prescription_from_diagnosis`:
    1. Loads latest diagnosis for `patient_id` (`diagnosis_description`).
    2. Loads existing `PRESCRIPTION_FORM` by `prescription_id`.
    3. Sends diagnosis description + existing prescription JSON to OpenAI;
       AI may **only** fill or modify editable fields:
       - `medication_name`
       - `medication_strength`
       - `medication_form`
       - `dosage_instructions`
       - `quantity`
       - `refills_allowed`
       - `expiry_date`
       - `status`
       - `notes`
       (must not change `pharmacy_id`).
    4. Maps AI output to `PrescriptionFormUpdate` and calls `crud.update_prescription` to persist.
    5. Returns updated prescription row.

- **Response** (`CompletePrescriptionResponse`):

```json
{
  "patient_id": 1,
  "prescription": { /* PrescriptionFormOut */ }
}
```

---

### 8.4 High-Level Workflow: Complete Existing Requisition (Do Not Change `lab_id`)

- **URL**: `POST /workflow/complete-requisition`
- **Body** (`CompleteRequisitionRequest`):

```json
{
  "patient_id": 1,
  "requisition_id": "1763837273"
}
```

- **Behavior**:
  - Backend calls `tool_complete_requisition_from_diagnosis`:
    1. Loads latest diagnosis for `patient_id`.
    2. Loads existing `REQUISITION_FORM` by `requisition_id`.
    3. Sends diagnosis description + existing requisition JSON to OpenAI;
       AI may only update:
       - `department`
       - `test_type`
       - `test_code`
       - `clinical_info`
       - `priority`
       - `status`
       - `result_date`
       - `notes`
       (must not change `lab_id`).
    4. Maps AI output to `RequisitionFormUpdate` and calls `crud.update_requisition`.
    5. Returns updated requisition row.

- **Response** (`CompleteRequisitionResponse`):

```json
{
  "patient_id": 1,
  "requisition": { /* RequisitionFormOut */ }
}
```

---

This document is synchronized with the current backend implementation in:

- `app/routers.py`
- `app/schemas.py`
- `app/llm_tools.py`
- `app/crud.py`

Please update this file whenever the API surface changes.
