'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import '@/css/dashboard.css';

export default function PostJobModal({ isOpen, onClose, onJobPosted, jobToEdit }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        status: 'open'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 400); // Match CSS animation duration
    };

    // Sync form with jobToEdit
    useEffect(() => {
        if (jobToEdit) {
            setFormData({
                title: jobToEdit.title || '',
                description: jobToEdit.description || '',
                budget: jobToEdit.budget || '',
                status: jobToEdit.status || 'open'
            });
        } else {
            setFormData({
                title: '',
                description: '',
                budget: '',
                status: 'open'
            });
        }
    }, [jobToEdit, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to post a job');

            if (jobToEdit) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('jobs')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        budget: parseFloat(formData.budget),
                        status: formData.status,
                    })
                    .eq('id', jobToEdit.id);

                if (updateError) throw updateError;
            } else {
                // INSERT
                const { error: insertError } = await supabase
                    .from('jobs')
                    .insert([
                        {
                            hirer_id: user.id,
                            title: formData.title,
                            description: formData.description,
                            budget: parseFloat(formData.budget),
                            status: formData.status,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (insertError) throw insertError;
            }

            // Success
            if (onJobPosted) await onJobPosted();
            handleClose();
        } catch (err) {
            console.error('Error saving job:', err);
            setError(err.message || 'Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`modal-container ${isClosing ? 'closing' : ''}`}>
                <div className="modal-header">
                    <h2 className="modal-title">{jobToEdit ? 'Edit Job' : 'Post a New Job'}</h2>
                    <button className="modal-close-btn" onClick={handleClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <form
                    className="modal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                    }}
                >
                    <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                            type="text"
                            name="title"
                            className="form-input"
                            placeholder="e.g. Website Development"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            name="description"
                            className="form-textarea"
                            placeholder="Describe the project requirements..."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Budget</label>
                            <input
                                type="number"
                                name="budget"
                                className="form-input"
                                placeholder="500"
                                value={formData.budget}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                name="status"
                                className="form-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="open">Open</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="form-submit-btn" disabled={loading}>
                        {loading ? 'Saving...' : (jobToEdit ? 'Update Job' : 'Post Job')}
                    </button>
                </form>
            </div>
        </div>
    );
}
