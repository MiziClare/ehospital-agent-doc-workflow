import { BASE_URL } from "../constants";

// get patient and create docs by patient ID
export const getPatientAndCreateDocsById = async (patientId: number) => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/ehealth/init?clientId=${patientId}`,
      {
        method: "POST",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching patient documents:", error);
    throw error;
  }
};

// get latest prescription by client ID
export const getLatestPrescriptionByClientId = async (clientId: number) => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/prescriptions/client/${clientId}/latest`,
      {
        method: "GET",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching latest prescription:", error);
    throw error;
  }
};

// get latest requisition by client ID
export const getLatestRequisitionByClientId = async (clientId: number) => {
  try {
    const res = await fetch(
      `${BASE_URL}/api/requisitions/client/${clientId}/latest`,
      {
        method: "GET",
      }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching latest requisition:", error);
    throw error;
  }
};

// get latest diagnosis by patient ID
export const getLatestDiagnosisByPatientId = async (patientId: number) => {
  try {
    const res = await fetch(`${BASE_URL}/diagnosis/latest/${patientId}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Diagnosis API response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching latest diagnosis:", error);
    throw error;
  }
};

// generate workflow orders (prescription and requisition)
export const generateWorkflowOrders = async (patientId: number) => {
  try {
    const res = await fetch(`${BASE_URL}/workflow/generate-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ patient_id: patientId }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Workflow orders response:", data);
    return data;
  } catch (error) {
    console.error("Error generating workflow orders:", error);
    throw error;
  }
};

// get nearest pharmacies by patient ID
export const getNearestPharmacies = async (patientId: number) => {
  try {
    const res = await fetch(`${BASE_URL}/pharmacies/nearest/${patientId}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Nearest pharmacies response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching nearest pharmacies:", error);
    throw error;
  }
};

// get pharmacy preferences by patient ID
export const getPharmacyPreferences = async (patientId: number) => {
  try {
    const res = await fetch(
      `${BASE_URL}/preferences/pharmacy?patient_id=${patientId}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Pharmacy preferences response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching pharmacy preferences:", error);
    throw error;
  }
};

// get nearest labs by patient ID
export const getNearestLabs = async (patientId: number) => {
  try {
    const res = await fetch(`${BASE_URL}/labs/nearest/${patientId}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Nearest labs response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching nearest labs:", error);
    throw error;
  }
};

// get lab preferences by patient ID
export const getLabPreferences = async (patientId: number) => {
  try {
    const res = await fetch(
      `${BASE_URL}/preferences/lab?patient_id=${patientId}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Lab preferences response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching lab preferences:", error);
    throw error;
  }
};

// get prescription by ID
export const getPrescriptionById = async (prescriptionId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Prescription response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching prescription:", error);
    throw error;
  }
};

// get requisition by ID
export const getRequisitionById = async (requisitionId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Requisition response:", data);
    return data;
  } catch (error) {
    console.error("Error fetching requisition:", error);
    throw error;
  }
};

// update prescription by ID (partial update)
export const updatePrescriptionById = async (
  prescriptionId: string,
  updateData: Partial<{
    status: string;
    notes: string;
    medication_name: string;
    medication_strength: string;
    medication_form: string;
    dosage_instructions: string;
    quantity: number;
    refills_allowed: number;
    expiry_date: string;
  }>
) => {
  try {
    const res = await fetch(`${BASE_URL}/prescriptions/${prescriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Updated prescription response:", data);
    return data;
  } catch (error) {
    console.error("Error updating prescription:", error);
    throw error;
  }
};

// update requisition by ID (partial update)
export const updateRequisitionById = async (
  requisitionId: string,
  updateData: Partial<{
    status: string;
    notes: string;
    department: string;
    test_type: string;
    test_code: string;
    clinical_info: string;
    priority: string;
    result_date: string;
  }>
) => {
  try {
    const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Updated requisition response:", data);
    return data;
  } catch (error) {
    console.error("Error updating requisition:", error);
    throw error;
  }
};

// set pharmacy for prescription
export const setPrescriptionPharmacy = async (
  prescriptionId: string,
  pharmacyId: number
) => {
  try {
    const res = await fetch(
      `${BASE_URL}/prescriptions/${prescriptionId}/pharmacy`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pharmacy_id: pharmacyId }),
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Set prescription pharmacy response:", data);
    return data;
  } catch (error) {
    console.error("Error setting prescription pharmacy:", error);
    throw error;
  }
};

// set lab for requisition
export const setRequisitionLab = async (
  requisitionId: string,
  labId: number
) => {
  try {
    const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}/lab`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lab_id: labId }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Set requisition lab response:", data);
    return data;
  } catch (error) {
    console.error("Error setting requisition lab:", error);
    throw error;
  }
};

// Send fax for prescription
export const sendPrescriptionFax = async (prescriptionId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/prescriptions/${prescriptionId}/fax`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      let details = "";
      try {
        details = await res.text();
      } catch {}
      throw new Error(`HTTP error! status: ${res.status}${details ? ` - ${details}` : ""}`);
    }

    const data = await res.json();
    console.log("Send prescription fax response:", data);
    return data;
  } catch (error) {
    console.error("Error sending prescription fax:", error);
    throw error;
  }
};

// Send fax for requisition
export const sendRequisitionFax = async (requisitionId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}/fax`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      let details = "";
      try {
        details = await res.text();
      } catch {}
      throw new Error(`HTTP error! status: ${res.status}${details ? ` - ${details}` : ""}`);
    }

    const data = await res.json();
    console.log("Send requisition fax response:", data);
    return data;
  } catch (error) {
    console.error("Error sending requisition fax:", error);
    throw error;
  }
};

// Create empty prescription then complete via workflow
export const createEmptyPrescription = async (args: { patient_id: number }) => {
  const res = await fetch(`${BASE_URL}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: args.patient_id,
      prescriber_id: "",
      medication_name: "",
      medication_strength: "",
      medication_form: "",
      dosage_instructions: "",
      quantity: 0,
      refills_allowed: 0,
      date_prescribed: new Date().toISOString(),
      expiry_date: "",
      status: "",
      notes: "",
      pharmacy_id: null,
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};

export const completePrescription = async (args: {
  patient_id: number;
  prescription_id: string;
}) => {
  const res = await fetch(`${BASE_URL}/workflow/complete-prescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};

export const createEmptyRequisition = async (args: { patient_id: number }) => {
  const res = await fetch(`${BASE_URL}/requisitions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: args.patient_id,
      lab_id: null,
      department: "",
      test_type: "",
      test_code: null,
      clinical_info: null,
      date_requested: new Date().toISOString(),
      priority: "",
      status: "",
      result_date: null,
      notes: "",
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};

export const completeRequisition = async (args: {
  patient_id: number;
  requisition_id: string;
}) => {
  const res = await fetch(`${BASE_URL}/workflow/complete-requisition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return await res.json();
};
