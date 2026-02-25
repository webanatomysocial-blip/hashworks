'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import StatsCard from '@/Components/StatsCard.jsx';
import JobItem from '@/Components/JobItem.jsx';
import ConfirmModal from '@/Components/ConfirmModal.jsx';
import '@/css/hirer.css';

export default function HirerDashboard() {
    const [profile, setProfile] = useState(null);
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState({ totalJobs: 0, activeProjects: 0, pendingApps: 0 });
    const [activeTab, setActiveTab] = useState('active-jobs');
    const [loading, setLoading] = useState(true);

    const [activeJobs, setActiveJobs] = useState([]);
    const [ongoingProjects, setOngoingProjects] = useState([]);
    const [recentApps, setRecentApps] = useState([]);

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Accept/Reject state
    const [actionLoading, setActionLoading] = useState(null); // applicationId being actioned

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            // 1. Fetch ALL jobs created by this user
            const { data: jobsData, error: jobsErr } = await supabase
                .from('jobs')
                .select('*')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false });

            if (jobsErr) console.error('Jobs error:', jobsErr);
            const jobs = jobsData || [];

            // Split into active (open/draft) and ongoing (in_progress)
            const active = jobs.filter(j => j.status === 'open' || j.status === 'draft');
            const ongoing = jobs.filter(j => j.status === 'in_progress');

            setActiveJobs(active);
            setOngoingProjects(ongoing);
            setStats(prev => ({
                ...prev,
                totalJobs: jobs.length,
                activeProjects: ongoing.length
            }));

            // 2. Fetch applications FOR THIS HIRER's jobs
            if (jobs.length > 0) {
                const jobIds = jobs.map(j => j.id);
                const { data: appsData, error: appsErr } = await supabase
                    .from('applications')
                    .select('*, profiles(full_name, avatar_url), jobs(title, budget)')
                    .in('job_id', jobIds)
                    .order('created_at', { ascending: false });

                if (appsErr) console.error('Applications error:', appsErr);
                const apps = appsData || [];
                setRecentApps(apps);
                setStats(prev => ({
                    ...prev,
                    pendingApps: apps.filter(a => a.status === 'pending').length
                }));
            } else {
                setRecentApps([]);
            }

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleEdit = (job) => {
        const event = new CustomEvent('openPostJobModal', { detail: job });
        window.dispatchEvent(event);
    };

    const confirmDelete = (jobId) => {
        setJobToDelete(jobId);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!jobToDelete) return;
        setDeleteLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User session not found.');

            const { data, error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', jobToDelete)
                .eq('hirer_id', user.id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error('Could not delete: The job was not found or you do not own it.');
            }

            setActiveJobs(prev => prev.filter(j => j.id !== jobToDelete));
            setOngoingProjects(prev => prev.filter(j => j.id !== jobToDelete));
            setStats(prev => ({ ...prev, totalJobs: Math.max(0, prev.totalJobs - 1) }));
            setDeleteModalOpen(false);
            setJobToDelete(null);
        } catch (err) {
            console.error('Delete error:', err);
            alert(err.message || 'Failed to delete job.');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Accept an application → update app to accepted + job to in_progress
    const handleAccept = async (app) => {
        setActionLoading(app.id);
        try {
            // Update application status
            const { error: appErr } = await supabase
                .from('applications')
                .update({ status: 'accepted' })
                .eq('id', app.id);
            if (appErr) throw appErr;

            // Update job status to in_progress
            const { error: jobErr } = await supabase
                .from('jobs')
                .update({ status: 'in_progress' })
                .eq('id', app.job_id);
            if (jobErr) throw jobErr;

            // Update local state
            setRecentApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));

            // Move job from active to ongoing
            setActiveJobs(prev => prev.filter(j => j.id !== app.job_id));
            setOngoingProjects(prev => {
                const job = activeJobs.find(j => j.id === app.job_id);
                if (job && !prev.find(j => j.id === job.id)) {
                    return [...prev, { ...job, status: 'in_progress' }];
                }
                return prev;
            });
            setStats(prev => ({
                ...prev,
                pendingApps: Math.max(0, prev.pendingApps - 1),
                activeProjects: prev.activeProjects + 1
            }));

        } catch (err) {
            console.error('Accept error:', err);
            alert(err.message || 'Failed to accept application.');
        } finally {
            setActionLoading(null);
        }
    };

    // Reject an application
    const handleReject = async (appId) => {
        setActionLoading(appId);
        try {
            const { error } = await supabase
                .from('applications')
                .update({ status: 'rejected' })
                .eq('id', appId);
            if (error) throw error;

            setRecentApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
            setStats(prev => ({ ...prev, pendingApps: Math.max(0, prev.pendingApps - 1) }));
        } catch (err) {
            console.error('Reject error:', err);
            alert(err.message || 'Failed to reject application.');
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) return <div className="loading-state">Loading dashboard...</div>;

    return (
        <div className="hirer-dashboard">
            <section className="welcome-section">
                <h1 className="welcome-title">Hey {profile?.full_name?.split(' ')[0] || 'there'},</h1>
                <p className="welcome-subtitle">Here&apos;s your hiring overview.</p>
            </section>

            <div className="stats-grid">
                <StatsCard label="Total Jobs" value={stats.totalJobs} />
                <StatsCard label="Ongoing" value={stats.activeProjects} />
                <StatsCard label="Pending Apps" value={stats.pendingApps} />
            </div>

            <div className="tabs-container">
                <div className="tabs-header">
                    <button className={`tab-btn ${activeTab === 'active-jobs' ? 'active' : ''}`} onClick={() => setActiveTab('active-jobs')}>
                        Active Jobs <span className="tab-count">{activeJobs.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`} onClick={() => setActiveTab('ongoing')}>
                        Ongoing <span className="tab-count">{ongoingProjects.length}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
                        Applications <span className="tab-count">{recentApps.length}</span>
                    </button>
                </div>

                <div className="tab-content">
                    {/* Active Jobs */}
                    {activeTab === 'active-jobs' && (
                        <div className="list-container">
                            {activeJobs.length > 0 ? activeJobs.map(job => (
                                <JobItem
                                    key={job.id}
                                    job={job}
                                    onEdit={handleEdit}
                                    onDelete={confirmDelete}
                                />
                            )) : (
                                <div className="empty-placeholder">No active jobs. Post a job to get started!</div>
                            )}
                        </div>
                    )}

                    {/* Ongoing Jobs (in_progress) */}
                    {activeTab === 'ongoing' && (
                        <div className="list-container">
                            {ongoingProjects.length > 0 ? ongoingProjects.map(job => (
                                <div key={job.id} className="item-card ongoing-card">
                                    <div className="item-header">
                                        <h4 className="item-title">{job.title}</h4>
                                        <span className="status-badge in_progress">In Progress</span>
                                    </div>
                                    <p className="item-meta">
                                        {job.budget ? `Budget: ₹${job.budget}` : 'No budget set'}
                                        <span className="item-timestamp">
                                            Posted {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </p>
                                </div>
                            )) : (
                                <div className="empty-placeholder">No ongoing projects yet. Accept an application to start one.</div>
                            )}
                        </div>
                    )}

                    {/* Applications */}
                    {activeTab === 'recent' && (
                        <div className="list-container">
                            {recentApps.length > 0 ? recentApps.map(app => (
                                <div key={app.id} className="item-card application-card">
                                    <div className="app-card-header">
                                        <div className="app-worker-info">
                                            <div className="app-avatar">
                                                {app.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h4 className="item-title">{app.profiles?.full_name || 'Unknown Worker'}</h4>
                                                <p className="item-meta">Applied for: <strong>{app.jobs?.title}</strong></p>
                                                {app.jobs?.budget && <p className="item-meta">Budget: <strong>₹{app.jobs.budget}</strong></p>}
                                                <p className="item-meta app-date">
                                                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`status-badge ${app.status}`}>{app.status}</span>
                                    </div>
                                    {app.cover_letter && (
                                        <p className="app-cover-letter">&ldquo;{app.cover_letter}&rdquo;</p>
                                    )}
                                    {app.status === 'pending' && (
                                        <div className="app-actions">
                                            <button
                                                className="app-accept-btn"
                                                onClick={() => handleAccept(app)}
                                                disabled={actionLoading === app.id}
                                            >
                                                {actionLoading === app.id ? 'Accepting…' : '✓ Accept'}
                                            </button>
                                            <button
                                                className="app-reject-btn"
                                                onClick={() => handleReject(app.id)}
                                                disabled={actionLoading === app.id}
                                            >
                                                {actionLoading === app.id ? '…' : '✕ Reject'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="empty-placeholder">No applications received yet.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Job Listing"
                message="Are you sure you want to delete this job? This will remove all associated applications."
                confirmText="Delete Job"
                loading={deleteLoading}
            />
        </div>
    );
}
