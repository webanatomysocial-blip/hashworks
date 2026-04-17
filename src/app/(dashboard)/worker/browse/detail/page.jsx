"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    FiChevronLeft, FiShare2, FiMapPin, FiClock, 
    FiShield, FiTarget, FiChevronRight, FiZap, 
    FiUser, FiCheckCircle, FiChevronDown
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { formatLocationShort } from '@/lib/location';
import { Button } from '@/Components/ui/Button';
import { Badge } from '@/Components/ui/Badge';
import HashLoader from '@/Components/common/HashLoader';

import { calculateDistance } from '@/lib/location';

function JobDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDescription, setShowDescription] = useState(true);
    const [workerLoc, setWorkerLoc] = useState(null);
    const [hirerTaskCount, setHirerTaskCount] = useState(0);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        // Get worker location
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

                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*, profiles!jobs_hirer_id_fkey(id, first_name, last_name, avatar_url, average_rating, total_jobs_completed)')
                    .eq('id', jobId)
                    .single();

                if (jobData) {
                    setJob(jobData);
                    
                    // Fetch real count of tasks posted by this hirer
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { showToast("Please log in to apply", 'error'); return; }

            const { error: applyError } = await supabase.from('applications').insert([{
                job_id: job.id, worker_id: user.id, status: 'pending'
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

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: job.title,
                    text: `Check out this job: ${job.title}`,
                    url: window.location.href,
                });
            } catch (err) { console.error('Share failed:', err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!');
        }
    };

    const distance = useMemo(() => {
        if (!job || !workerLoc) return null;
        return calculateDistance(workerLoc.lat, workerLoc.lon, job.latitude, job.longitude);
    }, [job, workerLoc]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><HashLoader text="" /></div>;
    if (!job) return <div className="wh-dashboard" style={{ textAlign: 'center', padding: '100px 24px' }}><h3>Task not found</h3><Button onClick={() => router.back()}>Go Back</Button></div>;

    const hirer = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
    const ratingDisplay = hirer?.average_rating ? `★${hirer.average_rating.toFixed(1)}` : "New Poster";
    
    // Calculate Payout Rate: ₹120 budget / (20 mins / 60) = ₹360/hr
    const effectivePayout = (job.budget_max && job.estimated_minutes) 
        ? Math.round(job.budget_max / (job.estimated_minutes / 60)) 
        : 360;

    return (
        <>
            <nav className="wh-detail-header">
                <button onClick={() => router.back()} className="wh-nav-icon-btn">
                    <FiChevronLeft size={24} />
                </button>
                <h1 className="wh-header-title">Task Details</h1>
                <button onClick={handleShare} className="wh-nav-icon-btn">
                    <FiShare2 size={24} />
                </button>
            </nav>
        <div className="wh-detail-page-wrapper">
            {toast && (
                <div className="wh-detail-toast" style={{ backgroundColor: toast.type === 'error' ? '#ef4444' : '#4f74ff' }}>
                    {toast.message}
                </div>
            )}

            {/* Header: Replaces Main Dashboard Header */}

            <div className="wh-detail-scroll-content">
                <div className="wh-detail-main-layout">
                    {/* Left/Main Column */}
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
                                {job.urgency === 'immediate' && (
                                    <div className="wh-badge-new urgent">
                                        <FiZap size={14} /> Urgent
                                    </div>
                                )}
                                <div className="wh-badge-new transparent" style={{ textTransform: 'capitalize' }}>
                                    {job.work_environment || 'Indoor'}
                                </div>
                                <div className="wh-badge-new transparent">
                                    {job.is_one_time ? 'One-time' : 'Recurring'}
                                </div>
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
                                <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.role_type || (job.is_one_time ? 'One-time' : 'Recurring')}</div>
                            </div>
                            <div className="wh-info-item">
                                <span className="wh-info-label">PAYMENT TYPE</span>
                                <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.payout_type || 'Fixed'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right/Side Column (Desktop Only Sidebar feel) */}
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
                                    <h4>{hirer?.first_name || 'Hirer'} {hirer?.last_name?.[0] ? `${hirer.last_name[0]}.` : ''} <span style={{ color: 'var(--color-primary)', marginLeft: '4px' }}>{ratingDisplay}</span></h4>
                                    <p>{hirerTaskCount || '0'} Tasks Posted</p>
                                </div>
                            </div>
                            <button className="wh-view-profile-btn" onClick={() => router.push(`/worker/profile/view?id=${hirer?.id}`)}>
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
                            <div className="wh-action-item"><span>Cancellation Policy</span><FiChevronRight size={20} /></div>
                            <div className="wh-action-item"><span>Support & Help</span><FiChevronRight size={20} /></div>
                        </div>
                        
                        {/* Desktop Apply Button Box */}
                        <div className="wh-desktop-apply-box">
                             <button 
                                className={`wh-action-main-btn ${hasApplied || applying ? 'disabled' : ''}`}
                                onClick={handleApply}
                                disabled={hasApplied || applying}
                            >
                                <span className="wh-btn-text">
                                    {applying ? "INTEREST RECORDED..." : hasApplied ? "APPLICATION SENT" : "I'm Interested"}
                                </span>
                                {!hasApplied && !applying && <div className="wh-btn-icon-box"><FiTarget size={20} /></div>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer Button */}
            <div className="wh-mobile-sticky-footer">
                <button 
                    className={`wh-action-main-btn ${hasApplied || applying ? 'disabled' : ''}`}
                    onClick={handleApply}
                    disabled={hasApplied || applying}
                >
                    <span className="wh-btn-text">
                        {applying ? "INTEREST RECORDED..." : hasApplied ? "APPLICATION SENT" : "I'm Interested"}
                    </span>
                    {!hasApplied && !applying && <div className="wh-btn-icon-box"><FiTarget size={20} /></div>}
                </button>
            </div>

        </div>
        </>

    );
}

export default function JobDetailsPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="Opening task..." /></div>}>
            <JobDetailsContent />
        </Suspense>
    );
}
