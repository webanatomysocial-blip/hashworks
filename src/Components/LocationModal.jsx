'use client';

import { useState, useEffect } from 'react';
import { FiArrowLeft, FiMapPin, FiSearch } from 'react-icons/fi';
import { MdMyLocation } from 'react-icons/md';
import { supabase } from '@/lib/supabase';
import '@/css/LocationModal.css';

export default function LocationModal({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedLoc, setSelectedLoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const popularAreas = ['HITECH CITY', 'GACHIBOWLI', 'KUKATPALLY', 'MADHAPUR'];

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedLoc(null);
        }
    }, [isOpen]);

    const handleSearch = async (val) => {
        setQuery(val);
        setSelectedLoc(null);
        if (val.length < 3) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/location/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setResults(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectArea = (area) => {
        handleSearch(area);
    };

    const handleSelectResult = (place) => {
        setQuery(place.display_name);
        setSelectedLoc({ ...place, source: 'manual' });
        setResults([]);
    };

    const handleIPLocation = async () => {
        setDetecting(true);
        setSelectedLoc(null);
        try {
            const res = await fetch('/api/location/ip');
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || 'Check your internet connection');
            }

            setSelectedLoc({ ...data, source: 'ip' });
            // Don't set query immediately to avoid overriding search if user was typing
            // but show evidence in UI
        } catch (err) {
            console.error('Location detection error:', err);
            alert(`Failed to detect location: ${err.message}. Try searching manually.`);
        } finally {
            setDetecting(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedLoc) {
            alert("Please select a location first.");
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('profiles').update({
                city: selectedLoc.city,
                country: selectedLoc.country,
                latitude: selectedLoc.latitude,
                longitude: selectedLoc.longitude,
                location_source: selectedLoc.source
            }).eq('id', user.id);

            if (error) {
                console.error(error);
                if (error.message.includes("city")) {
                    await supabase.from('profiles').update({
                        country: selectedLoc.country,
                        latitude: selectedLoc.latitude,
                        longitude: selectedLoc.longitude,
                        location_source: selectedLoc.source
                    }).eq('id', user.id);
                } else {
                    throw error;
                }
            }

            onClose();
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Failed to save location.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="location-modal-overlay" onClick={onClose}>
            <div className="location-modal-content" onClick={e => e.stopPropagation()}>
                <div className="lm-header">
                    <button className="lm-back" onClick={onClose}><FiArrowLeft /></button>
                    <h2>Location Settings</h2>
                </div>

                <div className="lm-section">
                    <p className="lm-label" style={{ marginBottom: '24px', textAlign: 'center' }}>Auto-Detect Location</p>
                    <button className="lm-gps-btn" onClick={handleIPLocation} disabled={detecting}>
                        <MdMyLocation size={20} />
                        {detecting ? 'Detecting...' : 'Detect Location'}
                    </button>
                    {selectedLoc && !detecting && (
                        <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Selected Address</p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{selectedLoc.display_name}</p>
                        </div>
                    )}
                </div>

                <div className="lm-footer" style={{ marginTop: 'auto' }}>
                    <button className="lm-confirm-btn" onClick={handleConfirm} disabled={!selectedLoc || detecting}>
                        Confirm Location
                    </button>
                    <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>
                        Uses IP-based detection for privacy and convenience.
                    </p>
                </div>
            </div>
        </div>
    );
}
