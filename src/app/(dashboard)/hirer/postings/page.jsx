'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    FiPlus, FiInfo, FiSearch, FiMapPin, FiCalendar,
    FiUsers, FiEye, FiMoreVertical, FiEdit2, FiTrash2, FiArrowLeft, FiXCircle, FiPlayCircle
} from 'react-icons/fi';
import { BsBriefcase } from 'react-icons/bs';
import ConfirmModal from '@/Components/ConfirmModal';
import '@/css/hirer.css';
import { useRouter } from 'next/navigation';


export default function ManagePostings() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active');
    const [openDropdownId, setOpenDropdownId] = useState(null);

    /* Post Job Modal State */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState(null);

    /* Delete Modal State */
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Jobs
            const { data: jobsData } = await supabase
                .from('jobs')
                .select('*')
                .eq('hirer_id', user.id)
                .order('created_at', { ascending: false });

            const allJobs = jobsData || [];
            setJobs(allJobs);

            // Fetch Applications count for these jobs
            if (allJobs.length > 0) {
                const jobIds = allJobs.map(j => j.id);
                const { data: appsData } = await supabase
                    .from('applications')
                    .select('job_id')
                    .in('job_id', jobIds);
                setApplications(appsData || []);
            }
        } catch (err) {
            console.error('Error fetching postings:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Click outside listener for dropdown
        const handleClickOutside = () => setOpenDropdownId(null);
        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [fetchData]);

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const toggleDropdown = (e, jobId) => {
        e.stopPropagation(); // Prevent immediate closing
        setOpenDropdownId(openDropdownId === jobId ? null : jobId);
    };

    const handleEdit = (job) => {
        setOpenDropdownId(null);
        router.push(`/hirer/postings/edit/?id=${job.id}`);
    };

    const promptDelete = (job) => {
        setJobToDelete(job);
        setIsDeleteModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = async () => {
        if (!jobToDelete) return;
        try {
            const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);
            if (error) throw error;
            await fetchData();
            setIsDeleteModalOpen(false);
            setJobToDelete(null);
        } catch (err) {
            console.error('Error deleting job:', err);
            alert('Failed to delete job.');
        }
    };

    const updateJobStatus = async (jobId, newStatus) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: newStatus })
                .eq('id', jobId);

            if (error) throw error;
            await fetchData();
            setOpenDropdownId(null);
        } catch (err) {
            console.error('Error updating job status:', err);
            alert(`Failed to ${newStatus === 'closed' ? 'close' : 'open'} job.`);
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab =
            activeTab === 'All' ? true :
                activeTab === 'Active' ? job.status === 'active' :
                    activeTab === 'Closed' ? job.status === 'closed' :
                        activeTab === 'Drafts' ? job.status === 'draft' : true;
        return matchesSearch && matchesTab;
    });

    if (loading) return <div className="loading-state">Loading postings...</div>;

    return (
        <div className="hirer-dashboard">
            <header className="fp-header">
                <button className="fp-back-btn" onClick={() => router.push('/hirer')}>
                    <FiArrowLeft />
                </button>
                <div className="mp-title-block">
                    <h1 className="mp-title">Manage Postings</h1>
                    <p className="mp-subtitle">Track Your Listings And Applications In Real-Time.</p>
                </div>
            </header>

            {/* Cancellation Policy Alert */}
            <div className="mp-info-alert">
                <FiInfo className="mp-info-icon" />
                <div className="mp-info-content">
                    <span className="mp-info-title">Cancellation Policy</span>
                    <p className="mp-info-p">
                        Free cancellation for all postings before a hire is accepted.
                        Penalty apply only for accepted project cancellations.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mp-search-container">
                <FiSearch className="mp-search-icon" />
                <input
                    type="text"
                    className="mp-search-input"
                    placeholder="Search Your Postings..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {/* Tabs */}
            <div className="mp-tabs">
                {['Active', 'Closed', 'Drafts', 'All'].map(tab => (
                    <button
                        key={tab}
                        className={`mp-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Postings List */}
            <div className="mp-postings-list">
                {filteredJobs.length === 0 ? (
                    <div className="hd-empty">No postings found.</div>
                ) : (
                    filteredJobs.map(job => {
                        const appCount = applications.filter(a => a.job_id === job.id).length;
                        return (
                            <div key={job.id} className="mp-job-card">
                                <div className="mp-job-top">
                                    <div style={{ flex: 1 }}>
                                        <h3 className="mp-job-title">{job.title}</h3>
                                        <div className="mp-job-badges">
                                            <span className={`hd-status-badge ${job.status}`}>
                                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="mp-kebab"
                                        title="Options"
                                        onClick={(e) => toggleDropdown(e, job.id)}
                                    >
                                        <FiMoreVertical />
                                    </button>

                                    {openDropdownId === job.id && (
                                        <div className="mp-dropdown">
                                            <button
                                                className="mp-dropdown-item"
                                                onClick={() => handleEdit(job)}
                                            >
                                                <FiEdit2 /> Edit Job
                                            </button>
                                            {job.status === 'active' && (
                                                <button
                                                    className="mp-dropdown-item close"
                                                    onClick={() => updateJobStatus(job.id, 'closed')}
                                                >
                                                    <FiXCircle /> Close Job
                                                </button>
                                            )}
                                            {job.status === 'closed' && (
                                                <button
                                                    className="mp-dropdown-item open"
                                                    onClick={() => updateJobStatus(job.id, 'active')}
                                                >
                                                    <FiPlayCircle /> Open Job
                                                </button>
                                            )}
                                            <button
                                                className="mp-dropdown-item delete"
                                                onClick={() => promptDelete(job)}
                                            >
                                                <FiTrash2 /> Delete Job
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mp-job-loc-date">
                                    <span className="mp-icon-text">
                                        <FiMapPin /> {job.city || (job.location_type === 'remote' ? 'Remote' : 'Various')}
                                    </span>
                                    <span className="mp-icon-text">
                                        <FiCalendar /> {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="mp-metrics-row">
                                    <div className="mp-metric">
                                        <span className="mp-metric-label">Applicants</span>
                                        <span className="mp-metric-value">
                                            <FiUsers className="mp-metric-icon" /> {appCount}
                                        </span>
                                    </div>
                                    <div className="mp-metric">
                                        <span className="mp-metric-label">Role Type</span>
                                        <span className="mp-metric-value">
                                            <BsBriefcase className="mp-metric-icon" /> {job.role_type || 'Gig'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mp-job-bottom">
                                    <div className="mp-budget">
                                        {job.budget_min ? `₹${job.budget_min.toLocaleString()} - ₹${job.budget_max?.toLocaleString()} /hr` : 'Budget Not Specified'}
                                    </div>
                                    <Link href={`/hirer/postings/review/?id=${job.id}`} className="mp-review-btn">
                                        Review Applicants
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Job Posting?"
                message="Are you sure you want to delete this job? This action cannot be undone and all pending applications will be lost."
            />
        </div>
    );
}
