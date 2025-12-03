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

...existing code (same as CN doc, but in English; endpoints: POST /patients, GET /patients, GET /patients/{id})...

---

## 2. Diagnosis

...existing code (POST /diagnosis, GET /diagnosis?patient_id=, GET /diagnosis/{patient_id}, GET /diagnosis/latest/{patient_id})...

---

## 3. Patient Preference

...existing code (POST /preferences, GET /preferences, GET /preferences/by-patient, GET /preferences/pharmacy, GET /preferences/lab)...

---

## 4. Prescription

...existing code describing:

- POST `/prescriptions` (auto-increment `prescription_id`, remote POST)
- GET `/prescriptions` → `PrescriptionWithPharmacyOut[]`
- GET `/prescriptions/{prescription_id}` → `PrescriptionWithPharmacyOut`
- PATCH `/prescriptions/{prescription_id}` → partial update with idempotency
- GET `/prescriptions/latest/{patient_id}` → `PrescriptionWithPharmacyOut`
- PUT `/prescriptions/{prescription_id}/pharmacy` → set `pharmacy_id` (idempotent)
- POST `/prescriptions/{prescription_id}/fax` → simulated fax string
...

---

## 5. Requisition

...existing code describing:

- POST `/requisitions`
- GET `/requisitions` → `RequisitionWithLabOut[]`
- GET `/requisitions/{requisition_id}` → `RequisitionWithLabOut`
- PATCH `/requisitions/{requisition_id}`
- GET `/requisitions/latest/{patient_id}`
- PUT `/requisitions/{requisition_id}/lab`
- POST `/requisitions/{requisition_id}/fax`
...

---

## 6. Pharmacy

...existing code (POST /pharmacies, GET /pharmacies, GET /pharmacies/{id}, GET /pharmacies/nearest/{patient_id})...

---

## 7. Lab

...existing code (POST /labs, GET /labs, GET /labs/{id}, GET /labs/nearest/{patient_id})...

---

## 8. Workflow / Agent

...existing code describing:

- POST `/workflow`
- POST `/workflow/generate-orders`
- POST `/workflow/complete-prescription`
- POST `/workflow/complete-requisition`
...

