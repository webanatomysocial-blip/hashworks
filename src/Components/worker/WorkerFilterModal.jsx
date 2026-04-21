"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiNavigation, FiZap, FiMapPin, FiLayers, FiBriefcase } from "react-icons/fi";
import "@/css/worker.css";

const CATEGORIES = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'moving', label: 'Moving' },
  { id: 'repair', label: 'Repair' },
  { id: 'development', label: 'Dev' },
  { id: 'design', label: 'Design' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'other', label: 'Other' }
];

const MODES = [
  { id: 'remote', label: 'Remote' },
  { id: 'onsite', label: 'Onsite' },
  { id: 'hybrid', label: 'Hybrid' }
];

const URGENCY = [
  { id: 'immediate', label: 'Urgent' },
  { id: 'flexible', label: 'Flexible' }
];

export default function WorkerFilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Robust Scroll Lock
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      category: "all",
      budget: 0,
      budget_max: 0,
      location_type: "all",
      urgency: "all",
      city: "",
      radius: 0,
    });
  };

  return (
    <div className="hw-modal-overlay" onClick={onClose}>
      <div className="hw-modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 className="text-headline-lg">Filter Tasks</h2>
          <button className="hw-icon-box-sm" onClick={onClose} style={{ border: 'none', cursor: 'pointer' }}>
            <FiX size={20} />
          </button>
        </div>

        <div className="hw-flex hw-flex-col hw-gap-24">
          
          {/* Categories Grid */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-text-primary)' }}>
              <FiLayers size={14} /> CATEGORY
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {CATEGORIES.map((cat) => {
                const isActive = localFilters.category === cat.id;
                return (
                  <button 
                    key={cat.id}
                    className={`hw-filter-card ${isActive ? 'active' : ''}`}
                    onClick={() => setLocalFilters({ ...localFilters, category: isActive ? 'all' : cat.id })}
                    style={{ padding: '12px 0' }}
                  >
                    <span style={{ fontSize: '10px' }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Budget Range Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-text-primary)' }}>
              <FiBriefcase size={14} /> BUDGET RANGE (₹)
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="hw-input"
                  style={{ height: '48px', fontSize: '14px', borderRadius: '16px' }}
                  placeholder="Min"
                  value={localFilters.budget || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, budget: parseInt(e.target.value) || 0 })}
                />
              </div>
              <span style={{ color: 'var(--hw-text-secondary)', fontWeight: 500 }}>—</span>
              <div style={{ flex: 1 }}>
                <input 
                  type="number" 
                  className="hw-input"
                  style={{ height: '48px', fontSize: '14px', borderRadius: '16px' }}
                  placeholder="Max"
                  value={localFilters.budget_max || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, budget_max: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </section>

          {/* Work Mode */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-text-primary)' }}>
              <FiZap size={14} /> WORK MODE
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {MODES.map((mode) => {
                const isActive = localFilters.location_type === mode.id;
                return (
                  <button 
                    key={mode.id}
                    className={`hw-filter-card ${isActive ? 'active' : ''}`}
                    style={{ flex: 1, padding: '14px', minHeight: '48px' }}
                    onClick={() => setLocalFilters({ ...localFilters, location_type: isActive ? 'all' : mode.id })}
                  >
                    <span style={{ fontSize: '14px' }}>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Urgency */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-text-primary)' }}>
              <FiZap size={14} /> URGENCY
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {URGENCY.map((urg) => {
                const isActive = localFilters.urgency === urg.id;
                return (
                  <button 
                    key={urg.id}
                    className={`hw-filter-card ${isActive ? 'active' : ''}`}
                    style={{ flex: 1, padding: '14px', minHeight: '48px' }}
                    onClick={() => setLocalFilters({ ...localFilters, urgency: isActive ? 'all' : urg.id })}
                  >
                    <span style={{ fontSize: '14px' }}>{urg.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Radius Slider */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-text-primary)' }}>
                <FiNavigation size={14} /> RADIUS (KM)
              </div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--hw-primary)' }}>
                {localFilters.radius === 0 ? "Anywhere" : `${localFilters.radius} km`}
              </span>
            </div>
            <div style={{ padding: '0 4px' }}>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={localFilters.radius || 0}
                  onChange={(e) => setLocalFilters({ ...localFilters, radius: parseInt(e.target.value) })}
                  style={{ 
                      width: '100%', accentColor: 'var(--hw-primary)',
                      height: '6px', background: 'var(--hw-surface-high)', borderRadius: '10px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--hw-text-secondary)', fontWeight: '600' }}>
                  <span>Anywhere</span>
                  <span>25km</span>
                  <span>50km</span>
                </div>
            </div>
          </section>

        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '48px' }}>
          <button className="hw-btn hw-btn-ghost hw-flex-1" onClick={handleReset} style={{ border: '1.5px solid var(--hw-surface-high)', height: '52px' }}>
            Reset All
          </button>
          <button className="hw-btn hw-btn-primary hw-flex-1" onClick={handleApply} style={{ height: '52px' }}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
