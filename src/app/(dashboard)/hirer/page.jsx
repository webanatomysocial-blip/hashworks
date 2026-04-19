'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    FiBriefcase, FiUsers, FiChevronRight,
    FiFileText, FiActivity
} from 'react-icons/fi';
import '@/css/hirer.css';
import { useRouter } from 'next/navigation';
import { useStats } from '@/Components/providers/StatsProvider';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import HashLoader from "@/Components/common/HashLoader.jsx";
import ActiveTaskBanner from '@/Components/common/ActiveTaskBanner';
import HirerPostingsList from '@/Components/hirer/HirerPostingsList';
import LatestChatsList from '@/Components/worker/LatestChatsList';

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

export default function HirerDashboard() {
    const { stats } = useStats();
    const [profile, setProfile] = useState(null);
    const [userId, setUserId] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [savedTalent, setSavedTalent] = useState([]);
    const [latestChats, setLatestChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeToggle, setActiveToggle] = useState("postTask");

    const router = useRouter();

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            /* profile */
            const { data: prof } = await supabase
                .from('profiles').select('*').eq('id', user.id).single();
            setProfile(prof);

            /* jobs */
            const { data: jobsData } = await supabase
                .from('jobs')
                .select('*, application_count:applications(count)')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false });
            
            // Clean application_count from the join
            const cleanedJobs = (jobsData || []).map(j => ({
                ...j,
                application_count: j.application_count?.[0]?.count || 0
            }));
            setJobs(cleanedJobs);

            /* applications for stats */
            const { data: appsData } = await supabase
                .from('applications')
                .select('id, status')
                .in('job_id', cleanedJobs.map(j => j.id));
            setApplications(appsData || []);

            /* contracts - Most recent active one */
            const { data: conData } = await supabase
                .from('contracts')
                .select('*, jobs(id, title, urgency, budget_max, city, status), worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, username, avatar_url, average_rating)')
                .eq('hirer_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            setContracts(conData || []);

            /* saved talent */
            const { data: talentData } = await supabase
                .from('saved_talent')
                .select('*, worker:profiles!saved_talent_worker_id_fkey(id, first_name, last_name, username, avatar_url, bio, average_rating)')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false })
                .limit(8);
            setSavedTalent(talentData || []);

            /* Latest chats */
            const { data: chatsData } = await supabase
                .from('messages')
                .select(`id, content, created_at, is_read,
                  contract:contracts!messages_contract_id_fkey(
                    id,
                    hirer:profiles!contracts_hirer_id_fkey(id, first_name, last_name, avatar_url),
                    worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, avatar_url)
                  )`)
                .order('created_at', { ascending: false }).limit(20);

            const seen = new Set();
            const deduped = [];
            for (const msg of (chatsData || [])) {
                const cid = msg.contract?.id;
                if (cid && !seen.has(cid)) {
                    seen.add(cid);
                    const isWorker = msg.contract?.worker?.id === user.id;
                    deduped.push({ ...msg, otherPerson: isWorker ? msg.contract?.hirer : msg.contract?.worker });
                    if (deduped.length >= 5) break;
                }
            }
            setLatestChats(deduped);

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    if (loading) return <HashLoader text="" />;

    const mostRecentContract = contracts[0];
    const latestJob = jobs[0]; 
    const bannerTarget = mostRecentContract || latestJob;
    const pendingApps = applications.filter(a => a.status === 'pending').length;

    return (
        <div className="wh-dashboard">
            <PageContainer style={{ paddingTop: '20px' }}>
                {/* Role Toggle */}
                <div className="hw-role-toggle" style={{ marginTop: '20px' }}>
                    <button 
                        className={`hw-toggle-btn ${activeToggle === 'findWork' ? 'hw-toggle-btn--active' : ''}`} 
                        onClick={() => { setActiveToggle("findWork"); router.push('/worker'); }}
                    >
                        Find Work
                    </button>
                    <button 
                        className={`hw-toggle-btn ${activeToggle === 'postTask' ? 'hw-toggle-btn--active' : ''}`} 
                        onClick={() => setActiveToggle("postTask")}
                    >
                        Post Task
                    </button>
                </div>

                {/* Greeting Section */}
                <div className="hw-mb-32" style={{ padding: '0 16px' }}>
                    <p className="text-label-sm" style={{ color: '#64748B', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>RECRUITER HUB</p>
                    <h1 className="text-display-xl" style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px' }}>
                        Hello, {profile?.first_name || 'Hirer'}
                    </h1>
                </div>

                {/* Top Banner: Most Recent Post or Active Contract */}
                <div className="hw-section" style={{ padding: '0 16px' }}>
                    {bannerTarget ? (
                        <ActiveTaskBanner 
                            contract={bannerTarget} 
                            role="hirer"
                            onClick={() => {
                                if (bannerTarget.contracts || bannerTarget.worker) {
                                     router.push(`/messages?contract=${bannerTarget.id}`);
                                } else {
                                     router.push(`/hirer/postings/view?id=${bannerTarget.id}`);
                                }
                            }}
                        />
                    ) : (
                        <Card variant="elevated" padding="lg" className="hw-card-primary hw-text-center">
                            <div className="text-label-sm">Get Things Done</div>
                            <h1 className="text-headline-lg">No Ongoing Tasks</h1>
                            <p className="text-body-md hw-mt-4">
                                Post a new task and find top-rated workers in minutes.
                            </p>
                            <button 
                                className="hw-btn hw-btn-secondary hw-mt-4" 
                                onClick={() => router.push('/hirer/postings/create')}
                            >
                                Post a Task
                            </button>
                        </Card>
                    )}
                </div>

                {/* Active Postings Summary */}
                <div className="hw-section">
                    <HirerPostingsList 
                        jobs={jobs} 
                        onJobClick={(id) => router.push(`/hirer/postings/view?id=${id}`)}
                        onAddClick={() => router.push('/hirer/postings/create')}
                    />
                </div>

                {/* Stats Grid */}
                <div className="hw-section" style={{ padding: '0 16px' }}>
                    <div className="hw-grid-2">
                        <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={() => router.push('/hirer/postings')} style={{ borderRadius: '24px' }}>
                            <div className="hw-flex hw-flex-col">
                                <div className="hw-icon-box-primary hw-mb-16" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                                    <FiBriefcase size={22} />
                                </div>
                                <div className="hw-flex hw-justify-between hw-items-end">
                                    <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Postings</span>
                                    <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A' }}>{jobs.length}</div>
                                </div>
                            </div>
                        </Card>
                        <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={() => router.push('/hirer/applications')} style={{ borderRadius: '24px' }}>
                            <div className="hw-flex hw-flex-col">
                                <div className="hw-icon-box-success hw-mb-16" style={{ background: '#c7f284', color: '#0F172A', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
                                    <FiUsers size={22} />
                                </div>
                                <div className="hw-flex hw-justify-between hw-items-end">
                                    <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Pending Review</span>
                                    <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A' }}>{pendingApps}</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Saved Talent */}
                {savedTalent.length > 0 && (
                    <div className="hw-section" style={{ padding: '0 16px' }}>
                        <div className="hw-flex hw-justify-between hw-items-center hw-mb-16">
                            <h2 className="text-headline-lg" style={{ fontWeight: 800 }}>Top Rated Talent</h2>
                            <Link href="/hirer/talent" className="text-label-sm" style={{ color: 'var(--hw-primary)', fontWeight: 800 }}>View All</Link>
                        </div>
                        <div className="hw-urgent-scroll">
                            {savedTalent.map(talent => (
                                <Card 
                                    key={talent.id} 
                                    variant="border" 
                                    padding="md" 
                                    className="hw-card-interactive"
                                    onClick={() => router.push(`/worker/profile/view?id=${talent.worker.id}`)}
                                    style={{ minWidth: '180px', textAlign: 'center', borderRadius: '24px' }}
                                >
                                    <div className="wh-avatar-placeholder" style={{ width: '70px', height: '70px', margin: '0 auto 12px', borderRadius: '50%', border: '4px solid #f8fafc', boxShadow: 'var(--hw-shadow-low)' }}>
                                        {talent.worker.avatar_url ? (
                                             <img src={talent.worker.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                        ) : (
                                            (talent.worker.first_name?.[0] || 'W').toUpperCase()
                                        )}
                                    </div>
                                    <h4 className="text-title-md" style={{ fontSize: '15px', fontWeight: 800 }}>{talent.worker.first_name || 'Talent'}</h4>
                                    <p className="text-label-sm" style={{ color: '#1C4DFF', fontSize: '11px', fontWeight: 900, marginTop: '4px' }}>
                                        ★ {Number(talent.worker.average_rating || 5.0).toFixed(1)}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Latest Chats */}
                <div className="hw-section" style={{ padding: '0 16px' }}>
                    <LatestChatsList
                        chats={latestChats}
                        onViewAll={() => router.push('/messages')}
                        onChatClick={(contractId) => router.push(`/messages?contract=${contractId}`)}
                    />
                </div>

            </PageContainer>
        </div>
    );
}
