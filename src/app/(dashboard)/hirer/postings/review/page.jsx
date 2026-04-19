'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiMapPin, FiCalendar, FiCheck, FiBriefcase, FiMessageCircle } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import SectionHeader from "@/Components/common/SectionHeader";
import { useToast } from '@/context/ToastContext';
import '@/css/hirer.css';

/* helper: full name from profile */
function fullName(p) {
    if (!p) return 'Unknown';
    return [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || 'Unknown';
}

/* helper: initials */
function initials(p) {
    if (!p) return '?';
    const f = p.first_name?.[0] || '';
    const l = p.last_name?.[0] || '';
    return (f + l).toUpperCase() || '?';
}

/* helper: time ago */
function timeAgo(dateStr) {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

function ReviewApplicantsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useToast();
    const jobId = searchParams.get('id');

    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = useCallback(async () => {
        if (!jobId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch Job details
            const { data: jobData } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();
            setJob(jobData);

            // Fetch Applicants (profiles + application details)
            const { data: appsData, error: appsErr } = await supabase
                .from('applications')
                .select(`
                    *,
                    worker:profiles!applications_worker_id_fkey(*)
                `)
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (appsErr) throw appsErr;

            // Fetch any existing contracts for these applicants on this job
            const { data: contractsData } = await supabase
                .from('contracts')
                .select('id, worker_id, status')
                .eq('job_id', jobId);
            
            const processedApps = (appsData || []).map(app => ({
                ...app,
                contract: contractsData?.find(c => c.worker_id === app.worker_id && c.status === 'active')
            }));

            setApplicants(processedApps);
        } catch (err) {
            console.error('Error fetching applicants:', err);
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (appId, status) => {
        setActionLoading(appId);
        try {
            const app = applicants.find(a => a.id === appId);
            if (!app) return;

            if (app.status !== status) {
                const { error: updateErr } = await supabase
                    .from('applications')
                    .update({ status })
                    .eq('id', appId);
                if (updateErr) throw updateErr;
            }

            if (status === 'accepted') {
                // Check if ANY contract already exists for this job (Rule: only one active contract)
                const { data: anyExistingContract } = await supabase
                    .from('contracts')
                    .select('id, worker_id')
                    .eq('job_id', app.job_id)
                    .neq('status', 'cancelled')
                    .maybeSingle();
                
                if (anyExistingContract) {
                    if (anyExistingContract.worker_id === app.worker_id) {
                        // If it's the SAME person, just let the state update
                    } else {
                        showToast("This job already has an active contract with someone else.", "error");
                        return;
                    }
                }

                const { data: workerSpecificContract } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('job_id', app.job_id)
                    .eq('worker_id', app.worker_id)
                    .maybeSingle();
                
                if (workerSpecificContract) {
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', app.job_id);
                    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status, contract: existingContract } : a));
                } else {
                    const { data: newContract, error: contractErr } = await supabase.from('contracts').insert([{
                        job_id: app.job_id,
                        hirer_id: currentUser?.id,
                        worker_id: app.worker_id,
                        agreed_amount: app.bid_amount || job?.budget_max,
                        status: 'active',
                        progress_percentage: 0
                    }]).select().single();

                    if (contractErr) throw contractErr;
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', app.job_id);
                    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status, contract: newContract } : a));
                }
            } else {
                setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
            }
        } catch (err) {
            showToast(`Failed to ${status} application: ${err.message || 'Unknown error'}`, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const openChat = (app) => {
        if (app.contract) {
            router.push(`/messages?contract=${app.contract.id}`);
        }
    };

    if (!jobId) return <div className="loading-state">No Job ID provided.</div>;
    if (loading) return <HashLoader text="" />;
    if (!job) return <div className="loading-state">Job not found.</div>;

    return (
        <div className="hirer-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
            <SectionHeader title="Review Applicants" />

            <PageContainer>
                <div style={{ padding: '24px 20px' }}>
                    <div className="mp-job-card" style={{ marginBottom: 32 }}>
                        <div className="mp-job-top">
                            <div>
                                <h3 className="mp-job-title" style={{ fontSize: '24px' }}>{job.title}</h3>
                                <div className="mp-job-badges">
                                    <span className={`hd-status-badge ${job.status}`}>{job.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mp-job-loc-date" style={{ marginBottom: 0 }}>
                            <span className="mp-icon-text"><FiMapPin /> {job.city || (job.location_type === 'remote' ? 'Remote' : 'Various')}</span>
                            <span className="mp-icon-text"><FiBriefcase /> {job.role_type || 'Gig'}</span>
                            <span className="mp-icon-text"><FiCalendar /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <h2 className="hd-section-title" style={{ marginBottom: 20 }}>
                        Applicants ({applicants.length})
                    </h2>

                    <div className="list-container">
                        {applicants.length === 0 ? (
                            <div className="hd-empty">No applications yet for this job.</div>
                        ) : (
                            <div className="hd-jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {applicants.map(app => {
                                    const p = app.worker;
                                    return (
                                        <div key={app.id} className="hd-job-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div className="hd-app-avatar" style={{ flexShrink: 0, width: '48px', height: '48px' }}>
                                                    {p?.avatar_url ? <img src={p.avatar_url} alt={fullName(p)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(p)}
                                                </div>
                                                <div className="hd-app-info">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <h4 className="hd-app-name" style={{ fontSize: '16px' }}>{fullName(p)}</h4>
                                                            <button
                                                                onClick={() => router.push(`/hirer/applications/review?id=${app.id}`)}
                                                                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                                                            >
                                                                Review Application
                                                            </button>
                                                    </div>
                                                    <p className="hd-app-sub">Applied {timeAgo(app.created_at)}</p>
                                                </div>
                                                <span className={`hd-status-badge ${app.status}`} style={{ marginLeft: 'auto' }}>{app.status}</span>
                                            </div>

                                            {app.cover_letter && (
                                                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569', fontStyle: 'italic' }}>
                                                    "{app.cover_letter}"
                                                </div>
                                            )}

                                            <div className="hd-job-card-actions" style={{ marginTop: 'auto' }}>
                                                {app.status === 'accepted' ? (
                                                    app.contract ? (
                                                        <button 
                                                            className="hd-app-action-btn chat"
                                                            onClick={() => openChat(app)}
                                                            style={{ 
                                                                background: '#2563eb', 
                                                                borderColor: '#2563eb', 
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <FiMessageCircle size={14} /> Tap to chat with {app.worker?.first_name}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="hd-app-action-btn chat"
                                                            onClick={() => handleAction(app.id, 'accepted')}
                                                            disabled={actionLoading === app.id}
                                                            style={{ 
                                                                background: '#10b981', 
                                                                borderColor: '#10b981', 
                                                                color: '#fff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <FiCheck size={14} /> {actionLoading === app.id ? <HashLoader text="" /> : 'Complete Setup'}
                                                        </button>
                                                    )
                                                ) : app.status === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            className="hd-app-action-btn"
                                                            onClick={() => handleAction(app.id, 'rejected')}
                                                            disabled={actionLoading === app.id}
                                                            style={{ color: '#ef4444' }}
                                                        >
                                                            Reject
                                                        </button>
                                                        <button 
                                                            className="hd-app-action-btn review"
                                                            onClick={() => handleAction(app.id, 'accepted')}
                                                            disabled={actionLoading === app.id}
                                                        >
                                                            Accept
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Rejected</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}

export default function ReviewApplicants() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <ReviewApplicantsContent />
        </Suspense>
    );
}
