'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiArrowRight, FiCalendar, FiClock, FiTarget, FiZap, FiGlobe, FiMapPin, FiX, FiCheck, FiMic, FiAlertCircle, FiChevronRight, FiChevronLeft, FiPlus, FiBriefcase, FiMoreHorizontal } from 'react-icons/fi';
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

export default function CreateJobPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

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
            if (formData.location_type === 'on-site') {
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
        // ... rest of submit logic

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to post a job.');

            let uploadedImageUrl = formData.reference_image_url;
            const file = selectedFile;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('Task-Images').upload(filePath, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('Task-Images').getPublicUrl(filePath);
                uploadedImageUrl = publicUrl;
            }

            const { data: profile } = await supabase.from('profiles').select('latitude, longitude, city, subcity').eq('id', user.id).single();

            const payload = {
                title: formData.title.trim(),
                category: formData.category,
                urgency: formData.urgency,
                description: formData.description.trim(),
                budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
                location_type: formData.location_type,
                city: formData.city.trim() || profile?.city || null,
                subcity: formData.subcity.trim() || profile?.subcity || null,
                verified_only: formData.verified_only,
                start_date: formData.start_date || null,
                start_time: formData.start_time || null,
                estimated_minutes: parseInt(formData.estimated_minutes) || 60,
                payout_type: formData.payout_type,
                work_environment: formData.work_environment,
                is_one_time: formData.is_one_time,
                status: 'active',
                hirer_id: user.id,
                latitude: profile?.latitude || null,
                longitude: profile?.longitude || null,
                reference_image_url: uploadedImageUrl,
                updated_at: new Date().toISOString(),
            };

            const { data: inserted, error: insErr } = await supabase.from('jobs').insert(payload).select('id').single();
            if (insErr) throw insErr;
            
            // Update profile stats: increment total_tasks_posted
            const { data: curProf } = await supabase.from('profiles').select('total_tasks_posted').eq('id', user.id).single();
            await supabase.from('profiles').update({ total_tasks_posted: (curProf?.total_tasks_posted || 0) + 1 }).eq('id', user.id);

            router.push('/hirer/postings');
        } catch (err) {
            console.error('Error saving job:', err);
            setError(err.message || 'Failed to save job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
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
    );

    if (loading) return <HashLoader text="" />;

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Sticky Inner Header */}
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
                <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#0F172A', margin: 0 }}>Post a Task</h2>
                <div style={{ width: 40 }} />
            </header>

            <div style={{ padding: '24px 0 100px 0', flex: 1 }}>
                <PageContainer size="md">
                {renderStepIndicator()}

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
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>What do you need help with?</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Describe your task clearly so the right people can help.</p>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">TASK TITLE</label>
                                <input 
                                    className="hw-floating-input"
                                    name="title"
                                    placeholder="e.g., Clean 2BHK apartment"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Be specific so workers understand quickly</p>
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
                                <div style={{ position: 'relative' }}>
                                    <textarea 
                                        className="hw-floating-input"
                                        name="description"
                                        rows={5}
                                        placeholder="What needs to be done? Where? Any special instructions?"
                                        value={formData.description}
                                        onChange={handleChange}
                                        style={{ resize: 'none' }}
                                    />
                                </div>
                                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>More details = better matches</p>
                            </div>

                            <div className="hw-mb-32">
                                <label className="hw-floating-label">ADD PHOTOS</label>
                                
                                <label htmlFor="reference-image" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 500, color: '#1E293B', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <FiPlus /> Upload Reference Photo
                                    <input 
                                        type="file" 
                                        id="reference-image" 
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setSelectedFile(file);
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setImagePreviewUrl(reader.result);
                                                };
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
                                                setSelectedFile(null);
                                            }}
                                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        >
                                            <FiX size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="hw-pro-tip hw-mb-32">
                                <div className="hw-icon-circle">
                                    <FiAlertCircle size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>Pro Tip</p>
                                    <p style={{ fontSize: '12px', color: '#475569' }}>Tasks with photos get 3x more offers from top workers.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="hw-fade-in">
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>A few more details...</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Help us find the best fit for your location and urgency.</p>

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
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Set the Schedule</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>When should the task begin and how long will it take?</p>

                            <div className="hw-grid-2 hw-mb-32">
                                <div style={{ position: 'relative' }}>
                                    <label className="hw-floating-label">START DATE</label>
                                    <input 
                                        type="date" 
                                        className="hw-floating-input" 
                                        name="start_date" 
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.start_date} 
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setFormData(prev => {
                                                const updated = { ...prev, start_date: newDate };
                                                // If today, check if time is in past
                                                if (newDate === new Date().toISOString().split('T')[0]) {
                                                    const now = new Date();
                                                    const currentH = now.getHours();
                                                    const currentM = now.getMinutes();
                                                    const [h, m] = prev.start_time.split(':').map(Number);
                                                    if (h < currentH || (h === currentH && m <= currentM)) {
                                                        // Set to next hour
                                                        updated.start_time = `${String((currentH + 1) % 24).padStart(2, '0')}:00`;
                                                    }
                                                }
                                                return updated;
                                            });
                                        }} 
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <FiCalendar style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label className="hw-floating-label">START TIME</label>
                                    <input 
                                        type="time" 
                                        className="hw-floating-input" 
                                        name="start_time" 
                                        value={formData.start_time} 
                                        onChange={(e) => {
                                            const newTime = e.target.value;
                                            if (formData.start_date === new Date().toISOString().split('T')[0]) {
                                                const now = new Date();
                                                const [h, m] = newTime.split(':').map(Number);
                                                if (h < now.getHours() || (h === now.getHours() && m < now.getMinutes())) {
                                                    alert("Please select a future time for today's task.");
                                                    return;
                                                }
                                            }
                                            setFormData(prev => ({ ...prev, start_time: newTime }));
                                        }} 
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <FiClock style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
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
                            <h1 className="text-display-sm hw-mb-8" style={{ fontSize: '30px', fontWeight: 500 }}>Set Your Budget</h1>
                            <p className="text-body-md hw-mb-32" style={{ color: '#64748B' }}>Choose how much you want to pay for this task.</p>

                            <div className="hw-price-grid hw-mb-32">
                                {BUDGET_SUGGESTIONS.map(s => (
                                    <div 
                                        key={s.id} 
                                        className={`hw-price-card ${formData.budget_max === s.amount.toString() ? 'hw-price-card--active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, budget_max: s.amount.toString() }))}
                                    >
                                        {s.badge && <div className="hw-badge-promo">{s.badge}</div>}
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

                            <div className="hw-mb-24">
                                <label className="hw-floating-label">PAYMENT TYPE</label>
                                <select className="hw-floating-input" name="payout_type" value={formData.payout_type} onChange={handleChange}>
                                    <option value="fixed">Fixed Price</option>
                                    <option value="hourly">Hourly Rate</option>
                                </select>
                            </div>

                            <div className="hw-mb-32">
                                <div className="hw-switch-wrapper">
                                    <div className="hw-flex hw-gap-12 hw-items-center">
                                        <div className="hw-icon-circle" style={{ background: '#eef2ff', color: '#1C4DFF', width: '36px', height: '36px' }}>
                                            <FiCheck size={18} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, fontSize: '14px', color: '#0F172A' }}>Verified workers only</p>
                                            <p style={{ fontSize: '11px', color: '#64748B' }}>Higher quality, faster completion</p>
                                        </div>
                                    </div>
                                    <label className="hw-switch">
                                        <input 
                                            type="checkbox" 
                                            name="verified_only"
                                            checked={formData.verified_only}
                                            onChange={handleChange}
                                        />
                                        <span className="hw-switch-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <h3 style={{ fontWeight: 500, fontSize: '18px', color: '#1E293B', marginBottom: '16px' }}>Task Summary</h3>
                            <TaskCard 
                                topTitleLabel="TASK TITLE"
                                title={formData.title || 'Untitled Task'}
                                thumbnailUrl={imagePreviewUrl}
                                thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
                                badge={{ text: 'PREVIEW', bg: '#FFF', color: '#1C4DFF' }}
                                metrics={[
                                    { label: 'BUDGET', value: `₹${formData.budget_max || '0'}`, valueColor: '#1C4DFF', valueSize: '16px' },
                                    { label: 'SCHEDULE', value: `${formData.start_date ? new Date(formData.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Today'}, ${formData.start_time || '2PM'}` },
                                    { label: 'CATEGORY', value: CATEGORIES.find(c => c.id === formData.category)?.label || 'Other' }
                                ]}
                                footerMessage={{ icon: <FiCheck size={12} color="#fff" />, text: 'Payment will be held in Escrow for safety', color: '#22C55E' }}
                            />
                        </div>
                    )}
                    {/* Navigation Footer inside the page content */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '40px' }}>
                        <button 
                            onClick={step === 1 ? () => router.back() : prevStep}
                            className="hw-flex hw-items-center hw-justify-center"
                            style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                            title="Go Back"
                        >
                            <FiArrowLeft size={24} color="#64748B" />
                        </button>

                        <Button 
                            variant="primary" 
                            onClick={step === 4 ? handleSubmit : nextStep}
                            disabled={!isStepValid()}
                            className={!isStepValid() ? 'hw-btn--locked' : ''}
                            style={{ 
                                flex: 1, 
                                height: '60px', 
                                borderRadius: '30px', 
                                fontSize: '18px', 
                                fontWeight: 500, 
                                boxShadow: isStepValid() ? '0 8px 25px rgba(28, 77, 255, 0.3)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            {step === 4 ? (
                                <>Post Task <FiCheck size={22} /></>
                            ) : (
                                <>
                                    Next <FiArrowRight size={22} />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </PageContainer>
            </div>
            <div style={{ height: '40px' }} />
        </div>
    );
}
