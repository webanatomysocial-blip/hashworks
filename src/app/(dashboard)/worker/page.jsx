'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import '@/css/worker.css';

export default function WorkerDashboard() {
    const [userId, setUserId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [allJobs, setAllJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [applyingJobId, setApplyingJobId] = useState(null);

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

            // Fetch ALL open jobs — every user can be both hirer and worker
            // We still show all open jobs but DISABLE apply for user's own
            const { data: jobsData, error: jobsErr } = await supabase
                .from('jobs')
                .select('*, profiles(full_name)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (jobsErr) console.error('Jobs fetch error:', jobsErr);
            setAllJobs(jobsData || []);

            // Fetch saved jobs (only mine)
            const { data: savedData } = await supabase
                .from('saved_jobs')
                .select('*, jobs(*, profiles(full_name))')
                .eq('worker_id', user.id);
            setSavedJobs(savedData || []);

            // Fetch MY applications — with full job and hirer details
            const { data: appsData, error: appsErr } = await supabase
                .from('applications')
                .select('*, jobs(id, title, budget, status, hirer_id, profiles(full_name))')
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false });

            if (appsErr) console.error('Apps fetch error:', appsErr);
            setMyApplications(appsData || []);

            // Earnings = accepted budgets
            const earnings = (appsData || [])
                .filter(a => a.status === 'accepted' && a.jobs?.budget)
                .reduce((sum, a) => sum + (a.jobs.budget || 0), 0);
            setTotalEarnings(earnings);

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
        // Can't apply to own job
        if (job.hirer_id === userId) {
            alert("You can't apply to your own job listing.");
            return;
        }
        // No duplicate applications
        if (myApplications.some(a => a.job_id === job.id)) return;

        setApplyingJobId(job.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('applications').insert([{
                job_id: job.id,
                worker_id: user.id,
                status: 'pending'
            }]);

            if (error) {
                console.error('Apply error:', error);
                alert('Failed to apply: ' + error.message);
            } else {
                // Optimistically add to applications list
                setMyApplications(prev => [...prev, {
                    id: `temp-${job.id}`,
                    job_id: job.id,
                    worker_id: user.id,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    jobs: {
                        id: job.id,
                        title: job.title,
                        budget: job.budget,
                        status: job.status,
                        hirer_id: job.hirer_id,
                        profiles: job.profiles
                    }
                }]);
            }
        } catch (err) {
            console.error('Error applying to job:', err);
        } finally {
            setApplyingJobId(null);
        }
    };

    const getProfileCompletion = () => {
        if (!profile) return 0;
        const fields = ['full_name', 'username', 'avatar_url', 'phone', 'role'];
        const filled = fields.filter(f => profile[f]).length;
        return Math.round((filled / fields.length) * 100);
    };

    const filteredJobs = allJobs.filter(job => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return job.title?.toLowerCase().includes(q) || job.description?.toLowerCase().includes(q);
    });

    const savedJobIds = new Set(savedJobs.map(s => s.job_id));
    const appliedJobIds = new Set(myApplications.map(a => a.job_id));
    const profileCompletion = getProfileCompletion();
    const firstName = profile?.full_name?.split(' ')[0] || 'there';

    if (loading) return <div className="worker-loading">Loading your dashboard...</div>;

    return (
        <div className="worker-dashboard">
            {/* Welcome */}
            <section className="worker-welcome">
                <div className="worker-welcome-text">
                    <h1 className="worker-welcome-title">Hey {firstName},</h1>
                    <p className="worker-welcome-sub">Find your next gig today.</p>
                </div>
                {profileCompletion < 100 && (
                    <div className="worker-profile-completion">
                        <span className="completion-label">Complete the profile</span>
                        <div className="completion-bar-track">
                            <div className="completion-bar-fill" style={{ width: `${profileCompletion}%` }} />
                        </div>
                        <span className="completion-pct">{profileCompletion}%</span>
                    </div>
                )}
            </section>

            {/* Earnings */}
            <div className="worker-earnings-card">
                <div>
                    <p className="earnings-label">Total Earnings</p>
                    <p className="earnings-sub">
                        {myApplications.filter(a => a.status === 'accepted').length} accepted · {myApplications.filter(a => a.status === 'pending').length} pending
                    </p>
                </div>
                <span className="earnings-value">₹{totalEarnings.toLocaleString()}</span>
            </div>

            {/* Explore Jobs */}
            <section className="worker-section">
                <div className="worker-section-header">
                    <h2 className="worker-section-title">
                        Explore Jobs <span className="jobs-count">{filteredJobs.length}</span>
                    </h2>
                    <div className="filter-wrapper">
                        <button className="filter-btn" onClick={() => setFilterOpen(p => !p)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                            </svg>
                            Filter
                        </button>
                        {filterOpen && (
                            <div className="filter-dropdown">
                                <input
                                    type="text"
                                    className="filter-search"
                                    placeholder="Search by title or description..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                </div>

                {filteredJobs.length === 0 ? (
                    <div className="worker-empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                        </svg>
                        <p>No open jobs at the moment.</p>
                    </div>
                ) : (
                    <div className="worker-jobs-grid">
                        {filteredJobs.map(job => {
                            const isSaved = savedJobIds.has(job.id);
                            const isApplied = appliedJobIds.has(job.id);
                            const isOwnJob = job.hirer_id === userId;
                            const isApplying = applyingJobId === job.id;

                            return (
                                <div key={job.id} className={`worker-job-card ${isApplied ? 'applied-card' : ''} ${isOwnJob ? 'own-job-card' : ''}`}>
                                    <div className="job-card-header">
                                        <div className="job-poster-info">
                                            <div className="job-card-avatar">
                                                {job.profiles?.full_name?.[0]?.toUpperCase() || 'H'}
                                            </div>
                                            <div>
                                                <p className="job-poster-name">
                                                    {job.profiles?.full_name || 'Anonymous'}
                                                    {isOwnJob && <span className="own-job-tag"> · Your job</span>}
                                                </p>
                                                <p className="job-post-time">
                                                    {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {!isOwnJob && (
                                            <button
                                                className={`job-save-btn ${isSaved ? 'saved' : ''}`}
                                                onClick={() => handleSaveJob(job.id)}
                                                title={isSaved ? 'Remove from saved' : 'Save job'}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    <div className="job-card-body">
                                        <h3 className="job-card-title">{job.title}</h3>
                                        {job.description && (
                                            <p className="job-card-desc">
                                                {job.description.slice(0, 100)}{job.description.length > 100 ? '…' : ''}
                                            </p>
                                        )}
                                    </div>

                                    <div className="job-card-footer">
                                        {job.budget && (
                                            <div className="job-budget-tag">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                </svg>
                                                ₹{job.budget.toLocaleString()}
                                            </div>
                                        )}
                                        <span className={`job-status-badge ${job.status}`}>{job.status}</span>
                                    </div>

                                    <button
                                        className={`job-apply-btn ${isApplied ? 'applied' : ''} ${isOwnJob ? 'own-job' : ''}`}
                                        onClick={() => handleApply(job)}
                                        disabled={isApplied || isApplying || isOwnJob}
                                    >
                                        {isOwnJob ? 'Your Listing' : isApplying ? 'Applying…' : isApplied ? '✓ Applied' : 'Apply Now'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* My Applications */}
            <section className="worker-section">
                <div className="worker-section-header">
                    <h2 className="worker-section-title">
                        My Applications <span className="jobs-count">{myApplications.length}</span>
                    </h2>
                </div>
                {myApplications.length === 0 ? (
                    <div className="worker-empty">
                        <p>You haven&apos;t applied to any jobs yet.</p>
                    </div>
                ) : (
                    <div className="applications-list">
                        {myApplications.map(app => (
                            <div key={app.id} className={`application-item ${app.status}`}>
                                <div className="app-info">
                                    <p className="app-job-title">{app.jobs?.title || 'Untitled Job'}</p>
                                    <p className="app-meta">
                                        Posted by {app.jobs?.profiles?.full_name || 'Unknown'}
                                        {app.jobs?.budget && ` · ₹${app.jobs.budget.toLocaleString()}`}
                                    </p>
                                    <p className="app-date">{new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="app-status-col">
                                    <span className={`app-status-badge ${app.status}`}>{app.status}</span>
                                    {app.status === 'accepted' && (
                                        <p className="app-accepted-note">🎉 Accepted!</p>
                                    )}
                                    {app.status === 'rejected' && (
                                        <p className="app-rejected-note">Not selected</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Saved Jobs */}
            <section className="worker-section">
                <div className="worker-section-header">
                    <h2 className="worker-section-title">
                        Saved Jobs <span className="jobs-count">{savedJobs.length}</span>
                    </h2>
                    {savedJobs.length > 4 && <button className="view-all-btn">View all</button>}
                </div>

                {savedJobs.length === 0 ? (
                    <div className="worker-empty">
                        <p>No saved jobs yet. Tap the bookmark to save.</p>
                    </div>
                ) : (
                    <div className="worker-jobs-grid">
                        {savedJobs.slice(0, 4).map(saved => {
                            const job = saved.jobs;
                            if (!job) return null;
                            const isApplied = appliedJobIds.has(job.id);
                            const isOwnJob = job.hirer_id === userId;
                            return (
                                <div key={saved.id} className="worker-job-card saved-card">
                                    <div className="job-card-header">
                                        <div className="job-poster-info">
                                            <div className="job-card-avatar">{job.profiles?.full_name?.[0]?.toUpperCase() || 'H'}</div>
                                            <p className="job-poster-name">{job.profiles?.full_name || 'Anonymous'}</p>
                                        </div>
                                        <button className="job-save-btn saved" onClick={() => handleSaveJob(job.id)} title="Remove from saved">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <h3 className="job-card-title">{job.title}</h3>
                                    <div className="job-card-footer">
                                        {job.budget && (
                                            <div className="job-budget-tag">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                </svg>
                                                ₹{job.budget.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className={`job-apply-btn ${isApplied ? 'applied' : ''} ${isOwnJob ? 'own-job' : ''}`}
                                        onClick={() => handleApply(job)}
                                        disabled={isApplied || isOwnJob}
                                    >
                                        {isOwnJob ? 'Your Listing' : isApplied ? '✓ Applied' : 'Apply Now'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
