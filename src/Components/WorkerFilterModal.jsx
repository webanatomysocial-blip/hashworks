import React, { useState } from "react";
import { FiX } from "react-icons/fi";
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
    if (val >= 100000) return "₹1,00,000+";
    return `₹${val.toLocaleString()}+`;
  };

  return (
    <div className="fm-overlay">
      <div className="fm-container">
        <div className="fm-header">
          <h2>Filters</h2>
          <button className="fm-close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="fm-body">
          {/* Category */}
          <div className="fm-section">
            <div className="fm-label">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              CATEGORY
            </div>
            <div className="fm-grid-2">
              {["Development", "Design", "Marketing", "Other"].map((cat) => {
                const dbVal = cat.toLowerCase();
                const isSelected = localFilters.category === dbVal;
                return (
                  <label key={cat} className="fm-radio-card">
                    <input
                      type="radio"
                      name="category"
                      checked={isSelected}
                      onChange={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          category: dbVal,
                        }))
                      }
                    />
                    <div
                      className={`fm-radio-circle ${isSelected ? "selected" : ""}`}
                    ></div>
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Work Mode */}
          <div className="fm-section">
            <div className="fm-label">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              WORK MODE
            </div>
            <div className="fm-grid-2">
              {["Remote", "Onsite", "Hybrid"].map((mode) => {
                const dbVal = mode.toLowerCase();
                const isSelected = localFilters.location_type === dbVal;
                return (
                  <label key={mode} className="fm-radio-card">
                    <input
                      type="radio"
                      name="location_type"
                      checked={isSelected}
                      onChange={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          location_type: dbVal,
                        }))
                      }
                    />
                    <div
                      className={`fm-radio-circle ${isSelected ? "selected" : ""}`}
                    ></div>
                    <span>{mode}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div className="fm-section">
            <div className="fm-label">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              URGENCY
            </div>
            <div className="fm-grid-2">
              {["Immediate", "High", "Flexible"].map((urg) => {
                const dbVal = urg.toLowerCase();
                const isSelected = localFilters.urgency === dbVal;
                return (
                  <label key={urg} className="fm-radio-card">
                    <input
                      type="radio"
                      name="urgency"
                      checked={isSelected}
                      onChange={() =>
                        setLocalFilters((prev) => ({ ...prev, urgency: dbVal }))
                      }
                    />
                    <div
                      className={`fm-radio-circle ${isSelected ? "selected" : ""}`}
                    ></div>
                    <span>{urg}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* City */}
          <div className="fm-section">
            <div className="fm-label">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              CITY / LOCATION
            </div>
            <input
              type="text"
              className="fm-text-input"
              placeholder="e.g. Bangalore"
              value={localFilters.city || ""}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, city: e.target.value }))
              }
            />
          </div>

          {/* Radius Filter */}
          <div className="fm-section">
            <div className="fm-label-row">
              <div className="fm-label">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                RADIUS (KM)
              </div>
              <span className="fm-value-txt">
                {localFilters.radius === 0
                  ? "Any"
                  : `${localFilters.radius} km`}
              </span>
            </div>
            <div className="fm-slider-wrap">
              <input
                type="range"
                min="0"
                max="20"
                step="5"
                value={localFilters.radius || 0}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    radius: parseInt(e.target.value) || 0,
                  }))
                }
                className="fm-slider"
              />
              <div className="fm-slider-labels">
                <span>Any</span>
                <span>5k</span>
                <span>10k</span>
                <span>15k</span>
                <span>20k</span>
              </div>
            </div>
          </div>

          {/* Budget Range */}
          <div className="fm-section">
            <div className="fm-label-row">
              <div className="fm-label">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                BUDGET RANGE
              </div>
              <span className="fm-value-txt">
                {formatBudget(localFilters.budget)}
              </span>
            </div>
            <div className="fm-slider-wrap">
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={localFilters.budget}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    budget: parseInt(e.target.value) || 0,
                  }))
                }
                className="fm-slider"
              />
            </div>
          </div>

          {/* Minimum Rating (Mock UI matching image) */}
          {/* <div className="fm-section">
                        <div className="fm-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            MINIMUM RATING
                        </div>
                        <div className="fm-grid-2">
                            {['4.5+', '4.0+', '3.5+', 'Any'].map(ratingText => {
                                const valStr = ratingText.replace('+', '');
                                const valNum = valStr === 'Any' ? 0 : parseFloat(valStr);
                                const isSelected = localFilters.rating === valNum;
                                return (
                                    <button
                                        key={ratingText}
                                        className={`fm-rating-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleRatingChange(valNum)}
                                    >
                                        {ratingText} <span className="fm-star">★</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div> */}
        </div>

        <div className="fm-footer">
          <button className="fm-reset-btn" onClick={handleReset}>
            Reset All
          </button>
          <button className="fm-apply-btn" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
