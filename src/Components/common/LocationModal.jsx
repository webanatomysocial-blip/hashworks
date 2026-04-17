"use client";

import { useState, useEffect, useCallback } from "react";
import { FiArrowLeft, FiMapPin, FiNavigation } from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";
import { supabase } from "@/lib/supabase";
import HashLoader from "./HashLoader";
import { parseNominatimAddress, buildLocationPayload, formatLocation } from "@/lib/location";
import "@/css/LocationModal.css";

// Dynamically import LeafletMapPicker — Leaflet is browser-only
import dynamic_ from "next/dynamic";
const LeafletMapPicker = dynamic_(() => import("./LeafletMapPicker"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "280px", borderRadius: "20px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <HashLoader text="" />
    </div>
  ),
});

export default function LocationModal({ isOpen, onClose, onLocationUpdate }) {
  const [step, setStep] = useState("choice"); // 'choice' | 'gps' | 'map'
  const [detecting, setDetecting] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep("choice");
      setSelectedLoc(null);
    }
  }, [isOpen]);

  /* ── GPS reverse geocode ── */
  const geocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        { headers: { "User-Agent": "HashWorks-App/1.0" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const parsed  = parseNominatimAddress(addr);
      const payload = buildLocationPayload(addr, lat, lon, "gps");

      return {
        ...payload,
        display_name:  data.display_name,
        neighbourhood: parsed.neighbourhood,
        suburb:        parsed.suburb,
      };
    } catch (err) {
      console.error("Geocoding failed", err);
      return null;
    }
  };

  const handleGPSDetect = async () => {
    setStep("gps");
    setDetecting(true);
    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("No Geolocation"));
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      const data = await geocode(latitude, longitude);
      if (data) {
        setSelectedLoc(data);
      } else {
        throw new Error("Geocoding failed");
      }
    } catch (err) {
      alert("Unable to detect location via GPS.");
      setStep("choice");
    } finally {
      setDetecting(false);
    }
  };

  /* ── Called by LeafletMapPicker whenever pin moves ── */
  const handleMapPick = useCallback((loc) => {
    setSelectedLoc(loc);
  }, []);

  /* ── Save to Supabase ── */
  const handleConfirm = async () => {
    if (!selectedLoc) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const updateData = {
        city:            selectedLoc.city,
        subcity:         selectedLoc.subcity,
        latitude:        selectedLoc.latitude,
        longitude:       selectedLoc.longitude,
        location_source: selectedLoc.location_source,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      if (onLocationUpdate) onLocationUpdate(selectedLoc);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save location: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title =
    step === "choice" ? "Set Your Location"
    : step === "gps"  ? "Auto-Detect"
    :                   "Drop Pin on Map";

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div
        className={`location-modal-content ${step === "map" ? "location-modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lm-header">
          {step !== "choice" && (
            <button className="lm-back" onClick={() => { setStep("choice"); setSelectedLoc(null); }}>
              <FiArrowLeft />
            </button>
          )}
          <h2>{title}</h2>
        </div>

        {/* ── CHOICE STEP ── */}
        {step === "choice" && (
          <div className="lm-option-grid">
            <div className="lm-option-card" onClick={handleGPSDetect}>
              <div className="lm-opt-icon"><MdMyLocation size={24} /></div>
              <div className="lm-opt-text">
                <h4>Use Current Location</h4>
                <p>Fast detection via GPS</p>
              </div>
            </div>

            <div className="lm-option-card" onClick={() => setStep("map")}>
              <div className="lm-opt-icon"><FiMapPin size={24} /></div>
              <div className="lm-opt-text">
                <h4>Drop Pin on Map</h4>
                <p>Drag the pin on OpenStreetMap</p>
              </div>
            </div>
          </div>
        )}

        {/* ── GPS STEP ── */}
        {step === "gps" && (
          <div className="lm-gps-detecting">
            {detecting ? (
              <HashLoader text="" />
            ) : selectedLoc ? (
              <div className="lm-selected">
                <FiNavigation color="#0047ff" size={28} />
                <p style={{ fontWeight: "800", marginTop: "16px", fontSize: "18px", color: "#0f172a" }}>
                  {formatLocation({
                    neighbourhood: selectedLoc.neighbourhood,
                    suburb:        selectedLoc.suburb,
                    city:          selectedLoc.city,
                  })}
                </p>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.5", textAlign: "center" }}>
                  {selectedLoc.display_name?.substring(0, 90)}{selectedLoc.display_name?.length > 90 ? "…" : ""}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── MAP STEP — Leaflet ── */}
        {step === "map" && (
          <LeafletMapPicker onLocationPicked={handleMapPick} />
        )}

        {/* Confirm button — only on gps/map steps */}
        {step !== "choice" && (
          <div style={{ paddingTop: "8px" }}>
            <button
              className="lm-confirm-btn"
              disabled={!selectedLoc || loading}
              onClick={handleConfirm}
            >
              {loading ? <HashLoader text="" /> : "Confirm Location"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
