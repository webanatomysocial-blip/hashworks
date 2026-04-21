"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    FiMapPin, FiClock, 
    FiShield, FiTarget, FiChevronRight, FiZap, 
    FiCheckCircle, FiChevronDown
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { Button } from '@/Components/ui/Button';
import { useToast } from '@/context/ToastContext';
import HashLoader from '@/Components/common/HashLoader';
import SectionHeader from '@/Components/common/SectionHeader';
import { PageContainer } from '@/Components/layouts/PageContainer';
import { calculateDistance } from '@/lib/location';

function JobDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const { showToast } = useToast();
    const [showDescription, setShowDescription] = useState(true);
    const [workerLoc, setWorkerLoc] = useState(null);
    const [hirerTaskCount, setHirerTaskCount] = useState(0);
    const [showCancelPolicy, setShowCancelPolicy] = useState(false);
    const [showSupport, setShowSupport] = useState(false);



    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setWorkerLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                (err) => console.log("Location access denied")
            );
        }

        async function fetchJobDetails() {
            if (!jobId) return;
            setLoading(true);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);

                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*, profiles!jobs_hirer_id_fkey(id, first_name, last_name, avatar_url, average_rating, total_jobs_completed)')
                    .eq('id', jobId)
                    .single();

                if (jobData) {
                    setJob(jobData);
                    const hirerId = jobData.hirer_id;
                    if (hirerId) {
                        const { count, error: countError } = await supabase
                            .from('jobs')
                            .select('*', { count: 'exact', head: true })
                            .eq('hirer_id', hirerId);
                        if (!countError) setHirerTaskCount(count || 0);
                    }
                }

                if (user) {
                    const { data: appData } = await supabase
                        .from('applications')
                        .select('id')
                        .eq('job_id', jobId)
                        .eq('worker_id', user.id)
                        .maybeSingle();
                    if (appData) setHasApplied(true);
                }
            } catch (error) {
                console.error('Error fetching job details:', error);
                showToast('Failed to load job details.', 'error');
            } finally {
                setLoading(false);
            }
        }
        fetchJobDetails();
    }, [jobId]);

    const handleApply = async () => {
        setApplying(true);
        try {
            if (!currentUser) { showToast("Please log in to apply", 'error'); return; }
            if (job.hirer_id === currentUser.id) {
                showToast("You cannot apply to your own job.", 'error');
                return;
            }

            const { error: applyError } = await supabase.from('applications').insert([{
                job_id: job.id, worker_id: currentUser.id, status: 'pending'
            }]);

            if (applyError) {
                showToast('Failed to apply: ' + applyError.message, 'error');
            } else {
                setHasApplied(true);
                showToast('Application submitted successfully!', 'success');
            }
        } catch (err) { showToast('An error occurred while applying.', 'error'); }
        finally { setApplying(false); }
    };

    const distance = useMemo(() => {
        if (!job || !workerLoc) return null;
        return calculateDistance(workerLoc.lat, workerLoc.lon, job.latitude, job.longitude);
    }, [job, workerLoc]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><HashLoader text="" /></div>;
    if (!job) return <div className="wh-dashboard" style={{ textAlign: 'center', padding: '100px 24px' }}><h3>Task not found</h3><Button onClick={() => router.back()}>Go Back</Button></div>;

    const hirer = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
    const ratingDisplay = (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FiStar size={14} fill={hirer?.average_rating ? "#F59E0B" : "none"} color={hirer?.average_rating ? "#F59E0B" : "#94A3B8"} />
            <span>{hirer?.average_rating ? hirer.average_rating.toFixed(1) : 'N/A'}</span>
        </div>
    );
    
    const effectivePayout = (job.budget_max && job.estimated_minutes) 
        ? Math.round(job.budget_max / (job.estimated_minutes / 60)) 
        : 360;

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
            <SectionHeader title="Task Details" showShare={true} />
            
            <PageContainer>
                <div style={{ padding: '24px 20px', paddingBottom: '100px' }}>

                    <div className="wh-detail-main-layout">
                        <div className="wh-detail-primary-col">
                            <div className="wh-payout-card">
                                <div className="wh-payout-header">
                                    <span className="wh-payout-category">{job.category || 'GENERAL'}</span>
                                    <div className="wh-payout-info">
                                        <span className="wh-payout-price">₹{job.budget_max || job.budget_min || '---'}</span>
                                        <span className="wh-payout-sub">₹{effectivePayout}/HR EFFECTIVE</span>
                                    </div>
                                </div>

                                <h2 className="wh-job-title">{job.title}</h2>

                                <div className="wh-detail-badges-row">
                                    {job.urgency === 'immediate' ? (
                                        <div className="wh-badge-new urgent">
                                            <FiZap size={14} /> Urgent
                                        </div>
                                    ) : (
                                        <div className="wh-badge-new active">
                                            Flexible
                                        </div>
                                    )}
                                </div>

                                <hr className="wh-divider" />

                                <div className="wh-job-meta-row">
                                    <div className="wh-meta-item">
                                        <FiMapPin size={18} />
                                        <span>{distance ? `${distance} km distance` : `${job.city || 'Loading location...'}`}</span>
                                    </div>
                                    <div className="wh-meta-item">
                                        <FiClock size={18} />
                                        <span>Estimated {job.estimated_minutes || '??'} mins</span>
                                    </div>
                                </div>
                            </div>

                            {job.reference_image_url && (
                                <div className="wh-image-section">
                                    <div className="wh-image-container">
                                        <img src={job.reference_image_url} alt="Task illustration" />
                                        <div className="wh-safe-work-badge">
                                            <FiCheckCircle size={14} />
                                            <span>SAFE WORK</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="wh-description-section">
                                <button className="wh-section-toggle" onClick={() => setShowDescription(!showDescription)}>
                                    <h3>Task Description</h3>
                                    <FiChevronDown size={24} style={{ transform: showDescription ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                </button>
                                {showDescription && (
                                    <p className="wh-description-text">{job.description || "No description provided."}</p>
                                )}
                            </div>

                            <div className="wh-info-grid">
                                <div className="wh-info-item">
                                    <span className="wh-info-label">SCHEDULE</span>
                                    <div className="wh-info-value">
                                        {job.start_date ? new Date(job.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}, {job.start_time?.slice(0, 5) || 'ASAP'}
                                    </div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">DURATION</span>
                                    <div className="wh-info-value">~{job.estimated_minutes || '??'} mins</div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">WORK TYPE</span>
                                    <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.role_type || 'Task'}</div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">PAYMENT TYPE</span>
                                    <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.payout_type || 'Fixed'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="wh-detail-sidebar">
                            <div className="wh-hirer-section">
                                <div className="wh-hirer-details">
                                    <div className="wh-hirer-avatar-container">
                                        {hirer?.avatar_url ? (
                                            <img src={hirer.avatar_url} alt={hirer.first_name} />
                                        ) : (
                                            <div className="wh-avatar-placeholder">
                                                {hirer?.first_name?.[0] || 'H'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="wh-hirer-text">
                                        <h4>{hirer?.first_name || 'Hirer'} {hirer?.last_name?.[0] ? `${hirer.last_name[0]}.` : ''} <span style={{ color: 'var(--color-primary)', marginLeft: '4px', verticalAlign: 'middle' }}>{ratingDisplay}</span></h4>
                                        <p>{hirerTaskCount || '0'} Tasks Posted</p>
                                    </div>
                                </div>
                                <button className="wh-view-profile-btn" onClick={() => router.push(`/profile/view?id=${hirer?.id}`)}>
                                    View Profile
                                </button>
                            </div>

                            <div className="wh-trust-banner">
                                <div className="wh-trust-icon"><FiShield size={24} /></div>
                                <div className="wh-trust-content">
                                    <h4>Trust & Safety</h4>
                                    <p>Payment secured via Hashworks. Released only after task completion.</p>
                                </div>
                            </div>

                            <div className="wh-action-list">
                                <div className="wh-action-item-wrap">
                                    <div className="wh-action-item" onClick={() => setShowCancelPolicy(!showCancelPolicy)}>
                                        <span>Cancellation Policy</span>
                                        <FiChevronDown size={20} style={{ transform: showCancelPolicy ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                    </div>
                                    {showCancelPolicy && (
                                        <div className="wh-action-expanded">
                                            <p>Full refund if cancelled at least 24 hours before the scheduled start time. For last-minute cancellations, a partial fee may apply to compensate the worker's time.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="wh-action-item-wrap">
                                    <div className="wh-action-item" onClick={() => setShowSupport(!showSupport)}>
                                        <span>Support & Help</span>
                                        <FiChevronDown size={20} style={{ transform: showSupport ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                    </div>
                                    {showSupport && (
                                        <div className="wh-action-expanded">
                                            <p>Need help? Our 24/7 support team is here. You can reach us via the chat support in the main menu or email us at support@hashworks.in for urgent resolution.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>

            {/* Mobile/Sticky Apply Button Footer */}
            <div className="wh-mobile-sticky-footer">
                <button 
                    className={`wh-action-main-btn ${hasApplied || applying || job?.hirer_id === currentUser?.id ? 'disabled' : ''}`}
                    onClick={handleApply}
                    disabled={hasApplied || applying || job?.hirer_id === currentUser?.id}
                >
                    <span className="wh-btn-text">
                        {applying ? "INTEREST RECORDED..." : hasApplied ? "APPLICATION SENT" : (job?.hirer_id === currentUser?.id ? "MY POSTING" : "I'm Interested")}
                    </span>
                    {!hasApplied && !applying && <div className="wh-btn-icon-box"><FiTarget size={20} /></div>}
                </button>
            </div>
        </div>
    );
}

export default function JobDetailsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="Opening task..." /></div>}>
            <JobDetailsContent />
        </Suspense>
    );
}
