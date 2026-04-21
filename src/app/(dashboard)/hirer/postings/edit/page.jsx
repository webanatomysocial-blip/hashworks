"use client";

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    FiArrowLeft, FiArrowRight, FiCalendar, FiClock, 
    FiTarget, FiZap, FiGlobe, FiMapPin, FiX, 
    FiCheck, FiMic, FiAlertCircle, FiChevronRight, 
    FiChevronLeft, FiPlus, FiBriefcase, FiMoreHorizontal 
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/Button";
import { Badge } from "@/Components/ui/Badge";
import { TaskCard } from "@/Components/ui/TaskCard";
import '@/css/hirer.css';

const EMPTY_FORM = {
    title: '',
    category: 'other',
    urgency: 'flexible',
    description: '',
    budget_max: '',
    location_type: 'onsite',
    city: '',
    subcity: '',
    verified_only: false,
    start_date: '',
    start_time: '14:00',
    estimated_minutes: '60',
    payout_type: 'fixed',
    work_environment: 'indoor',
    is_one_time: true,
    skills: '',
    tools: '',
    status: 'active',
    reference_image_url: null,
};

const CATEGORIES = [
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'moving', label: 'Moving' },
    { id: 'repair', label: 'Repair' },
    { id: 'other', label: 'Other' },
];

const BUDGET_SUGGESTIONS = [
    { id: 'light', amount: 100, label: 'LIGHT TASK' },
    { id: 'recommended', amount: 250, label: 'RECOMMENDED', badge: 'FAIR PRICE' },
    { id: 'premium', amount: 500, label: 'PREMIUM' },
];

function EditJobContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const fetchJobData = useCallback(async () => {
        if (!jobId) return;
        setFetching(true);
        try {
            const { data: job, error: fetchErr } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (fetchErr) throw fetchErr;

            setFormData({
                title: job.title || '',
                category: job.category || 'other',
                urgency: job.urgency || 'flexible',
                description: job.description || '',
                budget_max: job.budget_max != null ? String(job.budget_max) : '',
                location_type: job.location_type || 'onsite',
                city: job.city || '',
                subcity: job.subcity || '',
                verified_only: job.verified_only || false,
                start_date: job.start_date || '',
                start_time: job.start_time || '14:00',
                estimated_minutes: String(job.estimated_minutes || '60'),
                payout_type: job.payout_type || 'fixed',
                work_environment: job.work_environment || 'indoor',
                is_one_time: job.is_one_time !== false,
                status: job.status || 'active',
                reference_image_url: job.reference_image_url || null,
            });

            if (job.reference_image_url) {
                setImagePreviewUrl(job.reference_image_url);
            }
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Failed to load job data.');
        } finally {
            setFetching(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchJobData();
    }, [fetchJobData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const isStepValid = () => {
        if (step === 1) {
            return formData.title.trim() !== '' && formData.category !== '' && formData.description.trim() !== '';
        }
        if (step === 2) {
            if (formData.location_type === 'onsite') {
                return formData.city.trim() !== '';
            }
            return true;
        }
        if (step === 3) {
            return formData.start_date !== '' && formData.start_time !== '';
        }
        if (step === 4) {
            return formData.budget_max !== '' && parseFloat(formData.budget_max) > 0;
        }
        return true;
    };

    const nextStep = () => {
        if (isStepValid() && step < 4) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!isStepValid()) return;
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to edit a job.');

            let uploadedImageUrl = formData.reference_image_url;
            const fileInput = document.getElementById('reference-image');
            const file = fileInput?.files?.[0];

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('Task-Images').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('Task-Images').getPublicUrl(filePath);
                uploadedImageUrl = publicUrl;
            }

            const payload = {
                title: formData.title.trim(),
                category: formData.category,
                urgency: formData.urgency,
                description: formData.description.trim(),
                budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
                location_type: formData.location_type,
                city: formData.city.trim() || null,
                subcity: formData.subcity.trim() || null,
                verified_only: formData.verified_only,
                start_date: formData.start_date || null,
                start_time: formData.start_time || null,
                estimated_minutes: parseInt(formData.estimated_minutes) || 60,
                payout_type: formData.payout_type,
                work_environment: formData.work_environment,
                is_one_time: formData.is_one_time,
                reference_image_url: uploadedImageUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: upErr } = await supabase.from('jobs').update(payload).eq('id', jobId);
            if (upErr) throw upErr;
            
            router.push(`/hirer/postings/view?id=${jobId}`);
        } catch (err) {
            console.error('Error updating job:', err);
            setError(err.message || 'Failed to update job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="Loading task details..." /></div>;
    if (loading) return <HashLoader text="Updating task..." />;

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px', 
                background: '#fff', 
                position: 'sticky', 
                top: 0, 
                zIndex: 100, 
                borderBottom: '1.5px solid #f1f5f9'
            }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                    <FiChevronLeft size={24} color="#64748B" />
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#0F172A', margin: 0 }}>Edit Task</h2>
                <div style={{ width: 40 }} />
            </header>

            <div style={{ padding: '24px 0 100px 0', flex: 1 }}>
                <PageContainer size="md">
                
                <div className="hw-step-indicator">
                    <div className="hw-progress-track">
                        <div className="hw-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>
                    <div className="hw-step-labels">
                        <span className={`hw-step-label ${step >= 1 ? 'hw-step-label--active' : ''}`}>TASK</span>
                        <span className={`hw-step-label ${step >= 2 ? 'hw-step-label--active' : ''}`}>DETAILS</span>
                        <span className={`hw-step-label ${step >= 3 ? 'hw-step-label--active' : ''}`}>SCHEDULE</span>
                        <span className={`hw-step-label ${step >= 4 ? 'hw-step-label--active' : ''}`}>BUDGET</span>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: '0 16px', marginBottom: '20px' }}>
                        <Card style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px' }}>
                            <div className="hw-flex hw-gap-8 hw-items-center">
                                <FiAlertCircle /> {error}
                            </div>
                        </Card>
                    </div>
                )}

                <div style={{ padding: '0 16px' }}>
                    {step === 1 && (
                        <div className="hw-fade-in">
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Update your task</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Modify the core details of your request.</p>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">TASK TITLE</label>
                                <input 
                                    className="hw-floating-input"
                                    name="title"
                                    placeholder="e.g., Clean 2BHK apartment"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">TASK CATEGORY</label>
                                <div className="hw-chip-group">
                                    {CATEGORIES.map(cat => (
                                        <div 
                                            key={cat.id} 
                                            className={`hw-chip ${formData.category === cat.id ? 'hw-chip--active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                        >
                                            {cat.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">TASK DESCRIPTION</label>
                                <textarea 
                                    className="hw-floating-input"
                                    name="description"
                                    rows={5}
                                    placeholder="What needs to be done?"
                                    value={formData.description}
                                    onChange={handleChange}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">PHOTOS</label>
                                <label htmlFor="reference-image" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 500, color: '#1E293B', cursor: 'pointer' }}>
                                    <FiPlus /> {imagePreviewUrl ? 'Change Photo' : 'Upload Photo'}
                                    <input 
                                        type="file" 
                                        id="reference-image" 
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImagePreviewUrl(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </label>

                                {imagePreviewUrl && (
                                    <div style={{ marginTop: '16px', position: 'relative', display: 'inline-block' }}>
                                        <img src={imagePreviewUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '16px', border: '2px solid #E2E8F0' }} />
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setImagePreviewUrl(null);
                                                setFormData(prev => ({ ...prev, reference_image_url: null }));
                                                if(document.getElementById('reference-image')) document.getElementById('reference-image').value = '';
                                            }}
                                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="hw-fade-in">
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Location & Urgency</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Where and how fast do you need this?</p>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">LOCATION TYPE</label>
                                <div className="hw-chip-group">
                                    <div className={`hw-chip ${formData.location_type === 'onsite' ? 'hw-chip--active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, location_type: 'onsite' }))}>On-Site</div>
                                    <div className={`hw-chip ${formData.location_type === 'remote' ? 'hw-chip--active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, location_type: 'remote' }))}>Remote</div>
                                </div>
                            </div>

                            {formData.location_type === 'onsite' && (
                                <div className="hw-grid-2 hw-gap-16 hw-mb-32">
                                    <div>
                                        <label className="hw-floating-label">CITY</label>
                                        <input className="hw-floating-input" name="city" placeholder="e.g. Hyderabad" value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="hw-floating-label">AREA / SUBCITY</label>
                                        <input className="hw-floating-input" name="subcity" placeholder="e.g. Jubilee Hills" value={formData.subcity} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">TASK URGENCY</label>
                                <div className="hw-chip-group">
                                    <div className={`hw-chip ${formData.urgency === 'immediate' ? 'hw-chip--active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, urgency: 'immediate' }))}>Urgent</div>
                                    <div className={`hw-chip ${formData.urgency === 'flexible' ? 'hw-chip--active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, urgency: 'flexible' }))}>Flexible</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="hw-fade-in">
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Schedule</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>When should it happen?</p>

                            <div className="hw-grid-2 hw-mb-32">
                                <div>
                                    <label className="hw-floating-label">START DATE</label>
                                    <input type="date" className="hw-floating-input" name="start_date" value={formData.start_date} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="hw-floating-label">START TIME</label>
                                    <input type="time" className="hw-floating-input" name="start_time" value={formData.start_time} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">ESTIMATED DURATION (MINUTES)</label>
                                <input type="number" className="hw-floating-input" name="estimated_minutes" value={formData.estimated_minutes} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="hw-fade-in">
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Budget & Preview</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Review and update the final details.</p>

                            <div className="hw-price-grid hw-mb-32">
                                {BUDGET_SUGGESTIONS.map(s => (
                                    <div 
                                        key={s.id} 
                                        className={`hw-price-card ${formData.budget_max === s.amount.toString() ? 'hw-price-card--active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, budget_max: s.amount.toString() }))}
                                    >
                                        <div className="hw-price-value">₹{s.amount}</div>
                                        <div className="hw-price-desc">{s.label}</div>
                                    </div>
                                ))}
                                <label className={`hw-price-card ${!BUDGET_SUGGESTIONS.some(s => s.amount.toString() === formData.budget_max) ? 'hw-price-card--active' : ''}`} style={{ display: 'flex', flexDirection: 'column', cursor: 'text' }}>
                                    <div className="hw-price-value" style={{ fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '18px', marginRight: '4px' }}>₹</span>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            style={{ background: 'none', border: 'none', width: '80px', fontWeight: 500, color: 'inherit', outline: 'none', textAlign: 'center' }}
                                            value={formData.budget_max}
                                            onChange={(e) => setFormData(prev => ({ ...prev, budget_max: e.target.value }))}
                                        />
                                    </div>
                                    <div className="hw-price-desc">{BUDGET_SUGGESTIONS.some(s => s.amount.toString() === formData.budget_max) ? 'OTHER' : 'CUSTOM'}</div>
                                </label>
                            </div>

                            <div className="hw-mb-32">
                                <div className="hw-switch-wrapper">
                                    <div>
                                        <p style={{ fontWeight: 500, fontSize: '14px', color: '#0F172A' }}>Verified workers only</p>
                                        <p style={{ fontSize: '11px', color: '#64748B' }}>Higher quality matches</p>
                                    </div>
                                    <label className="hw-switch">
                                        <input type="checkbox" name="verified_only" checked={formData.verified_only} onChange={handleChange} />
                                        <span className="hw-switch-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <TaskCard 
                                topTitleLabel="PREVIEW"
                                title={formData.title}
                                thumbnailUrl={imagePreviewUrl}
                                thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
                                metrics={[
                                    { label: 'BUDGET', value: `₹${formData.budget_max}`, valueColor: '#1C4DFF' },
                                    { label: 'SCHEDULE', value: `${formData.start_date}, ${formData.start_time}` }
                                ]}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '40px' }}>
                        <button 
                            onClick={step === 1 ? () => router.back() : prevStep}
                            style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <FiArrowLeft size={24} color="#64748B" />
                        </button>

                        <Button 
                            variant="primary" 
                            onClick={step === 4 ? handleSubmit : nextStep}
                            disabled={!isStepValid()}
                            style={{ flex: 1, height: '60px', borderRadius: '30px', fontSize: '18px', fontWeight: 500 }}
                        >
                            {step === 4 ? "Update Task" : "Next"}
                        </Button>
                    </div>

                </div>
            </PageContainer>
            </div>
        </div>
    );
}

export default function EditJobPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <EditJobContent />
        </Suspense>
    );
}
