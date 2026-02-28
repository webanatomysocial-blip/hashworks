'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '@/css/worker.css';
import '@/css/hirer.css';

export default function WorkerDashboard() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [allJobs, setAllJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [activeContracts, setActiveContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            // Fetch applications that are accepted for "Active Gigs"
            const { data: acceptedAppsData } = await supabase
                .from('applications')
                .select('*, jobs(title, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                .eq('worker_id', user.id)
                .eq('status', 'accepted');
            setActiveContracts(acceptedAppsData || []);

            // Fetch ALL active jobs for "Recommended Gigs" (excluding user's own)
            let jobsQuery = supabase
                .from('jobs')
                .select('*, profiles!jobs_hirer_id_fkey(first_name, last_name)')
                .eq('status', 'active')
                .neq('hirer_id', user.id);

            if (profileData?.city) {
                jobsQuery = jobsQuery.or(`location_type.eq.remote,and(location_type.eq.onsite,city.ilike.%${profileData.city}%)`);
            }

            const { data: jobsData } = await jobsQuery.order('created_at', { ascending: false });
            setAllJobs(jobsData || []);

            // Fetch saved jobs
            const { data: savedData } = await supabase
                .from('saved_jobs')
                .select('*, jobs(*, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                .eq('worker_id', user.id);
            setSavedJobs(savedData || []);

            // Fetch MY applications
            const { data: appsData, error: appsError } = await supabase
                .from('applications')
                .select('*, jobs(*, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false });
            if (appsError) console.error('Error fetching my applications:', appsError);
            setMyApplications(appsData || []);

        } catch (err) {
            console.error('Error fetching worker data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveJob = async (jobId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const alreadySaved = savedJobs.some(s => s.job_id === jobId);
            if (alreadySaved) {
                await supabase.from('saved_jobs').delete()
                    .eq('job_id', jobId).eq('worker_id', user.id);
                setSavedJobs(prev => prev.filter(s => s.job_id !== jobId));
            } else {
                const { data } = await supabase.from('saved_jobs')
                    .insert([{ job_id: jobId, worker_id: user.id }])
                    .select('*, jobs(*, profiles(full_name))');
                if (data) setSavedJobs(prev => [...prev, ...data]);
            }
        } catch (err) {
            console.error('Error toggling saved job:', err);
        }
    };

    const handleApply = async (job) => {
        if (job.hirer_id === userId) {
            showToast("You can't apply to your own job listing.", "error");
            return;
        }
        if (myApplications.some(a => a.job_id === job.id)) {
            showToast("You have already applied for this job.", "error");
            return;
        }

        setApplyingJobId(job.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Profile Completeness Check
            const { data: prof } = await supabase.from('profiles').select('bio').eq('id', user.id).single();
            const { count: skillCount } = await supabase.from('worker_skills').select('*', { count: 'exact', head: true }).eq('worker_id', user.id);

            if (!prof?.bio || skillCount === 0) {
                showToast("Please complete your profile (Bio & Skills) before applying.", "error");
                router.push('/worker/profile');
                return;
            }

            const { data: appData, error } = await supabase.from('applications').insert([{
                job_id: job.id,
                worker_id: user.id,
                status: 'pending'
            }]).select('*, jobs(*, profiles!jobs_hirer_id_fkey(first_name, last_name))').single();

            if (error) {
                console.error('Apply error:', error);
                if (error.code === '23505' || error.message.includes('duplicate key value')) {
                    showToast('You have already applied for this job.', 'error');
                } else {
                    showToast('Failed to apply: ' + error.message, 'error');
                }
            } else {
                setMyApplications(prev => [appData, ...prev]);
                showToast('Application submitted successfully!', 'success');
            }
        } catch (err) {
            console.error('Error applying to job:', err);
            showToast('An error occurred while applying.', 'error');
        } finally {
            setApplyingJobId(null);
        }
    };

    const handleWithdraw = async (applicationId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', applicationId)
                .eq('worker_id', user.id);

            if (error) {
                showToast('Failed to withdraw application.', 'error');
                console.error(error);
            } else {
                setMyApplications(prev => prev.filter(app => app.id !== applicationId));
                showToast('Application withdrawn successfully.', 'success');
            }
        } catch (err) {
            console.error('Error withdrawing application:', err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    const formatBudget = (min, max) => {
        if (!min && !max) return 'Negotiable';
        if (min && !max) return `₹${min.toLocaleString()}+/hr`;
        if (!min && max) return `Up to ₹${max.toLocaleString()}/hr`;
        if (min === max) return `₹${min.toLocaleString()} Fixed`;
        return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/hr`;
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return 'Recently';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const savedJobIds = new Set(savedJobs.map(s => s.job_id));
    const appliedJobIds = new Set(myApplications.map(a => a.job_id));
    const firstName = profile?.first_name || 'there';

    if (loading) return <div className="worker-loading">Loading your dashboard...</div>;

    return (
        <div className="worker-dashboard-new" style={{ position: 'relative' }}>
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 24px',
                    backgroundColor: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: toast.type === 'error' ? '#991b1b' : '#166534',
                    borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
                    fontWeight: '500', border: `1px solid ${toast.type === 'error' ? '#f87171' : '#4ade80'}`,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.message}
                </div>
            )}
            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>

            {/* Header */}
            <header className="worker-header-new">
                <h1 className="worker-greeting">Hello, {profile?.first_name}</h1>
                <p className="worker-subtitle">Your Career Dashboard</p>
            </header>

            {/* Stats Row (Mimicking Hirer Dashboard) */}
            <div className="hd-stats-row worker-stats-override" style={{ marginBottom: '24px', padding: '0 16px' }}>
                <div className="hd-stat-card">
                    <div className="hd-stat-icon blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div>
                        <div className="hd-stat-value">{activeContracts.length}</div>
                        <div className="hd-stat-label">Active Gigs</div>
                    </div>
                </div>
                <div className="hd-stat-card">
                    <div className="hd-stat-icon purple">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div>
                        <div className="hd-stat-value">{myApplications.length}</div>
                        <div className="hd-stat-label">Applications Sent</div>
                    </div>
                </div>
            </div>

            {/* Active Gigs Section */}
            <section className="worker-section-new">
                <div className="section-header-new">
                    <div className="section-title-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        <h2 className="section-title-new">Active Gigs</h2>
                    </div>
                    <button className="see-all-btn" onClick={() => router.push('/worker/active-gigs')}>See All</button>
                </div>

                <div className="active-gigs-list">
                    {activeContracts.length === 0 ? (
                        <div className="empty-state-new">No active gigs right now.</div>
                    ) : (
                        activeContracts.slice(0, 3).map(app => (
                            <div key={app.id} className="active-gig-card">
                                <div className="gig-header">
                                    <div>
                                        <h3 className="gig-title">{app.jobs?.title || 'Unknown Gig'}</h3>
                                        <p className="gig-company">{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''}</p>
                                    </div>
                                    <span className="timeline-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>Accepted</span>
                                </div>
                                <div className="gig-progress-wrap">
                                    <div className="gig-progress-labels">
                                        <span>Status</span>
                                        <span style={{ color: '#059669', fontWeight: '600' }}>Ready to Work</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Recommended Gigs Section */}
            <section className="worker-section-new">
                <div className="section-header-new">
                    <div className="section-title-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="section-icon-gold"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        <h2 className="section-title-new">Recommended Gigs</h2>
                    </div>
                    <button className="see-all-btn" onClick={() => router.push('/worker/browse')}>Browse More</button>
                </div>

                <div className="recommended-gigs-scroll">
                    {allJobs.length === 0 ? (
                        <div className="empty-state-new">No recommended gigs found.</div>
                    ) : (
                        allJobs.slice(0, 5).map(job => {
                            const isApplied = appliedJobIds.has(job.id);
                            const isOwnJob = job.hirer_id === userId;
                            const isApplying = applyingJobId === job.id;

                            return (
                                <div key={job.id} className="recommended-job-card">
                                    <div className="rec-job-header">
                                        <h3 className="rec-job-title">{job.title}</h3>
                                        <span className="badge-remote">REMOTE</span>
                                    </div>
                                    <p className="rec-job-company">{job.profiles?.first_name} {job.profiles?.last_name || ''}</p>

                                    <div className="rec-job-details">
                                        <div className="detail-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                            <span>{formatBudget(job.budget_min, job.budget_max)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            <span>{job.location_type === 'remote' ? 'Remote' : job.city || 'On-site'}</span>
                                        </div>
                                        <div className="detail-item time-item" style={{ marginTop: '4px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                            <span>{timeAgo(job.created_at)}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                        <button
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                                background: '#fff', color: '#0f172a', fontWeight: '500', fontSize: '13px',
                                                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                                            }}
                                            onClick={() => router.push(`/worker/browse/detail/?id=${job.id}`)}
                                        >
                                            View Details
                                        </button>
                                        <button
                                            className={`apply-btn-new ${isApplied ? 'applied' : ''} ${isOwnJob ? 'own-job' : ''}`}
                                            onClick={() => handleApply(job)}
                                            disabled={isApplied || isApplying || isOwnJob}
                                            style={{ flex: 1 }}
                                        >
                                            {isOwnJob ? 'Your Listing' : isApplying ? 'Applying…' : isApplied ? 'Applied' : 'Apply Now'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

            {/* Applications Section */}
            <section className="worker-section-new">
                <div className="section-header-new">
                    <div className="section-title-wrap">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        <h2 className="section-title-new">Applications</h2>
                    </div>
                    <button className="see-all-btn" onClick={() => router.push('/worker/applications')}>See All</button>
                </div>

                <div className="applications-list-new">
                    {myApplications.length === 0 ? (
                        <div className="empty-state-new">No applications yet.</div>
                    ) : (
                        myApplications.slice(0, 5).map(app => (
                            <div key={app.id} className="app-card-new" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                                    <div className="app-card-icon" style={{ flexShrink: 0 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                    </div>
                                    <div className="app-card-content" style={{ flex: 1 }}>
                                        <h3 className="app-title-new">{app.jobs?.title || 'Untitled Role'}</h3>
                                        <p className="app-meta-new">{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''} · Applied</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                                    <span className={`app-badge-new ${app.status}`}>{app.status || 'Pending'}</span>
                                    {app.status === 'pending' && (
                                        <button
                                            onClick={() => handleWithdraw(app.id)}
                                            style={{
                                                background: 'none', border: 'none', color: '#ef4444', fontSize: '12px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px'
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                            Withdraw
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
