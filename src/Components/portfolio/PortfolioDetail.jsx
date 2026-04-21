'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    FiMapPin, FiClock,
    FiShield, FiCheckCircle, FiChevronDown, FiTarget, FiStar
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from '@/Components/layouts/PageContainer';
import SectionHeader from '@/Components/common/SectionHeader';
import { Button } from '@/Components/ui/Button';
import '@/css/worker.css';

function DetailContent({ role }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [selectedWork, setSelectedWork] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDescription, setShowDescription] = useState(true);
    const [showSupport, setShowSupport] = useState(false);

    useEffect(() => {
        if (!id) {
            router.push(`/${role}/portfolio`);
            return;
        }

        async function fetchDetail() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('past_works')
                    .select(`
                        *,
                        worker:profiles!past_works_worker_id_fkey(id, first_name, last_name, avatar_url, average_rating, total_jobs_completed),
                        hirer:profiles!past_works_hirer_id_fkey(id, first_name, last_name, avatar_url, average_rating, total_jobs_completed),
                        jobs(*)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setSelectedWork(data);
            } catch (err) {
                console.error("Error fetching portfolio detail", err);
                router.push(`/${role}/portfolio`);
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();
    }, [id, role, router]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}><HashLoader text="" /></div>;
    if (!selectedWork) return <div className="wh-dashboard" style={{ textAlign: 'center', padding: '100px 24px' }}><h3>Project not found</h3><Button onClick={() => router.back()}>Go Back</Button></div>;

    const partner = role === 'worker' ? selectedWork.hirer : selectedWork.worker;
    const ratingDisplay = (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FiStar size={14} fill={partner?.average_rating ? "#F59E0B" : "none"} color={partner?.average_rating ? "#F59E0B" : "#94A3B8"} />
            <span>{partner?.average_rating ? partner.average_rating.toFixed(1) : 'N/A'}</span>
        </div>
    );
    const job = selectedWork.jobs || {};

    const effectivePayout = (job.budget_max && job.estimated_minutes)
        ? Math.round(job.budget_max / (job.estimated_minutes / 60))
        : (job.budget_max || selectedWork.payout || 0);

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '100px' }}>
            <SectionHeader title="Project Details" showShare={true} />

            <PageContainer>
                <div style={{ padding: '24px 20px', paddingBottom: '40px' }}>

                    <div className="wh-detail-main-layout">
                        <div className="wh-detail-primary-col">
                            <div className="wh-payout-card">
                                <div className="wh-payout-header">
                                    <span className="wh-payout-category">{job.category || 'GENERAL'}</span>
                                    <div className="wh-payout-info">
                                        <span className="wh-payout-price">₹{selectedWork.payout?.toLocaleString() || '---'}</span>
                                        <span className="wh-payout-sub">₹{effectivePayout}/HR EFFECTIVE</span>
                                    </div>
                                </div>

                                <h2 className="wh-job-title">{selectedWork.title || job.title || 'Untitled Project'}</h2>

                                <div className="wh-detail-badges-row">
                                    <div className="wh-badge-new active" style={{ background: '#DCFCE7', color: '#16A34A', border: '1px solid #16A34A' }}>
                                        <FiCheckCircle size={14} style={{ marginRight: '4px' }} /> Completed
                                    </div>
                                    <div className="wh-badge-new neutral" style={{ background: '#f1f5f9', color: '#64748B' }}>
                                        {new Date(selectedWork.completed_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <hr className="wh-divider" />

                                <div className="wh-job-meta-row">
                                    <div className="wh-meta-item">
                                        <FiMapPin size={18} />
                                        <span>{job.city || 'Remote'}</span>
                                    </div>
                                    <div className="wh-meta-item">
                                        <FiClock size={18} />
                                        <span>Total {job.estimated_minutes || '??'} mins</span>
                                    </div>
                                </div>
                            </div>

                            {job.reference_image_url && (
                                <div className="wh-image-section">
                                    <div className="wh-image-container">
                                        <img src={job.reference_image_url} alt="Task illustration" />
                                        <div className="wh-safe-work-badge">
                                            <FiCheckCircle size={14} />
                                            <span>COMPLETED PROJECT</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="wh-description-section">
                                <button className="wh-section-toggle" onClick={() => setShowDescription(!showDescription)}>
                                    <h3>Project Description</h3>
                                    <FiChevronDown size={24} style={{ transform: showDescription ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                </button>
                                {showDescription && (
                                    <p className="wh-description-text">{job.description || "No description provided."}</p>
                                )}
                            </div>

                            <div className="wh-info-grid">
                                <div className="wh-info-item">
                                    <span className="wh-info-label">DATE COMPLETED</span>
                                    <div className="wh-info-value">
                                        {new Date(selectedWork.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">FINAL PAYOUT</span>
                                    <div className="wh-info-value" style={{ color: 'var(--hw-success)', fontWeight: 500 }}>₹{selectedWork.payout?.toLocaleString()}</div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">WORK TYPE</span>
                                    <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.role_type || 'Task'}</div>
                                </div>
                                <div className="wh-info-item">
                                    <span className="wh-info-label">URGENCY</span>
                                    <div className="wh-info-value" style={{ textTransform: 'capitalize' }}>{job.urgency || 'Flexible'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="wh-detail-sidebar">
                            <div className="wh-hirer-section">
                                <div className="wh-hirer-details">
                                    <div className="wh-hirer-avatar-container">
                                        {partner?.avatar_url ? (
                                            <img src={partner.avatar_url} alt={partner.first_name} />
                                        ) : (
                                            <div className="wh-avatar-placeholder">
                                                {partner?.first_name?.[0] || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="wh-hirer-text">
                                        <h4>{partner?.first_name || 'Partner'} {partner?.last_name?.[0] ? `${partner.last_name[0]}.` : ''} <span style={{ color: 'var(--color-primary)', marginLeft: '4px', verticalAlign: 'middle' }}>{ratingDisplay}</span></h4>
                                        
                                    </div>
                                </div>
                                <button className="wh-view-profile-btn" onClick={() => router.push(`/profile/view?id=${partner?.id}`)}>
                                    View Profile
                                </button>
                            </div>

                            <div className="wh-trust-banner">
                                <div className="wh-trust-icon"><FiCheckCircle size={24} /></div>
                                <div className="wh-trust-content">
                                    <h4>Successfully Delivered</h4>
                                    <p>This project has been fully completed and paid out via Hashworks.</p>
                                </div>
                            </div>

                            <div className="wh-action-list">
                                <div className="wh-action-item-wrap">
                                    <div className="wh-action-item" onClick={() => setShowSupport(!showSupport)}>
                                        <span>Need help with this project?</span>
                                        <FiChevronDown size={20} style={{ transform: showSupport ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                    </div>
                                    {showSupport && (
                                        <div className="wh-action-expanded">
                                            <p>Our 24/7 support team is here to assist you with any post-completion issues. Reach us via email at support@hashworks.in.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>

            {/* Mobile/Sticky Back Button Footer */}
            <div className="wh-mobile-sticky-footer" style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <button
                    className="hw-btn hw-btn-primary"
                    onClick={() => router.push(`/${role}/portfolio`)}
                    style={{ width: '100%', height: '52px', borderRadius: '26px', fontSize: '15px' }}
                >
                    Back to Portfolio
                </button>
            </div>
        </div>
    );
}

export default function PortfolioDetail({ role }) {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="Loading project..." /></div>}>
            <DetailContent role={role} />
        </Suspense>
    );
}
