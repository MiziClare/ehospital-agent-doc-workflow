export interface Pharmacy {
  pharmacy_id: number;
  name: string;
  address: string;
  email?: string | null;
  phone_number?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance_km?: number;
  notes?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PharmacyPreference extends Pharmacy {
  // PharmacyPreference is the same as Pharmacy for this API
}

export interface Lab {
  lab_id: number;
  name: string;
  address: string;
  email?: string | null;
  phone_number?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance_km?: number;
  notes?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LabPreference extends Lab {
  // LabPreference is the same as Lab for this API
}
