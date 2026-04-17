"use client";

import { useEffect, useRef, useState } from "react";
import { parseNominatimAddress, buildLocationPayload } from "@/lib/location";

/* Leaflet is browser-only — we import it inside useEffect */

const DEFAULT_CENTER = [17.385, 78.4867]; // Hyderabad, India
const DEFAULT_ZOOM   = 13;

export default function LeafletMapPicker({ onLocationPicked }) {
  const mapRef      = useRef(null);   // DOM node
  const leafletRef  = useRef(null);   // L instance
  const mapInstance = useRef(null);   // map object
  const markerRef   = useRef(null);   // draggable marker

  const [resolving, setResolving] = useState(false);
  const [preview, setPreview]     = useState(null); // { label, raw }

  /* ── Reverse geocode via Nominatim ── */
  const reverseGeocode = async (lat, lng) => {
    setResolving(true);
    setPreview(null);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "HashWorks-App/1.0" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const parsed  = parseNominatimAddress(addr);
      const payload = buildLocationPayload(addr, lat, lng, "manual");

      const label = [parsed.neighbourhood, parsed.suburb, parsed.city]
        .filter(Boolean).join(", ") || data.display_name?.substring(0, 60);

      setPreview({ label, display_name: data.display_name });
      if (onLocationPicked) {
        onLocationPicked({
          ...payload,
          neighbourhood: parsed.neighbourhood,
          suburb:        parsed.suburb,
          display_name:  data.display_name,
        });
      }
    } catch (err) {
      console.error("Reverse geocode failed", err);
      setPreview({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, display_name: "" });
    } finally {
      setResolving(false);
    }
  };

  /* ── Init Leaflet once ── */
  useEffect(() => {
    if (mapInstance.current) return; // already inited

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      leafletRef.current = L;

      /* Fix default icon path for Next.js / webpack */
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center:           DEFAULT_CENTER,
        zoom:             DEFAULT_ZOOM,
        zoomControl:      true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      /* Draggable marker at default center */
      const marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapInstance.current = map;

      /* Initial geocode */
      reverseGeocode(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);

      /* On drag end → reverse geocode */
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        reverseGeocode(lat, lng);
      });

      /* Click anywhere on map → move marker + geocode */
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    }

    if (mapRef.current) init();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          height: "280px",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          position: "relative",
          zIndex: 0,
        }}
      />

      {/* Address preview */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: "14px",
          padding: "14px 16px",
          minHeight: "52px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        {resolving ? (
          <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
            Detecting address…
          </span>
        ) : preview ? (
          <div>
            <p style={{ margin: 0, fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>
              {preview.label}
            </p>
            {preview.display_name && (
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
                {preview.display_name.substring(0, 80)}
                {preview.display_name.length > 80 ? "…" : ""}
              </p>
            )}
          </div>
        ) : (
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            Tap the map or drag the pin to set your location
          </span>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
        📍 Drag the marker or tap anywhere to drop a pin
      </p>
    </div>
  );
}
