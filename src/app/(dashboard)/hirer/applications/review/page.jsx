'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
    FiMapPin, 
    FiCheck, 
    FiX, 
    FiBriefcase, 
    FiMessageCircle, 
    FiGlobe,
    FiChevronRight
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import Link from 'next/link';

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";
import SectionHeader from "@/Components/common/SectionHeader";
import RecentReviews from '@/Components/profile/RecentReviews';

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
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = useCallback(async () => {
        if (!appId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

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

                // Fetch basic reviews for the worker
                if (appData.worker_id) {
                    const { data: revs } = await supabase
                        .from('reviews')
                        .select(`*, reviewer:reviewer_id(first_name, last_name, avatar_url)`)
                        .eq('reviewee_id', appData.worker_id)
                        .order('created_at', { ascending: false })
                        .limit(5);
                    setReviews(revs || []);
                }

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
        if (!application || actionLoading) return;
        setActionLoading(true);
        try {
            const { error: updateErr } = await supabase
                .from('applications')
                .update({ status })
                .eq('id', appId);
            if (updateErr) throw updateErr;

            if (status === 'accepted') {
                const { data: existingContract } = await supabase
                    .from('contracts')
                    .select('*')
                    .eq('job_id', application.job_id)
                    .eq('worker_id', application.worker_id)
                    .maybeSingle();
                
                if (existingContract) {
                    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', application.job_id);
                    setApplication(prev => ({ ...prev, status: 'accepted', contract: existingContract }));
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
                    setApplication(prev => ({ ...prev, status: 'accepted', contract: newContract }));
                }
            } else {
                setApplication(prev => ({ ...prev, status }));
            }
        } catch (err) {
            console.error('Action error:', err);
            alert(`Failed to ${status} application: ${err.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const openChat = () => {
        if (application?.contract) {
            router.push(`/messages?contract=${application.contract.id}`);
        }
    };

    if (!appId) return <PageContainer size="lg"><div style={{ padding: '24px 20px' }}><Card padding="xl">No Application ID provided.</Card></div></PageContainer>;
    if (loading) return <HashLoader text="" />;
    if (!application) return <PageContainer size="lg"><div style={{ padding: '24px 20px' }}><Card padding="xl">Application not found.</Card></div></PageContainer>;

    const p = application.worker || {};
    const job = application.job || {};

    return (
        <div className="hirer-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 'var(--hw-space-48)' }}>
            <SectionHeader title="Application Review" />

            <PageContainer>
                <div className="wh-detail-main-layout" style={{ margin: 'var(--hw-space-24) auto', padding: '0 20px' }}>
                    
                    {/* Primary Column */}
                    <div className="hw-flex hw-flex-col hw-gap-24">
                        
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                            <div className="hw-flex hw-flex-col hw-gap-24 hw-items-center">
                                <div style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    borderRadius: '50%', 
                                    backgroundColor: 'var(--hw-surface-highest)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '32px', 
                                    color: 'var(--hw-primary)', 
                                    fontWeight: '800',
                                    boxShadow: 'var(--hw-shadow-low)',
                                    overflow: 'hidden'
                                }}>
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : initials(p)}
                                </div>

                                <div className="hw-text-center hw-w-full">
                                    <div className="hw-flex hw-flex-col hw-items-center hw-gap-8 hw-mb-12">
                                        <h2 className="head-text" style={{ margin: 0 }}>{fullName(p)}</h2>
                                        <Badge variant={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'urgent' : 'waiting'}>
                                            {application.status}
                                        </Badge>
                                    </div>
                                    <p className="para-text" style={{ color: 'var(--hw-text-secondary)', marginBottom: 'var(--hw-space-16)' }}>
                                        {p.headline || 'Professional Freelancer'}
                                    </p>
                                    <div className="hw-flex hw-justify-center hw-gap-16">
                                        <div className="sub-para-text hw-flex hw-items-center hw-gap-4">
                                            <FiMapPin size={14} /> {p.country || 'Global'}
                                        </div>
                                        {p.website && (
                                            <a href={p.website} target="_blank" rel="noopener noreferrer" className="sub-para-text hw-flex hw-items-center hw-gap-4" style={{ color: 'var(--hw-primary)', textDecoration: 'none' }}>
                                                <FiGlobe size={14} /> Portfolio
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="hw-section" style={{ padding: '0 4px' }}>
                            <h3 className="sub-head-text hw-mb-16" style={{ fontSize: '18px', letterSpacing: '0.05em' }}>Cover Letter</h3>
                            <Card padding="xl" variant="elevated" style={{ borderRadius: '20px', border: '1.5px solid var(--hw-surface-high)' }}>
                                <p className="para-text" style={{ whiteSpace: 'pre-wrap', color: 'var(--hw-text-main)' }}>
                                    {application.cover_letter || "No cover letter provided."}
                                </p>
                            </Card>
                        </div>

                        {p.bio && (
                            <div className="hw-section" style={{ padding: '0 4px', marginTop: '24px' }}>
                                <h3 className="sub-head-text hw-mb-16" style={{ fontSize: '18px', letterSpacing: '0.05em' }}>About Worker</h3>
                                <Card padding="xl" variant="elevated" style={{ borderRadius: '20px', border: '1.5px solid var(--hw-surface-high)' }}>
                                    <p className="para-text" style={{ color: 'var(--hw-text-secondary)' }}>{p.bio}</p>
                                </Card>
                            </div>
                        )}

                        <div className="hw-section" style={{ padding: '0 4px', marginTop: '24px' }}>
                            <RecentReviews reviews={reviews} targetId={p.id} />
                        </div>
                    </div>

                    {/* Secondary Column */}
                    <div className="hw-flex hw-flex-col hw-gap-24">
                        {/* Desktop Decision Card */}
                        <div className="wh-desktop-apply-box">
                            <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                                <h3 className="sub-head-text hw-mb-24" style={{ fontSize: '18px' }}>Review Decision</h3>
                                
                                {application.status === 'pending' ? (
                                    <div className="hw-flex hw-flex-col hw-gap-12">
                                        <Button onClick={() => handleAction('accepted')} disabled={actionLoading} style={{ height: '52px', borderRadius: '12px' }}>
                                            <FiCheck style={{ marginRight: '8px' }} /> Accept Applicant
                                        </Button>
                                        <Button variant="ghost" onClick={() => handleAction('rejected')} disabled={actionLoading} style={{ color: 'var(--hw-error)', height: '52px' }}>
                                            <FiX style={{ marginRight: '8px' }} /> Reject Application
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="hw-flex hw-flex-col hw-gap-16">
                                        <div style={{ 
                                            padding: '16px', 
                                            borderRadius: '12px', 
                                            background: application.status === 'accepted' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: application.status === 'accepted' ? 'var(--hw-success)' : 'var(--hw-error)',
                                            textAlign: 'center',
                                            fontWeight: 500,
                                            textTransform: 'capitalize'
                                        }}>
                                            Application {application.status}
                                        </div>
                                        {application.status === 'accepted' && (
                                            <Button onClick={openChat} style={{ height: '52px', borderRadius: '12px' }}>
                                                <FiMessageCircle style={{ marginRight: '8px' }} /> Chat with {p.first_name}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Card>
                        </div>

                        <Card variant="elevated" padding="lg" style={{ borderRadius: '24px', border: '1px solid var(--hw-surface-high)' }}>
                            <h3 className="sub-para-text hw-mb-16" style={{ color: 'var(--hw-text-secondary)' }}>Job Context</h3>
                            <h4 className="para-text hw-mb-8">{job.title}</h4>
                            <div className="hw-flex hw-flex-col hw-gap-12 hw-mb-20">
                                <span className="sub-para-text hw-flex hw-items-center hw-gap-8" style={{ color: 'var(--hw-text-secondary)' }}><FiMapPin size={16} /> {job.city || 'Remote'}</span>
                                <span className="sub-para-text hw-flex hw-items-center hw-gap-8" style={{ color: 'var(--hw-text-secondary)' }}><FiBriefcase size={16} /> {job.category || 'Gig'}</span>
                            </div>
                            <Link href="/hirer/postings" className="sub-para-text hw-flex hw-items-center hw-gap-4" style={{ color: 'var(--hw-primary)', textDecoration: 'none' }}>
                                BACK TO POSTINGS <FiChevronRight />
                            </Link>
                        </Card>
                    </div>
                </div>
            </PageContainer>

            {/* Mobile Sticky Action Footer */}
            {application.status === 'pending' && (
                <div className="wh-mobile-sticky-footer" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
                    <div className="hw-flex hw-gap-12">
                        <Button 
                            onClick={() => handleAction('accepted')} 
                            disabled={actionLoading} 
                            style={{ flex: 2, height: '60px', borderRadius: '18px', fontSize: '16px', fontWeight: 500 }}
                        >
                            {actionLoading ? "..." : "Accept Applicant"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => handleAction('rejected')} 
                            disabled={actionLoading} 
                            style={{ flex: 1, height: '60px', borderRadius: '18px', color: 'var(--hw-error)', border: '1.5px solid #F1F5F9', background: '#fff' }}
                        >
                            <FiX size={20} />
                        </Button>
                    </div>
                </div>
            )}

            {application.status === 'accepted' && (
                <div className="wh-mobile-sticky-footer">
                    <Button onClick={openChat} style={{ width: '100%', height: '60px', borderRadius: '18px', fontSize: '16px', fontWeight: 500 }}>
                        <FiMessageCircle size={20} style={{ marginRight: '10px' }} /> CHAT WITH WORKER
                    </Button>
                </div>
            )}
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
