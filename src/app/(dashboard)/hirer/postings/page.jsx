'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    FiInfo, FiSearch, FiMoreVertical, FiEdit2, FiTrash2, FiXCircle, FiPlayCircle
} from 'react-icons/fi';
import { BsBriefcase } from 'react-icons/bs';
import { PageContainer } from "@/Components/layouts/PageContainer";
import ConfirmModal from '@/Components/common/ConfirmModal';
import HashLoader from '@/Components/common/HashLoader';
import SectionHeader from '@/Components/common/SectionHeader';
import '@/css/hirer.css';
import { useRouter } from 'next/navigation';
import { TaskCard } from '@/Components/ui/TaskCard';

export default function ManagePostings() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [openDropdownId, setOpenDropdownId] = useState(null);

    /* Delete Modal State */
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Jobs with their active contracts to determine Ongoing status
            const { data: jobsData } = await supabase
                .from('jobs')
                .select(`
                    *,
                    contracts (id, status)
                `)
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
        const activeContract = job.contracts?.find(c => c.status === 'active');
        
        let matchesTab = true;
        if (activeTab === 'All') matchesTab = true;
        else if (activeTab === 'Ongoing') matchesTab = !!activeContract;
        else if (activeTab === 'Active') matchesTab = job.status === 'active' && !activeContract;
        else if (activeTab === 'Closed') matchesTab = job.status === 'closed';

        return matchesSearch && matchesTab;
    });

    if (loading) return <HashLoader text="" />;

    return (
        <div className="hirer-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
            <SectionHeader title="Manage Postings" />

            <PageContainer>
                <div className="wh-detail-scroll-content" style={{ paddingTop: 'var(--hw-space-24)' }}>
                    <div className="mp-info-alert" style={{ marginTop: 0 }}>
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
                        <FiSearch className="mp-search-icon" style={{ flexShrink: 0 }} />
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
                        {['All', 'Ongoing', 'Active', 'Closed'].map(tab => (
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
                            <div className="hd-empty" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--hw-text-secondary)' }}>
                                No postings found.
                            </div>
                        ) : (
                            filteredJobs.map(job => {
                                const appCount = applications.filter(a => a.job_id === job.id).length;
                                return (
                                    <div key={job.id} style={{ marginBottom: '24px' }}>
                                        <TaskCard
                                            topTitleLabel="DATE POSTED"
                                            title={job.title}
                                            thumbnailUrl={job.reference_image_url}
                                            thumbnailFallbackIcon={<BsBriefcase size={28} color="#64748B" />}
                                            badge={{ 
                                                text: job.status === 'active' && activeContract ? 'ONGOING' : job.status.toUpperCase(), 
                                                variant: job.status === 'active' && activeContract ? 'waiting' : job.status === 'active' ? 'success' : job.status === 'closed' ? 'closed' : 'neutral'
                                            }}
                                            metrics={
                                                activeTab === 'Ongoing' ? [
                                                    { label: 'STATUS', value: 'IN PROGRESS', valueColor: '#F59E0B', valueSize: '16px' },
                                                    { label: 'LOCATION', value: job.location_type === 'remote' ? 'Remote' : (job.city || 'Anywhere') },
                                                    { label: 'PAYOUT', value: job.budget_max ? `₹${job.budget_max.toLocaleString()}` : (job.budget_min ? `₹${job.budget_min.toLocaleString()}` : '-') }
                                                ] : [
                                                    { label: 'APPLICANTS', value: appCount.toString(), valueColor: 'var(--hw-primary)', valueSize: '16px' },
                                                    { label: 'LOCATION', value: job.location_type === 'remote' ? 'Remote' : (job.city || 'Anywhere') },
                                                    { label: 'PAYOUT', value: job.budget_max ? `₹${job.budget_max.toLocaleString()}` : (job.budget_min ? `₹${job.budget_min.toLocaleString()}` : '-') }
                                                ]
                                            }
                                            footerMessage={null}
                                            actionButtons={
                                                <div style={{ display: 'flex', gap: '12px', width: '100%', position: 'relative' }}>
                                                    {activeTab === 'Ongoing' && activeContract ? (
                                                        <button 
                                                            onClick={() => router.push(`/hirer/hirercontract?id=${activeContract.id}`)}
                                                            style={{ flex: 1, background: 'var(--hw-primary)', color: '#fff', border: 'none', borderRadius: '22px', height: '48px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                                                        >
                                                            View Contract Action
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => activeContract ? router.push(`/hirer/hirercontract?id=${activeContract.id}`) : router.push(`/hirer/postings/review?id=${job.id}`)}
                                                            style={{ flex: 1, background: 'var(--hw-primary)', color: '#fff', border: 'none', borderRadius: '22px', height: '48px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                                                        >
                                                            {activeContract ? 'View Contract' : 'Review Applicants'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => toggleDropdown(e, job.id)}
                                                        style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--hw-surface-high)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', flexShrink: 0 }}
                                                    >
                                                        <FiMoreVertical size={20} />
                                                    </button>

                                                    {openDropdownId === job.id && (
                                                        <div className="mp-dropdown" style={{ top: '56px', right: '0', zIndex: 100 }}>
                                                            {activeTab !== 'Ongoing' && (
                                                                <>
                                                                    <button className="mp-dropdown-item" onClick={() => handleEdit(job)}>
                                                                        <FiEdit2 /> Edit Job
                                                                    </button>
                                                                    {job.status === 'active' && (
                                                                        <button className="mp-dropdown-item close" onClick={() => updateJobStatus(job.id, 'closed')}>
                                                                            <FiXCircle /> Close Job
                                                                        </button>
                                                                    )}
                                                                    {job.status === 'closed' && (
                                                                        <button className="mp-dropdown-item open" onClick={() => updateJobStatus(job.id, 'active')}>
                                                                            <FiPlayCircle /> Open Job
                                                                        </button>
                                                                    )}
                                                                    <button className="mp-dropdown-item delete" onClick={() => promptDelete(job)}>
                                                                        <FiTrash2 /> Delete Job
                                                                    </button>
                                                                </>
                                                            )}
                                                            {activeTab === 'Ongoing' && (
                                                                <button className="mp-dropdown-item" onClick={() => router.push(`/hirer/hirercontract?id=${activeContract?.id}`)}>
                                                                    <FiInfo /> View Details
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        />
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
            </PageContainer>
        </div>
    );
}
