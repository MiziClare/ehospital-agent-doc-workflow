import React, { useState, useEffect, useRef } from "react";
import { Empty, Spin, message, Tag } from "antd";
import {
  ShopOutlined,
  ExperimentOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  StarOutlined,
  HeartFilled,
} from "@ant-design/icons";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import {
  getNearestPharmacies,
  getPharmacyPreferences,
  getNearestLabs,
  getLabPreferences,
} from "../apis/patient";
import {
  useCurrentDiagnosisInfoStore,
  useSelectedPharmacyStore,
  useSelectedLabStore,
  useGeneratedOrdersStore,
} from "../store";
import type {
  Pharmacy,
  PharmacyPreference,
  Lab,
  LabPreference,
} from "../types/Pharmacy";
import {
  GOOGLE_API_KEY,
  INITIAL_LATITUDE,
  INITIAL_LONGITUDE,
} from "../constants";

const LocationSelector: React.FC<{ mode?: "dual" | "prescription-only" | "requisition-only" }> = ({ mode = "dual" }) => {
  const [activeTab, setActiveTab] = useState<string>(mode === "requisition-only" ? "lab" : "pharmacy");
  const [nearestPharmacies, setNearestPharmacies] = useState<Pharmacy[]>([]);
  const [pharmacyPreferences, setPharmacyPreferences] = useState<
    PharmacyPreference[]
  >([]);
  const [nearestLabs, setNearestLabs] = useState<Lab[]>([]);
  const [labPreferences, setLabPreferences] = useState<LabPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(
    null
  );
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [pharmacyMapCenter, setPharmacyMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [labMapCenter, setLabMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { diagnosisInfo } = useCurrentDiagnosisInfoStore();
  const { updateSelectedPharmacy, selectedPharmacy: storedPharmacy } =
    useSelectedPharmacyStore();
  const { updateSelectedLab, selectedLab: storedLab } = useSelectedLabStore();
  const { prescriptionId, requisitionId } = useGeneratedOrdersStore();

  const isSelectingPharmacy = useRef(false);
  const isSelectingLab = useRef(false);

  const fetchPharmacyData = async () => {
    if (!diagnosisInfo || diagnosisInfo.length === 0) {
      message.warning("Please search for a patient first");
      return;
    }

    const patientId = diagnosisInfo[0].patient_id;
    setLoading(true);

    try {
      const [nearest, preferences] = await Promise.all([
        getNearestPharmacies(patientId),
        getPharmacyPreferences(patientId),
      ]);

      setNearestPharmacies(Array.isArray(nearest) ? nearest : []);
      setPharmacyPreferences(Array.isArray(preferences) ? preferences : []);
    } catch (error) {
      message.error("Failed to load pharmacy data");
      console.error("Error loading pharmacy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabData = async () => {
    if (!diagnosisInfo || diagnosisInfo.length === 0) {
      message.warning("Please search for a patient first");
      return;
    }

    const patientId = diagnosisInfo[0].patient_id;
    setLoading(true);

    try {
      const [nearest, preferences] = await Promise.all([
        getNearestLabs(patientId),
        getLabPreferences(patientId),
      ]);

      setNearestLabs(Array.isArray(nearest) ? nearest : []);
      setLabPreferences(Array.isArray(preferences) ? preferences : []);
    } catch (error) {
      message.error("Failed to load lab data");
      console.error("Error loading lab data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync selected pharmacy/lab from store when data is loaded
  useEffect(() => {
    if (storedPharmacy && nearestPharmacies.length > 0) {
      // Find the full pharmacy object from nearestPharmacies or pharmacyPreferences
      const foundInNearest = nearestPharmacies.find(
        (p) => p.pharmacy_id === storedPharmacy.pharmacy_id
      );
      const foundInPreferences = pharmacyPreferences.find(
        (p) => p.pharmacy_id === storedPharmacy.pharmacy_id
      );
      const found = foundInNearest || foundInPreferences;
      if (found) {
        setSelectedPharmacy(found);
        if (found.coordinates) {
          setPharmacyMapCenter(found.coordinates);
        }
      }
    }
  }, [storedPharmacy, nearestPharmacies, pharmacyPreferences]);

  useEffect(() => {
    if (storedLab && nearestLabs.length > 0) {
      // Find the full lab object from nearestLabs or labPreferences
      const foundInNearest = nearestLabs.find(
        (l) => l.lab_id === storedLab.lab_id
      );
      const foundInPreferences = labPreferences.find(
        (l) => l.lab_id === storedLab.lab_id
      );
      const found = foundInNearest || foundInPreferences;
      if (found) {
        setSelectedLab(found);
        if (found.coordinates) {
          setLabMapCenter(found.coordinates);
        }
      }
    }
  }, [storedLab, nearestLabs, labPreferences]);

  useEffect(() => {
    if (diagnosisInfo && diagnosisInfo.length > 0) {
      if (mode === "prescription-only") {
        fetchPharmacyData();
      } else if (mode === "requisition-only") {
        fetchLabData();
      } else {
        if (activeTab === "pharmacy") {
          fetchPharmacyData();
        } else if (activeTab === "lab") {
          fetchLabData();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, diagnosisInfo, mode]);

  // Remove auto-binding of facilities; selection only updates local store.

  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    if (pharmacy.coordinates) {
      setPharmacyMapCenter(pharmacy.coordinates);
    }
    // Save to store for step4
    updateSelectedPharmacy({
      pharmacy_id: pharmacy.pharmacy_id,
      name: pharmacy.name,
      address: pharmacy.address,
    });
    message.success(`Selected: ${pharmacy.name}`);
  };

  const handleSelectLab = (lab: Lab) => {
    setSelectedLab(lab);
    if (lab.coordinates) {
      setLabMapCenter(lab.coordinates);
    }
    // Save to store for step4
    updateSelectedLab({
      lab_id: lab.lab_id,
      name: lab.name,
      address: lab.address,
    });
    message.success(`Selected: ${lab.name}`);
  };

  const formatDistance = (distanceKm?: number) => {
    if (!distanceKm) return "--";
    return distanceKm < 1
      ? `${(distanceKm * 1000).toFixed(0)} m`
      : `${distanceKm.toFixed(1)} km`;
  };

  const renderPharmacyList = (
    pharmacies: Pharmacy[],
    title: string,
    icon: React.ReactNode,
    isPreference: boolean = false
  ) => (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 m-0">{title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Empty
              description={
                <span className="text-slate-400">
                  No {isPreference ? "preferred" : "nearby"} pharmacies found
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          pharmacies.map((pharmacy, index) => {
            const isSelected =
              selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id;
            return (
              <div
                key={`${pharmacy.pharmacy_id}-${index}`}
                className={`rounded-2xl p-4 border transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]"
                    : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md hover:scale-[1.01]"
                }`}
                onClick={() => handleSelectPharmacy(pharmacy)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-bold text-base truncate ${
                          isSelected ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {pharmacy.name}
                      </span>
                      {isPreference && (
                        <HeartFilled className="text-red-500 text-sm animate-pulse flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <EnvironmentOutlined className="mt-1 text-blue-400 flex-shrink-0" />
                        <span className="line-clamp-2 text-xs">
                          {pharmacy.address}
                        </span>
                      </div>
                      {pharmacy.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <PhoneOutlined className="text-green-500 flex-shrink-0" />
                          <span className="text-xs">
                            {pharmacy.phone_number}
                          </span>
                        </div>
                      )}
                    </div>

                    {pharmacy.notes && isPreference && (
                      <div className="mt-2 text-xs text-slate-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        <span className="font-bold text-blue-600">Note: </span>
                        {pharmacy.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {pharmacy.distance_km !== undefined && (
                      <Tag
                        color="blue"
                        className="m-0 font-bold border-0 bg-blue-100 text-blue-700 rounded-full px-2 text-xs"
                      >
                        {formatDistance(pharmacy.distance_km)}
                      </Tag>
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-400"
                      }`}
                    >
                      <StarOutlined className="text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderLabList = (
    labs: Lab[],
    title: string,
    icon: React.ReactNode,
    isPreference: boolean = false
  ) => (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 m-0">{title}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : labs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Empty
              description={
                <span className="text-slate-400">
                  No {isPreference ? "preferred" : "nearby"} labs found
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          labs.map((lab, index) => {
            const isSelected = selectedLab?.lab_id === lab.lab_id;
            return (
              <div
                key={`${lab.lab_id}-${index}`}
                className={`rounded-2xl p-4 border transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? "bg-green-50 border-green-200 shadow-md scale-[1.02]"
                    : "bg-white border-slate-100 hover:border-green-200 hover:shadow-md hover:scale-[1.01]"
                }`}
                onClick={() => handleSelectLab(lab)}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-bold text-base truncate ${
                          isSelected ? "text-green-700" : "text-slate-800"
                        }`}
                      >
                        {lab.name}
                      </span>
                      {isPreference && (
                        <HeartFilled className="text-red-500 text-sm animate-pulse flex-shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <EnvironmentOutlined className="mt-1 text-green-400 flex-shrink-0" />
                        <span className="line-clamp-2 text-xs">
                          {lab.address}
                        </span>
                      </div>
                      {lab.phone_number && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <PhoneOutlined className="text-green-500 flex-shrink-0" />
                          <span className="text-xs">{lab.phone_number}</span>
                        </div>
                      )}
                    </div>

                    {lab.notes && isPreference && (
                      <div className="mt-2 text-xs text-slate-600 bg-green-50/50 p-2 rounded-lg border border-green-100">
                        <span className="font-bold text-green-600">Note: </span>
                        {lab.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {lab.distance_km !== undefined && (
                      <Tag
                        color="green"
                        className="m-0 font-bold border-0 bg-green-100 text-green-700 rounded-full px-2 text-xs"
                      >
                        {formatDistance(lab.distance_km)}
                      </Tag>
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-green-500 text-white"
                          : "bg-slate-100 text-slate-300 group-hover:bg-green-100 group-hover:text-green-400"
                      }`}
                    >
                      <StarOutlined className="text-xs" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const pharmacyContent = (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPharmacyList(
          nearestPharmacies,
          "Nearby Pharmacies",
          <EnvironmentOutlined className="text-blue-600 text-lg" />,
          false
        )}
        {renderPharmacyList(
          pharmacyPreferences,
          "Preferred Pharmacies",
          <HeartFilled className="text-red-500 text-lg" />,
          true
        )}
      </div>
      {/* Google Map for Pharmacies */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-white p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
            <EnvironmentOutlined className="text-xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 m-0">Pharmacy Map</h3>
        </div>
        <div className="h-[500px] w-full relative">
          <APIProvider apiKey={GOOGLE_API_KEY}>
            <Map
              key={
                selectedPharmacy
                  ? `pharmacy-${selectedPharmacy.pharmacy_id}`
                  : "pharmacy-default"
              }
              defaultCenter={
                pharmacyMapCenter || {
                  lat: INITIAL_LATITUDE,
                  lng: INITIAL_LONGITUDE,
                }
              }
              defaultZoom={pharmacyMapCenter ? 16 : 13}
              mapId="pharmacy-map"
              gestureHandling="greedy"
            >
              {/* Nearest Pharmacies - Blue Markers */}
              {nearestPharmacies.map((pharmacy, index) =>
                pharmacy.coordinates ? (
                  <AdvancedMarker
                    key={`nearest-pharmacy-${pharmacy.pharmacy_id}-${index}`}
                    position={pharmacy.coordinates}
                    title={pharmacy.name}
                    onClick={() => handleSelectPharmacy(pharmacy)}
                  >
                    <Pin
                      background={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? "#facc15"
                          : "#1e40af"
                      }
                      borderColor={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? "#eab308"
                          : "#1e3a8a"
                      }
                      glyphColor="#ffffff"
                      scale={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? 1.3
                          : 1
                      }
                    />
                  </AdvancedMarker>
                ) : null
              )}
              {/* Preferred Pharmacies - Red Markers */}
              {pharmacyPreferences.map((pharmacy, index) =>
                pharmacy.coordinates ? (
                  <AdvancedMarker
                    key={`preferred-pharmacy-${pharmacy.pharmacy_id}-${index}`}
                    position={pharmacy.coordinates}
                    title={pharmacy.name}
                    onClick={() => handleSelectPharmacy(pharmacy)}
                  >
                    <Pin
                      background={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? "#facc15"
                          : "#dc2626"
                      }
                      borderColor={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? "#eab308"
                          : "#991b1b"
                      }
                      glyphColor="#ffffff"
                      scale={
                        selectedPharmacy?.pharmacy_id === pharmacy.pharmacy_id
                          ? 1.3
                          : 1
                      }
                    />
                  </AdvancedMarker>
                ) : null
              )}
              {/* InfoWindow for selected pharmacy */}
              {selectedPharmacy && selectedPharmacy.coordinates && (
                <InfoWindow
                  position={selectedPharmacy.coordinates}
                  onCloseClick={() => setSelectedPharmacy(null)}
                >
                  <div style={{ padding: "8px", maxWidth: "250px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedPharmacy.name}
                    </h3>
                    <p style={{ margin: "4px 0", fontSize: "12px" }}>
                      📍 {selectedPharmacy.address}
                    </p>
                    {selectedPharmacy.phone_number && (
                      <p style={{ margin: "4px 0", fontSize: "12px" }}>
                        📞 {selectedPharmacy.phone_number}
                      </p>
                    )}
                    {selectedPharmacy.distance_km !== undefined && (
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "12px",
                          color: "#1e40af",
                          fontWeight: "bold",
                        }}
                      >
                        Distance:{" "}
                        {selectedPharmacy.distance_km < 1
                          ? `${(selectedPharmacy.distance_km * 1000).toFixed(
                              0
                            )} m`
                          : `${selectedPharmacy.distance_km.toFixed(1)} km`}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      </div>
    </div>
  );

  const labContent = (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        {renderLabList(
          nearestLabs,
          "Nearby Labs",
          <EnvironmentOutlined className="text-green-600" />
        )}
        {renderLabList(
          labPreferences,
          "Preferred Labs",
          <HeartFilled className="text-red-500" />,
          true
        )}
      </div>
      {/* Google Map for Labs */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-white p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
            <EnvironmentOutlined className="text-xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 m-0">Lab Map</h3>
        </div>
        <div className="h-[500px] w-full relative">
          <APIProvider apiKey={GOOGLE_API_KEY}>
            <Map
              key={selectedLab ? `lab-${selectedLab.lab_id}` : "lab-default"}
              defaultCenter={
                labMapCenter || {
                  lat: INITIAL_LATITUDE,
                  lng: INITIAL_LONGITUDE,
                }
              }
              defaultZoom={labMapCenter ? 16 : 13}
              mapId="lab-map"
              gestureHandling="greedy"
            >
              {/* Nearest Labs - Green Markers */}
              {nearestLabs.map((lab, index) =>
                lab.coordinates ? (
                  <AdvancedMarker
                    key={`nearest-lab-${lab.lab_id}-${index}`}
                    position={lab.coordinates}
                    title={lab.name}
                    onClick={() => handleSelectLab(lab)}
                  >
                    <Pin
                      background={
                        selectedLab?.lab_id === lab.lab_id
                          ? "#facc15"
                          : "#16a34a"
                      }
                      borderColor={
                        selectedLab?.lab_id === lab.lab_id
                          ? "#eab308"
                          : "#15803d"
                      }
                      glyphColor="#ffffff"
                      scale={selectedLab?.lab_id === lab.lab_id ? 1.3 : 1}
                    />
                  </AdvancedMarker>
                ) : null
              )}
              {/* Preferred Labs - Red Markers */}
              {labPreferences.map((lab, index) =>
                lab.coordinates ? (
                  <AdvancedMarker
                    key={`preferred-lab-${lab.lab_id}-${index}`}
                    position={lab.coordinates}
                    title={lab.name}
                    onClick={() => handleSelectLab(lab)}
                  >
                    <Pin
                      background={
                        selectedLab?.lab_id === lab.lab_id
                          ? "#facc15"
                          : "#dc2626"
                      }
                      borderColor={
                        selectedLab?.lab_id === lab.lab_id
                          ? "#eab308"
                          : "#991b1b"
                      }
                      glyphColor="#ffffff"
                      scale={selectedLab?.lab_id === lab.lab_id ? 1.3 : 1}
                    />
                  </AdvancedMarker>
                ) : null
              )}
              {/* InfoWindow for selected lab */}
              {selectedLab && selectedLab.coordinates && (
                <InfoWindow
                  position={selectedLab.coordinates}
                  onCloseClick={() => setSelectedLab(null)}
                >
                  <div style={{ padding: "8px", maxWidth: "250px" }}>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedLab.name}
                    </h3>
                    <p style={{ margin: "4px 0", fontSize: "12px" }}>
                      📍 {selectedLab.address}
                    </p>
                    {selectedLab.phone_number && (
                      <p style={{ margin: "4px 0", fontSize: "12px" }}>
                        📞 {selectedLab.phone_number}
                      </p>
                    )}
                    {selectedLab.distance_km !== undefined && (
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "12px",
                          color: "#16a34a",
                          fontWeight: "bold",
                        }}
                      >
                        Distance:{" "}
                        {selectedLab.distance_km < 1
                          ? `${(selectedLab.distance_km * 1000).toFixed(0)} m`
                          : `${selectedLab.distance_km.toFixed(1)} km`}
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {/* Selected Locations Display - Sticky (mode-aware: disable opposite box) */}
      <div className="sticky top-0 z-10 px-4 py-3 bg-gradient-to-r from-blue-50 to-green-50 border-b-2 border-gray-200 shadow-md">
        <div className="grid grid-cols-2 gap-4">
          {/* Selected Pharmacy Card */}
          <div
            className={`rounded-lg p-4 transition-all duration-300 ${
              storedPharmacy
                ? "bg-white border-2 border-blue-400 shadow-md"
                : "bg-gray-50 border-2 border-dashed border-gray-300"
            }`}
            style={mode === "requisition-only" ? { pointerEvents: "none", opacity: 0.4 } : undefined}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShopOutlined
                className={`text-lg ${
                  storedPharmacy ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className="font-semibold text-sm text-gray-700">
                Selected Pharmacy
              </span>
            </div>
            {mode !== "requisition-only" && storedPharmacy ? (
              <div className="space-y-1">
                <p
                  className="font-bold text-blue-900 text-sm truncate"
                  title={storedPharmacy.name}
                >
                  {storedPharmacy.name}
                </p>
                <p
                  className="text-xs text-gray-600 line-clamp-2"
                  title={storedPharmacy.address}
                >
                  📍 {storedPharmacy.address}
                </p>
              </div>
            ) : (
              mode === "requisition-only" ? null : (
                <p className="text-xs text-gray-400 italic">No pharmacy selected yet</p>
              )
            )}
          </div>

          {/* Selected Lab Card */}
          <div
            className={`rounded-lg p-4 transition-all duration-300 ${
              storedLab
                ? "bg-white border-2 border-green-400 shadow-md"
                : "bg-gray-50 border-2 border-dashed border-gray-300"
            }`}
            style={mode === "prescription-only" ? { pointerEvents: "none", opacity: 0.4 } : undefined}
          >
            <div className="flex items-center gap-2 mb-2">
              <ExperimentOutlined
                className={`text-lg ${
                  storedLab ? "text-green-600" : "text-gray-400"
                }`}
              />
              <span className="font-semibold text-sm text-gray-700">
                Selected Lab
              </span>
            </div>
            {mode !== "prescription-only" && storedLab ? (
              <div className="space-y-1">
                <p
                  className="font-bold text-green-900 text-sm truncate"
                  title={storedLab.name}
                >
                  {storedLab.name}
                </p>
                <p
                  className="text-xs text-gray-600 line-clamp-2"
                  title={storedLab.address}
                >
                  📍 {storedLab.address}
                </p>
              </div>
            ) : (
              mode === "prescription-only" ? null : (
                <p className="text-xs text-gray-400 italic">No lab selected yet</p>
              )
            )}
          </div>
        </div>
      </div>

      <div className="px-4">
        {mode === "dual" ? (
          <>
            <div className="flex p-1 bg-slate-100 rounded-2xl mt-4 mb-4 w-fit mx-auto">
              <button
                onClick={() => setActiveTab("pharmacy")}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-lg font-bold transition-all duration-300 border-none cursor-pointer ${
                  activeTab === "pharmacy"
                    ? "bg-white text-blue-600 shadow-md scale-105"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShopOutlined className="text-xl" />
                Pharmacy
              </button>
              <button
                onClick={() => setActiveTab("lab")}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-lg font-bold transition-all duration-300 border-none cursor-pointer ${
                  activeTab === "lab"
                    ? "bg-white text-green-600 shadow-md scale-105"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <ExperimentOutlined className="text-xl" />
                Lab
              </button>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === "pharmacy" ? pharmacyContent : labContent}
            </div>
          </>
        ) : mode === "prescription-only" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{pharmacyContent}</div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{labContent}</div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
