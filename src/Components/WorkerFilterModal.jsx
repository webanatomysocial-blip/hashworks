import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import '@/css/worker.css';

export default function WorkerFilterModal({ isOpen, onClose, filters, onApply }) {
    const [localFilters, setLocalFilters] = useState(filters);

    if (!isOpen) return null;

    const handleCategoryChange = (category) => {
        setLocalFilters(prev => ({ ...prev, category }));
    };

    const handleBudgetChange = (e) => {
        setLocalFilters(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }));
    };

    const handleRatingChange = (rating) => {
        setLocalFilters(prev => ({ ...prev, rating }));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const formatBudget = (val) => {
        if (val === 0) return 'Any';
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                            CATEGORY
                        </div>
                        <div className="fm-grid-2">
                            {['Development', 'Design', 'Marketing', 'Writing', 'Sales', 'Admin'].map(cat => {
                                // map nice UI names to schema values
                                const dbVal = cat.toLowerCase();
                                const isSelected = localFilters.category === dbVal;
                                return (
                                    <label key={cat} className="fm-radio-card">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={isSelected}
                                            onChange={() => handleCategoryChange(dbVal)}
                                        />
                                        <div className={`fm-radio-circle ${isSelected ? 'selected' : ''}`}></div>
                                        <span>{cat}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Budget Range */}
                    <div className="fm-section">
                        <div className="fm-label-row">
                            <div className="fm-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                BUDGET RANGE
                            </div>
                            <span className="fm-value-txt">{formatBudget(localFilters.budget)}</span>
                        </div>
                        <div className="fm-slider-wrap">
                            <input
                                type="range"
                                min="0" max="50000" step="1000"
                                value={localFilters.budget}
                                onChange={handleBudgetChange}
                                className="fm-slider"
                            />
                        </div>
                    </div>



                    {/* Minimum Rating (Mock UI matching image) */}
                    <div className="fm-section">
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
                    </div>
                </div>

                <div className="fm-footer">
                    <button className="fm-apply-btn" onClick={handleApply}>
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
