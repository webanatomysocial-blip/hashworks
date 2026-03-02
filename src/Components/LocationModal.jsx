"use client";

import { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";
import { supabase } from "@/lib/supabase";
import "@/css/LocationModal.css";

export default function LocationModal({ isOpen, onClose }) {
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLoc(null);
    }
  }, [isOpen]);

  /* =========================
     GPS + SAFE IP FALLBACK
  ========================== */
  const handleDetectLocation = async () => {
    setDetecting(true);
    setSelectedLoc(null);

    const getGPSLocation = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

    const getIPLocation = async () => {
      const geoRes = await fetch("https://ipapi.co/json/", {
        cache: "no-store",
      });

      if (!geoRes.ok) throw new Error("IP Geolocation failed");

      return geoRes.json();
    };

    try {
      let locationData = null;
      let source = "gps";

      try {
        // 🔹 Try GPS first
        const position = await getGPSLocation();
        const { latitude, longitude } = position.coords;

        try {
          // 🔹 Reverse geocode (optional enhancement)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "HashWorks-App/1.0" } },
          );

          const data = await res.json();

          locationData = {
            display_name: data.display_name || "Detected via GPS",
            city:
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "Unknown",
            country: data.address?.country || "Unknown",
            latitude,
            longitude,
          };
        } catch (reverseErr) {
          console.warn("Reverse geocode failed, using raw GPS coords");

          // 🔹 Even if reverse fails, still use GPS
          locationData = {
            display_name: "Location detected via GPS",
            city: "Unknown",
            country: "Unknown",
            latitude,
            longitude,
          };
        }
      } catch (gpsErr) {
        // 🔹 Fallback ONLY if permission denied
        if (gpsErr.code === 1) {
          console.warn("GPS permission denied. Falling back to IP.");
          source = "ip";

          const geoData = await getIPLocation();

          locationData = {
            display_name: `${geoData.city}, ${geoData.country_name}`,
            city: geoData.city || "Unknown",
            country: geoData.country_name || "Unknown",
            latitude: geoData.latitude,
            longitude: geoData.longitude,
          };
        } else {
          throw gpsErr;
        }
      }

      if (!locationData) throw new Error("Unable to determine location");

      setSelectedLoc({ ...locationData, source });
    } catch (err) {
      console.error("Location detection error:", err);
      alert("Unable to detect location. Please try again.");
    } finally {
      setDetecting(false);
    }
  };

  /* =========================
     SAVE TO SUPABASE
  ========================== */
  const handleConfirm = async () => {
    if (!selectedLoc) {
      alert("Please select a location first.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User session not found.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          city: selectedLoc.city,
          country: selectedLoc.country,
          latitude: selectedLoc.latitude,
          longitude: selectedLoc.longitude,
          location_source: selectedLoc.source,
        })
        .eq("id", user.id);

      if (error) throw error;

      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save location.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay" onClick={onClose}>
      <div
        className="location-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lm-header">
          <button className="lm-back" onClick={onClose}>
            <FiArrowLeft />
          </button>
          <h2>Location</h2>
        </div>

        <div className="lm-section">
          <p
            className="lm-label"
            style={{ marginBottom: "24px", textAlign: "center" }}
          >
            Auto-Detect Location
          </p>

          <button
            className="lm-gps-btn"
            onClick={handleDetectLocation}
            disabled={detecting}
          >
            <MdMyLocation size={20} />
            {detecting ? "Detecting..." : "Detect Location"}
          </button>

          {selectedLoc && !detecting && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "#0f172a",
                  fontWeight: "500",
                }}
              >
                {selectedLoc.display_name}
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Lat: {selectedLoc.latitude.toFixed(4)}, Lon:{" "}
                {selectedLoc.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        <div className="lm-footer" style={{ marginTop: "auto" }}>
          <button
            className="lm-confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedLoc || detecting || loading}
          >
            {loading ? "Saving..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
