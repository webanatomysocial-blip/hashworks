 "use client";

import React, { useState } from "react";
import { FiX, FiCheck, FiNavigation, FiZap, FiMapPin, FiLayers, FiDollarSign } from "react-icons/fi";
import "@/css/worker.css";

export default function WorkerFilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      category: "all",
      budget: 0,
      location_type: "all",
      urgency: "all",
      city: "",
      radius: 0,
    };
    setLocalFilters(resetFilters);
  };

  const formatBudget = (val) => {
    if (val === 0) return "Any";
    if (val >= 100000) return "₹1L+";
    return `₹${val.toLocaleString()}+`;
  };

  return (
    <div className="wh-modal-overlay" onClick={onClose}>
      <div className="wh-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="wh-modal-header">
          <h2>Filter Gigs</h2>
          <button className="wh-modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="wh-modal-body">
          {/* Category */}
          <div className="wh-modal-section">
            <div className="wh-modal-label">
              <FiLayers size={14} /> CATEGORY
            </div>
            <div className="wh-modal-grid">
              {["Development", "Design", "Marketing", "Other"].map((cat) => {
                const dbVal = cat.toLowerCase();
                const isActive = localFilters.category === dbVal;
                return (
                  <div key={cat} className={`wh-radio-card ${isActive ? 'active' : ''}`} onClick={() => setLocalFilters({ ...localFilters, category: dbVal })}>
                    <div className={`wh-radio-circle ${isActive ? 'active' : ''}`} />
                    <span>{cat}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Mode */}
          <div className="wh-modal-section">
            <div className="wh-modal-label">
              <FiZap size={14} /> WORK MODE
            </div>
            <div className="wh-modal-grid">
              {["Remote", "Onsite", "Hybrid"].map((mode) => {
                const dbVal = mode.toLowerCase();
                const isActive = localFilters.location_type === dbVal;
                return (
                  <div key={mode} className={`wh-radio-card ${isActive ? 'active' : ''}`} onClick={() => setLocalFilters({ ...localFilters, location_type: dbVal })}>
                    <div className={`wh-radio-circle ${isActive ? 'active' : ''}`} />
                    <span>{mode}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div className="wh-modal-section">
            <div className="wh-modal-label">
              <FiZap size={14} /> URGENCY
            </div>
            <div className="wh-modal-grid">
              {["Immediate", "High", "Flexible"].map((urg) => {
                const dbVal = urg.toLowerCase();
                const isActive = localFilters.urgency === dbVal;
                return (
                  <div key={urg} className={`wh-radio-card ${isActive ? 'active' : ''}`} onClick={() => setLocalFilters({ ...localFilters, urgency: dbVal })}>
                    <div className={`wh-radio-circle ${isActive ? 'active' : ''}`} />
                    <span>{urg}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div className="wh-modal-section">
            <div className="wh-modal-label">
              <FiMapPin size={14} /> CITY / LOCATION
            </div>
            <input
              type="text"
              className="wh-pill"
              style={{ width: '100%', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}
              placeholder="e.g. Hyderabad"
              value={localFilters.city || ""}
              onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
            />
          </div>

          {/* Distance Radius */}
          <div className="wh-modal-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="wh-modal-label">
                <FiNavigation size={14} /> RADIUS (KM)
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>
                {localFilters.radius === 0 ? "Anywhere" : `${localFilters.radius} km`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={localFilters.radius || 0}
              onChange={(e) => setLocalFilters({ ...localFilters, radius: parseInt(e.target.value) })}
              style={{ width: '100%', height: '6px', appearance: 'none', background: '#e2e8f0', borderRadius: '5px', marginTop: '12px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
              <span>Anywhere</span>
              <span>10km</span>
              <span>25km</span>
              <span>50km</span>
            </div>
          </div>
        </div>

        <div className="wh-modal-footer">
          <button className="wh-btn-reset" onClick={handleReset}>Reset All</button>
          <button className="wh-btn-apply" onClick={handleApply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
