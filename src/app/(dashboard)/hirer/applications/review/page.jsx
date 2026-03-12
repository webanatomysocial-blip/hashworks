'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiMapPin, FiCalendar, FiCheck, FiX, FiBriefcase, FiMessageCircle, FiUser, FiMail, FiGlobe } from 'react-icons/fi';
import ChatModal from '@/Components/ChatModal';
import Link from 'next/link';
import '@/css/hirer.css';
import '@/css/profile.css';

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

function ApplicationReviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const appId = searchParams.get('id');

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Chat State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, contractId: null, otherUserName: '' });

    const fetchData = useCallback(async () => {
        if (!appId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch Application details (with worker profile and job)
            const { data: appData, error: appErr } = await supabase
                .from('applications')
                .select(`
                    *,
                    worker:profiles!applications_worker_id_fkey(*),
                    job:jobs(*)
                `)
                .eq('id', appId)
                .single();
            
            if (appErr) throw appErr;

            // Fetch contract if accepted
            if (appData.status === 'accepted') {
                const { data: contractData } = await supabase
                    .from('contracts')
                    .select('id')
                    .eq('job_id', appData.job_id)
                    .eq('worker_id', appData.worker_id)
                    .eq('status', 'active')
                    .maybeSingle();
                
                appData.contract = contractData;
            }

            setApplication(appData);
        } catch (err) {
            console.error('Error fetching application:', err);
        } finally {
            setLoading(false);
        }
    }, [appId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (status) => {
        setActionLoading(true);
        try {
            console.log('Handling action:', status, 'for application:', appId);
            
            // Only update application status if it's not already in that status
            if (application.status !== status) {
                const { error: updateErr } = await supabase
                    .from('applications')
                    .update({ status })
                    .eq('id', appId);
                if (updateErr) throw updateErr;
            }

            if (status === 'accepted') {
                // Check if contract already exists
                const { data: existingContract, error: checkErr } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('job_id', application.job_id)
                    .eq('worker_id', application.worker_id)
                    .maybeSingle();
                
                if (checkErr) {
                    console.error('Error checking existing contract:', checkErr);
                }

                if (existingContract) {
                    console.log('Existing contract found:', existingContract.id);
                    // Also ensure job status is updated
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', application.job_id);
                    setApplication(prev => ({ ...prev, status, contract: existingContract }));
                } else {
                    console.log('Creating new contract...');
                    const { data: newContract, error: contractErr } = await supabase.from('contracts').insert([{
                        job_id: application.job_id,
                        hirer_id: currentUser?.id,
                        worker_id: application.worker_id,
                        agreed_amount: application.bid_amount || application.job?.budget_max,
                        status: 'active',
                        progress_percentage: 0
                    }]).select().single();

                    if (contractErr) throw contractErr;

                    // Update job status to in_progress
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', application.job_id);

                    console.log('New contract created:', newContract.id);
                    setApplication(prev => ({ ...prev, status, contract: newContract }));
                    alert('Contract created successfully!');
                }
            } else {
                setApplication(prev => ({ ...prev, status }));
            }

        } catch (err) {
            console.error('Error handling application:', err);
            alert(`Failed to ${status} application: ${err.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const openChat = () => {
        if (application.contract) {
            setChatConfig({
                isOpen: true,
                contractId: application.contract.id,
                otherUserName: fullName(application.worker)
            });
        }
    };

    if (!appId) return <div className="loading-state">No Application ID provided.</div>;
    if (loading) return <div className="loading-state">Loading application details...</div>;
    if (!application) return <div className="loading-state">Application not found.</div>;

    const p = application.worker;
    const job = application.job;

    return (
        <div className="hirer-dashboard">
            <header className="fp-header">
                <button className="fp-back-btn" onClick={() => router.back()}>
                    <FiArrowLeft />
                </button>
                <h1 className="fp-title">Review Application</h1>
            </header>

            <div className="profile-grid">
                <div className="profile-col-main">
                    {/* Applicant Info Card */}
                    <div className="profile-card">
                        <div className="card-body" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                            <div className="hd-app-avatar" style={{ width: '100px', height: '100px', fontSize: '32px' }}>
                                {p?.avatar_url ? <img src={p.avatar_url} alt={fullName(p)} /> : initials(p)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '800' }}>{fullName(p)}</h2>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>{p.headline || 'Professional Worker'}</p>
                                    </div>
                                    <span className={`hd-status-badge ${application.status}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                        {application.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#475569' }}>
                                        <FiMapPin /> {p.country || 'Global'}
                                    </span>
                                    {p.website && (
                                        <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#2563eb', textDecoration: 'none' }}>
                                            <FiGlobe /> Portfolio
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cover Letter Card */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Cover Letter</h2>
                        </div>
                        <div className="card-body">
                            <p style={{ lineHeight: '1.7', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {application.cover_letter || "The applicant didn't provide a cover letter."}
                            </p>
                        </div>
                    </div>

                    {/* Worker Bio / Skills (Simplified from profile view) */}
                    {p.bio && (
                        <div className="profile-card">
                            <div className="card-header">
                                <h2>About {p.first_name}</h2>
                            </div>
                            <div className="card-body">
                                <p style={{ lineHeight: '1.7', color: '#334155' }}>{p.bio}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-col-side">
                    {/* Action Card */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Decision</h2>
                        </div>
                        <div className="card-body">
                            {application.status === 'pending' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        className="hd-job-action-btn review"
                                        onClick={() => handleAction('accepted')}
                                        disabled={actionLoading}
                                        style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                                    >
                                        {actionLoading ? 'Processing...' : <><FiCheck size={18} /> Accept Application</>}
                                    </button>
                                    <button
                                        className="hd-job-action-btn"
                                        onClick={() => handleAction('rejected')}
                                        disabled={actionLoading}
                                        style={{ width: '100%', padding: '14px', fontSize: '15px', color: '#ef4444' }}
                                    >
                                        {actionLoading ? 'Processing...' : <><FiX size={18} /> Reject</>}
                                    </button>
                                </div>
                            ) : application.status === 'accepted' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {application.contract ? (
                                        <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbfcce', borderRadius: '12px', color: '#166534', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
                                            Application Accepted
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', color: '#b45309', fontSize: '14px', textAlign: 'center', marginBottom: '8px' }}>
                                            Application Accepted, but contract not yet created.
                                        </div>
                                    )}
                                    {application.contract ? (
                                        <button
                                            className="hd-job-action-btn review"
                                            onClick={openChat}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                fontSize: '15px', 
                                                background: '#2563eb', 
                                                borderColor: '#2563eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <FiMessageCircle size={18} /> Tap to chat with {p.first_name}
                                        </button>
                                    ) : (
                                        <button
                                            className="hd-job-action-btn review"
                                            onClick={() => handleAction('accepted')}
                                            disabled={actionLoading}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                fontSize: '15px', 
                                                background: '#10b981', 
                                                borderColor: '#10b981',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {actionLoading ? 'Creating...' : <><FiCheck size={18} /> Complete Contract Setup</>}
                                        </button>
                                    )}
                                </div>

                            ) : (
                                <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#991b1b', fontSize: '14px', textAlign: 'center' }}>
                                    Application Rejected
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Job Details Card */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Job Details</h2>
                        </div>
                        <div className="card-body">
                            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>{job.title}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span className="mp-icon-text"><FiMapPin /> {job.city || (job.location_type === 'remote' ? 'Remote' : 'Various')}</span>
                                <span className="mp-icon-text"><FiBriefcase /> {job.role_type || 'Gig'}</span>
                                <span className="mp-icon-text"><FiCalendar /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        
                        </div>
                    </div>
                </div>
            </div>

            <ChatModal
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig({ ...chatConfig, isOpen: false })}
                contractId={chatConfig.contractId}
                currentUserId={currentUser?.id}
                otherUserName={chatConfig.otherUserName}
            />
        </div>
    );
}

export default function ApplicationReviewPage() {
    return (
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <ApplicationReviewContent />
        </Suspense>
    );
}
