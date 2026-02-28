'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiSearch, FiSliders } from 'react-icons/fi';
import WorkerFilterModal from '@/Components/WorkerFilterModal';
import '@/css/worker.css';

export default function BrowseJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [myApplications, setMyApplications] = useState([]);
    const [applyingJobId, setApplyingJobId] = useState(null);

    // Filter state mapped to schema
    const [filters, setFilters] = useState({
        category: 'all',
        budget: 0,
        location_type: 'all',
        urgency: 'all'
    });

    useEffect(() => {
        fetchJobs();
    }, [filters, searchTerm]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Build Base Query
            let jobsQuery = supabase
                .from('jobs')
                .select(`
                    id, title, category, budget_min, budget_max, location_type, city, urgency, created_at, status, hirer_id,
                    profiles!jobs_hirer_id_fkey (id, first_name, last_name, is_deleted)
                `)
                .eq('status', 'active')
                .neq('hirer_id', user.id)
                .eq('profiles.is_deleted', false); // Only show jobs from active users

            // 2. Apply Filters (Server-Side)
            if (filters.category !== 'all') {
                jobsQuery = jobsQuery.eq('category', filters.category);
            }
            if (filters.location_type !== 'all') {
                jobsQuery = jobsQuery.eq('location_type', filters.location_type);
            }
            if (filters.urgency !== 'all') {
                jobsQuery = jobsQuery.eq('urgency', filters.urgency);
            }
            if (filters.budget > 0) {
                // Show jobs where max budget is at least the requested min, or max is null (negotiable)
                jobsQuery = jobsQuery.or(`budget_max.gte.${filters.budget},budget_max.is.null`);
            }

            // 3. Search Term (Title or Description)
            if (searchTerm) {
                jobsQuery = jobsQuery.ilike('title', `%${searchTerm}%`);
            }

            // 4. Personalized Location Logic (Keep and combine with filters)
            const { data: profileData } = await supabase.from('profiles').select('city').eq('id', user.id).single();
            if (profileData?.city && filters.location_type === 'all') {
                // If no specific location type filter, prioritize local/remote
                jobsQuery = jobsQuery.or(`location_type.eq.remote,and(location_type.eq.onsite,city.ilike.%${profileData.city}%)`);
            }

            const { data, error } = await jobsQuery.order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);

            // Fetch my applications
            const { data: appsData } = await supabase
                .from('applications')
                .select('job_id')
                .eq('worker_id', user.id);
            if (appsData) {
                setMyApplications(appsData.map(a => a.job_id));
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (job) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to apply");
                return;
            }

            if (myApplications.includes(job.id)) {
                alert("You have already applied for this job.");
                return;
            }

            setApplyingJobId(job.id);

            const { error: applyError } = await supabase.from('applications').insert([{
                job_id: job.id,
                worker_id: user.id,
                status: 'pending'
            }]);

            if (applyError) {
                console.error('Apply error:', applyError);
                if (applyError.message.includes('duplicate key value')) {
                    alert('You have already applied for this job.');
                    setMyApplications(prev => [...prev, job.id]);
                } else {
                    alert('Failed to apply: ' + applyError.message);
                }
            } else {
                setMyApplications(prev => [...prev, job.id]);
                alert('Application submitted successfully!');
            }
        } catch (err) {
            console.error('Error applying to job:', err);
        } finally {
            setApplyingJobId(null);
        }
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
    };

    // Results are now filtered at the database level for efficiency
    const filteredJobs = jobs; // Keeping variable name to avoid refactoring JSX components below

    // Formatting Helpers
    const formatTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const formatBudget = (min, max) => {
        if (!min && !max) return 'Negotiable';
        if (min && !max) return `₹${min.toLocaleString()}+/hr`;
        if (!min && max) return `Up to ₹${max.toLocaleString()}/hr`;
        if (min === max) return `₹${min.toLocaleString()} Fixed`;
        return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/hr`;
    };

    return (
        <div className="browse-container">
            {/* Header Area */}
            <div className="browse-header">
                <h1>Browse Jobs</h1>
                <p>Find Your Next Big Opportunity.</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="search-filter-row">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search Roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="filter-trigger-btn" onClick={() => setIsFilterModalOpen(true)}>
                    <FiSliders size={20} />
                </button>
            </div>

            {/* Quick Filter Pills (Horizontal Scroll) */}
            <div className="quick-filters-scroll">
                <button
                    className={`quick-pill ${filters.location_type === 'remote' ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, location_type: filters.location_type === 'remote' ? 'all' : 'remote' })}
                >
                    Remote
                </button>
                <button
                    className={`quick-pill ${filters.urgency === 'immediate' ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, urgency: filters.urgency === 'immediate' ? 'all' : 'immediate' })}
                >
                    Immediate
                </button>
                <button
                    className={`quick-pill ${filters.category === 'development' ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, category: filters.category === 'development' ? 'all' : 'development' })}
                >
                    Development
                </button>
                <button
                    className={`quick-pill ${filters.category === 'design' ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, category: filters.category === 'design' ? 'all' : 'design' })}
                >
                    Design
                </button>
            </div>

            {/* Job Listings */}
            <div className="job-list-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading jobs...</div>
                ) : filteredJobs.length === 0 ? (
                    <div className="no-results">No jobs found matching your criteria.</div>
                ) : (
                    filteredJobs.map(job => (
                        <div key={job.id} className="browse-job-card">
                            <div className="bjc-header">
                                <div className="bjc-titles">
                                    <h3>{job.title}</h3>
                                    <span className="bjc-company">
                                        {job.profiles?.first_name || ''} {job.profiles?.last_name || ''}
                                    </span>
                                </div>
                                {/* <button className="save-bookmark-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </button> */}
                            </div>

                            <div className="bjc-details-grid">
                                <div className="bjc-detail-item">
                                    <strong>Stipend:</strong> {formatBudget(job.budget_min, job.budget_max)}
                                </div>
                                <div className="bjc-detail-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    {job.city || 'Remote'}
                                </div>
                                <div className="bjc-detail-item time-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatTimeAgo(job.created_at)}
                                </div>
                            </div>

                            <div className="bjc-tags">
                                <span className="bjc-tag">{job.category?.toUpperCase() || 'GENERAL'}</span>
                                <span className="bjc-tag">{job.location_type?.toUpperCase() || 'OPEN'}</span>
                            </div>

                            <div className="bjc-actions">
                                <button className="bjc-btn-secondary" onClick={() => router.push(`/worker/browse/detail/?id=${job.id}`)}>
                                    View Details
                                </button>
                                {myApplications.includes(job.id) ? (
                                    <button
                                        className="bjc-btn-primary applied"
                                        disabled
                                        style={{ backgroundColor: '#e2e8f0', color: '#64748b', cursor: 'not-allowed', border: 'none' }}
                                    >
                                        Applied
                                    </button>
                                ) : (
                                    <button
                                        className="bjc-btn-primary"
                                        onClick={() => handleApply(job)}
                                        disabled={applyingJobId === job.id}
                                    >
                                        {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Filter Modal */}
            <WorkerFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={handleApplyFilters}
            />
        </div>
    );
}
