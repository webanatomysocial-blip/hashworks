'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '@/Components/ConfirmModal.jsx';
import {
    FiBriefcase, FiUsers, FiCreditCard, FiChevronRight,
    FiPlus, FiEdit2, FiStar, FiBookmark, FiActivity,
    FiFileText
} from 'react-icons/fi';
import { BsFillPersonFill } from 'react-icons/bs';
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
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export default function HirerDashboard() {
    const [profile, setProfile] = useState(null);
    const [userId, setUserId] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [savedTalent, setSavedTalent] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    /* post job modal */
    const [jobToEdit, setJobToEdit] = useState(null);

    /* delete modal */
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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
                .select('*')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false });
            const allJobs = jobsData || [];
            setJobs(allJobs);

            /* applications for hirer's jobs */
            if (allJobs.length > 0) {
                const jobIds = allJobs.map(j => j.id);
                const { data: appsData } = await supabase
                    .from('applications')
                    .select('*, worker:profiles!applications_worker_id_fkey(id, first_name, last_name, username, avatar_url), jobs(title)')
                    .in('job_id', jobIds)
                    .order('created_at', { ascending: false });
                setApplications(appsData || []);
            }

            /* contracts */
            const { data: conData } = await supabase
                .from('contracts')
                .select('*, jobs(title, urgency), worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, username, avatar_url)')
                .eq('hirer_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            setContracts(conData || []);

            /* saved talent */
            const { data: talentData } = await supabase
                .from('saved_talent')
                .select('*, worker:profiles!saved_talent_worker_id_fkey(id, first_name, last_name, username, avatar_url, bio)')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4);
            setSavedTalent(talentData || []);

            /* reviews about the hirer */
            const { data: revData } = await supabase
                .from('reviews')
                .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, first_name, last_name, username, avatar_url)')
                .eq('reviewee_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);
            setReviews(revData || []);

            /* balance from transactions */
            const { data: txData } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('user_id', user.id)
                .eq('status', 'completed');
            if (txData) {
                const bal = txData.reduce((sum, t) => {
                    if (t.type === 'deposit') return sum + Number(t.amount);
                    if (t.type === 'payment' || t.type === 'withdrawal' || t.type === 'platform_fee') return sum - Number(t.amount);
                    return sum;
                }, 0);
                setBalance(bal);
            }

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    /* delete job */
    const handleDelete = async () => {
        if (!jobToDelete) return;
        setDeleteLoading(true);
        try {
            const { data, error } = await supabase
                .from('jobs').delete().eq('id', jobToDelete).eq('hirer_id', userId).select();
            if (error) throw error;
            if (!data?.length) throw new Error('Could not delete: job not found or not owned by you.');
            setJobs(prev => prev.filter(j => j.id !== jobToDelete));
            setDeleteModalOpen(false);
            setJobToDelete(null);
        } catch (err) {
            alert(err.message || 'Failed to delete job.');
        } finally {
            setDeleteLoading(false);
        }
    };

    /* navigate to edit page */
    const handleEdit = (job) => {
        router.push(`/hirer/postings/edit/?id=${job.id}`);
    };

    if (loading) return <div className="loading-state">Loading …</div>;

    /* derived */
    const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'draft');
    const totalApps = applications.length;
    const pendingApps = applications.filter(a => a.status === 'pending');

    return (
        <div className="hirer-dashboard">

            {/* ── Greeting ── */}
            <div className="hd-greeting">
                <p className="hd-greeting-sub">Recruiter Dashboard</p>
                <h1 className="hd-greeting-name">
                    Hello, {profile?.first_name || 'there'}
                </h1>
            </div>

            {/* ── Balance Card ── */}
            {/* <div className="hd-balance-card">
                <div className="hd-balance-top">
                    <span className="hd-balance-label">Balance</span>
                    <FiCreditCard className="hd-balance-icon" />
                </div>
                <div className="hd-balance-amount">
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="hd-balance-actions">
                    <button className="hd-balance-btn primary">Add Funds</button>
                    <button className="hd-balance-btn outline">View Logs</button>
                </div>
            </div> */}

            {/* ── Stats Row ── */}
            <div className="hd-stats-row">
                <div className="hd-stat-card">
                    <div className="hd-stat-icon blue">
                        <FiBriefcase />
                    </div>
                    <div>
                        <div className="hd-stat-value">{activeJobs.length}</div>
                        <div className="hd-stat-label">Active Postings</div>
                    </div>
                </div>
                <div className="hd-stat-card">
                    <div className="hd-stat-icon purple">
                        <FiUsers />
                    </div>
                    <div>
                        <div className="hd-stat-value">{totalApps}</div>
                        <div className="hd-stat-label">Total Applications</div>
                    </div>
                </div>
            </div>

            {/* ── Posted Jobs ── */}
            <div className="hd-section">
                <div className="hd-section-header">
                    <h2 className="hd-section-title">
                        <FiFileText className="hd-section-title-icon" />
                        Posted Jobs
                    </h2>
                    <Link href="/hirer/postings" className="hd-section-link">
                        Manage All
                    </Link>
                </div>

                {activeJobs.length === 0 ? (
                    <div className="hd-empty">No active jobs yet. Post your first job!</div>
                ) : (
                    <div className="hd-jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                        {activeJobs.slice(0, 4).map(job => {
                            const appCount = applications.filter(a => a.job_id === job.id).length;
                            return (
                                <div key={job.id} className="hd-job-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', margin: 0 }}>
                                    <div>
                                        <div className="hd-job-card-top">
                                            <h3 className="hd-job-title">{job.title}</h3>
                                            <span className={`hd-status-badge ${job.status}`}>
                                                {job.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="hd-job-meta">
                                            <strong>{appCount} Application{appCount !== 1 ? 's' : ''} Received</strong>
                                            {' · Posted '}
                                            {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="hd-job-card-actions" style={{ marginTop: 'auto' }}>
                                        <Link href={`/hirer/postings/edit?id=${job.id}`} className="hd-job-action-btn">
                                            <FiEdit2 size={13} /> Edit
                                        </Link>
                                        <Link href={`/hirer/postings/review/?id=${job.id}`} className="hd-job-action-btn review">
                                            Review
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeJobs.length > 4 && (
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Link href="/hirer/postings" className="hd-section-link" style={{ display: 'inline-block', padding: '8px 16px' }}>
                            View all {activeJobs.length} jobs <FiChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                        </Link>
                    </div>
                )}
            </div>

            {/* ── New Applications ── */}
            <div className="hd-section">
                <div className="hd-section-header">
                    <h2 className="hd-section-title">
                        <FiUsers className="hd-section-title-icon" />
                        New Applications
                    </h2>
                    {pendingApps.length > 4 && (
                        <Link href="/hirer/postings" className="hd-section-link">
                            View All <FiChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                        </Link>
                    )}
                </div>

                {pendingApps.length === 0 ? (
                    <div className="hd-empty">No new applications yet.</div>
                ) : (
                    pendingApps.slice(0, 4).map(app => {
                        const w = app.worker;
                        return (
                            <div key={app.id} className="hd-app-item">
                                <div className="hd-app-avatar">
                                    {w?.avatar_url
                                        ? <img src={w.avatar_url} alt={fullName(w)} />
                                        : initials(w)}
                                </div>
                                <div className="hd-app-info">
                                    <p className="hd-app-name">{fullName(w)}</p>
                                    <p className="hd-app-sub">
                                        Applied for {app.jobs?.title || 'a job'} · {timeAgo(app.created_at)}
                                    </p>
                                </div>
                                <Link href={`/hirer/postings/review/?id=${app.job_id}`} style={{ color: '#4b5563', display: 'flex' }}>
                                    <FiChevronRight className="hd-app-chevron" />
                                </Link>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Ongoing Gigs ── */}
            <div className="hd-section">
                <div className="hd-section-header">
                    <h2 className="hd-section-title">
                        <FiActivity className="hd-section-title-icon" />
                        Ongoing Gigs
                    </h2>
                </div>

                {contracts.length === 0 ? (
                    <div className="hd-empty">No active contracts yet.</div>
                ) : (
                    <>
                        {contracts.slice(0, 4).map(contract => {
                            const w = contract.worker;
                            const progress = contract.progress_percentage ?? 0;
                            const urgency = contract.jobs?.urgency || 'flexible';
                            const urgencyLabel = urgency === 'immediate' ? 'URGENT'
                                : urgency === 'high' ? 'HIGH PRIORITY'
                                    : 'FLEXIBLE';

                            /* days until end_date */
                            let dueText = urgencyLabel;
                            if (contract.end_date) {
                                const daysLeft = Math.ceil((new Date(contract.end_date) - Date.now()) / 86400000);
                                if (daysLeft > 0) dueText = `DUE IN ${daysLeft} DAYS`;
                                else if (daysLeft === 0) dueText = 'DUE TODAY';
                                else dueText = 'OVERDUE';
                            }

                            return (
                                <div key={contract.id} className="hd-gig-card">
                                    <div className="hd-gig-top">
                                        <h3 className="hd-gig-title">{contract.jobs?.title || 'Untitled Gig'}</h3>
                                        <span className={`hd-urgency-badge ${urgency}`}>{dueText}</span>
                                    </div>
                                    <p className="hd-gig-worker">
                                        Assigned To: <strong>{fullName(w)}</strong>
                                    </p>
                                    <div className="hd-progress-label">
                                        <span>Task Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="hd-progress-bar">
                                        <div className="hd-progress-fill" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            );
                        })}

                        {contracts.length > 4 && (
                            <div style={{ textAlign: 'center', marginTop: 8 }}>
                                <Link href="/hirer/postings" className="hd-section-link" style={{ display: 'inline-block', padding: '8px 16px' }}>
                                    View all {contracts.length} gigs <FiChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Saved Talent ── */}
            {/* <div className="hd-section">
                <div className="hd-section-header">
                    <h2 className="hd-section-title">
                        <FiBookmark className="hd-section-title-icon" />
                        Saved Talent
                    </h2>
                    {savedTalent.length > 0 && (
                        <button className="hd-section-link">
                            View All <FiChevronRight size={14} />
                        </button>
                    )}
                </div>

                {savedTalent.length === 0 ? (
                    <div className="hd-empty">No saved talent yet. Save workers you like!</div>
                ) : (
                    <div className="hd-talent-grid">
                        {savedTalent.map(item => {
                            const w = item.worker;
                            return (
                                <div key={item.id} className="hd-talent-card">
                                    <div className="hd-talent-avatar">
                                        {w?.avatar_url
                                            ? <img src={w.avatar_url} alt={fullName(w)} />
                                            : initials(w)}
                                    </div>
                                    <p className="hd-talent-name">{fullName(w)}</p>
                                    <p className="hd-talent-role">
                                        {w?.bio ? w.bio.split(' ').slice(0, 3).join(' ') : 'Freelancer'}
                                    </p>
                                    <button className="hd-talent-btn">
                                        <BsFillPersonFill style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                        View Profile
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div> */}

            {/* ── Recent Feedback ── */}
            {/* <div className="hd-section">
                <div className="hd-section-header">
                    <h2 className="hd-section-title">
                        <FiStar className="hd-section-title-icon" />
                        Recent Feedback
                    </h2>
                    {reviews.length > 0 && (
                        <button className="hd-section-link">
                            Read More <FiChevronRight size={14} />
                        </button>
                    )}
                </div>

                {reviews.length === 0 ? (
                    <div className="hd-empty">No feedback received yet.</div>
                ) : (
                    reviews.map(rev => {
                        const r = rev.reviewer;
                        return (
                            <div key={rev.id} className="hd-feedback-card">
                                <div className="hd-feedback-top">
                                    <span className="hd-feedback-reviewer">{fullName(r)}</span>
                                    <div className="hd-stars">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <FiStar key={i} style={{ fill: i < rev.rating ? '#f59e0b' : 'none', color: i < rev.rating ? '#f59e0b' : '#d1d5db' }} />
                                        ))}
                                    </div>
                                </div>
                                <p className="hd-feedback-comment">
                                    &ldquo;{rev.comment || 'Great collaboration!'}&rdquo;
                                </p>
                            </div>
                        );
                    })
                )}
            </div> */}

            {/* Delete Confirm Modal */}
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
