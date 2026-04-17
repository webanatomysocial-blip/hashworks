'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    FiArrowLeft, 
    FiMapPin, 
    FiCalendar, 
    FiCheck, 
    FiX, 
    FiBriefcase, 
    FiMessageCircle, 
    FiUser, 
    FiMail, 
    FiGlobe 
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import Link from 'next/link';

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";

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
            // Only update application status if it's not already in that status
            if (application.status !== status) {
                const { error: updateErr } = await supabase
                    .from('applications')
                    .update({ status })
                    .eq('id', appId);
                if (updateErr) throw updateErr;
            }

            if (status === 'accepted') {
                const { data: existingContract } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('job_id', application.job_id)
                    .eq('worker_id', application.worker_id)
                    .maybeSingle();
                
                if (existingContract) {
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', application.job_id);
                    setApplication(prev => ({ ...prev, status, contract: existingContract }));
                } else {
                    const { data: newContract, error: contractErr } = await supabase.from('contracts').insert([{
                        job_id: application.job_id,
                        hirer_id: currentUser?.id,
                        worker_id: application.worker_id,
                        agreed_amount: application.bid_amount || application.job?.budget_max,
                        status: 'active',
                        progress_percentage: 0
                    }]).select().single();

                    if (contractErr) throw contractErr;
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', application.job_id);
                    setApplication(prev => ({ ...prev, status, contract: newContract }));
                }
            } else {
                setApplication(prev => ({ ...prev, status }));
            }
        } catch (err) {
            alert(`Failed to ${status} application: ${err.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const openChat = () => {
        if (application.contract) {
            router.push(`/messages?contract=${application.contract.id}`);
        }
    };

    if (!appId) return <PageContainer size="lg"><Card padding="xl">No Application ID provided.</Card></PageContainer>;
    if (loading) return <HashLoader text="" />;
    if (!application) return <PageContainer size="lg"><Card padding="xl">Application not found.</Card></PageContainer>;

    const p = application.worker || {};
    const job = application.job || {};

    return (
        <div style={{ padding: 'var(--space-2xl) 0' }}>
            <PageContainer size="lg">
                <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <Button variant="ghost" onClick={() => router.back()} style={{ padding: '8px' }}>
                        <FiArrowLeft size={20} />
                    </Button>
                    <h1 className="text-display-xl" style={{ fontSize: '32px' }}>Review Application</h1>
                </header>

                <div className="wh-detail-main-layout">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        {/* ── Applicant ── */}
                        <Card variant="elevated" padding="xl">
                            <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '80px', height: '80px', borderRadius: 'var(--radius-pill)', 
                                    backgroundColor: 'var(--color-border-light)', overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '28px', color: 'var(--color-primary)', fontWeight: '700'
                                }}>
                                    {p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(p)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <h2 className="text-headline-lg">{fullName(p)}</h2>
                                        <Badge variant={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'urgent' : 'waiting'}>
                                            {application.status}
                                        </Badge>
                                    </div>
                                    <p className="text-body-md" style={{ color: 'var(--color-text-main)' }}>{p.headline || 'Professional Freelancer'}</p>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                        <span className="text-label-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FiMapPin /> {p.country || 'Global'}
                                        </span>
                                        {p.website && (
                                            <Button variant="ghost" size="sm" onClick={() => window.open(p.website)}>
                                                <FiGlobe /> Portfolio
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* ── Cover Letter ── */}
                        <Card variant="elevated" padding="xl">
                            <h3 className="text-headline-lg" style={{ marginBottom: 'var(--space-md)' }}>Cover Letter</h3>
                            <p className="text-body-md" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                {application.cover_letter || "The applicant didn't provide a cover letter."}
                            </p>
                        </Card>

                        {/* ── About Worker ── */}
                        {p.bio && (
                            <Card variant="elevated" padding="xl">
                                <h3 className="text-headline-lg" style={{ marginBottom: 'var(--space-md)' }}>About {p.first_name}</h3>
                                <p className="text-body-md" style={{ lineHeight: '1.7' }}>{p.bio}</p>
                            </Card>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        {/* ── Action Card ── */}
                        <Card variant="elevated" padding="xl" style={{ position: 'sticky', top: 'var(--space-xl)' }}>
                            <h3 className="text-headline-lg" style={{ marginBottom: 'var(--space-lg)' }}>Decision</h3>
                            
                            {application.status === 'pending' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <Button 
                                        variant="primary" 
                                        size="lg" 
                                        onClick={() => handleAction('accepted')} 
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? "..." : <><FiCheck /> Accept</>}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="lg" 
                                        onClick={() => handleAction('rejected')} 
                                        disabled={actionLoading}
                                        style={{ color: 'var(--color-danger)' }}
                                    >
                                        {actionLoading ? "..." : <><FiX /> Reject</>}
                                    </Button>
                                </div>
                            ) : application.status === 'accepted' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <div style={{ 
                                        padding: 'var(--space-md)', backgroundColor: 'var(--color-success-light)', 
                                        color: 'var(--color-success)', borderRadius: 'var(--radius-md)', 
                                        fontWeight: '600', textAlign: 'center' 
                                    }}>
                                        Application Accepted
                                    </div>
                                    <Button variant="primary" size="lg" onClick={openChat}>
                                        <FiMessageCircle /> Chat with {p.first_name}
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: 'var(--space-md)', backgroundColor: 'var(--color-danger-light)', 
                                    color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', 
                                    fontWeight: '600', textAlign: 'center' 
                                }}>
                                    Application Rejected
                                </div>
                            )}
                        </Card>

                        {/* ── Job Context ── */}
                        <Card variant="elevated" padding="lg">
                            <h3 className="text-headline-lg" style={{ marginBottom: 'var(--space-md)', fontSize: '18px' }}>Job Context</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div>
                                    <h4 className="text-title-md" style={{ fontSize: '15px' }}>{job.title}</h4>
                                    <p className="text-label-sm" style={{ marginTop: '4px' }}>
                                        Posted {new Date(job.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span className="text-body-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                        <FiMapPin /> {job.city || (job.location_type === 'remote' ? 'Remote' : 'Various')}
                                    </span>
                                    <span className="text-body-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                        <FiBriefcase /> {job.category || 'Gig'}
                                    </span>
                                </div>
                                <Link href={`/worker/browse/detail?id=${job.id}`} className="text-label-sm" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '700' }}>
                                    View full listing →
                                </Link>
                            </div>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}

export default function ApplicationReviewPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <ApplicationReviewContent />
        </Suspense>
    );
}
