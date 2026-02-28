'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiChevronLeft, FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';
import '@/css/worker.css';

export default function JobDetailsClient({ jobId }) {
    const router = useRouter();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        async function fetchJobDetails() {
            if (!jobId) return;
            setLoading(true);

            try {
                const { data: { user } } = await supabase.auth.getUser();

                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*, profiles!jobs_hirer_id_fkey(first_name, last_name, bio)')
                    .eq('id', jobId)
                    .single();

                if (jobError) throw jobError;
                setJob(jobData);

                if (user) {
                    const { data: appData } = await supabase
                        .from('applications')
                        .select('id')
                        .eq('job_id', jobId)
                        .eq('worker_id', user.id)
                        .maybeSingle();

                    if (appData) setHasApplied(true);
                }

            } catch (error) {
                console.error('Error fetching job details:', error);
                showToast('Failed to load job details.', 'error');
            } finally {
                setLoading(false);
            }
        }

        fetchJobDetails();
    }, [jobId]);

    const handleApply = async () => {
        setApplying(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast("Please log in to apply", 'error');
                return;
            }

            if (job.hirer_id === user.id) {
                showToast("You can't apply to your own job listing.", "error");
                return;
            }

            // Profile Completeness Check
            const { data: prof } = await supabase.from('profiles').select('bio').eq('id', user.id).single();
            const { count: skillCount } = await supabase.from('worker_skills').select('*', { count: 'exact', head: true }).eq('worker_id', user.id);

            if (!prof?.bio || skillCount === 0) {
                showToast("Please complete your profile (Bio & Skills) before applying.", "error");
                router.push('/worker/profile');
                return;
            }

            const { error: applyError } = await supabase.from('applications').insert([{
                job_id: job.id,
                worker_id: user.id,
                status: 'pending'
            }]);

            if (applyError) {
                if (applyError.message.includes('duplicate key value')) {
                    showToast('You have already applied for this job.', 'error');
                    setHasApplied(true);
                } else {
                    showToast('Failed to apply: ' + applyError.message, 'error');
                }
            } else {
                setHasApplied(true);
                showToast('Application submitted successfully!', 'success');
            }
        } catch (err) {
            console.error('Error applying to job:', err);
            showToast('An error occurred while applying.', 'error');
        } finally {
            setApplying(false);
        }
    };

    const formatBudget = (min, max) => {
        if (!min && !max) return 'Negotiable';
        if (min && !max) return `₹${min.toLocaleString()}+/hr`;
        if (!min && max) return `Up to ₹${max.toLocaleString()}/hr`;
        if (min === max) return `₹${min.toLocaleString()} Fixed`;
        return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}/hr`;
    };

    if (loading) return <div className="worker-loading">Loading Job Details...</div>;
    if (!job) return <div className="worker-dashboard-new" style={{ padding: '40px', textAlign: 'center' }}>Job not found</div>;

    const isOwnJob = false; // Add logic if needed

    return (
        <div className="worker-dashboard-new" style={{ minHeight: '100vh', paddingBottom: '40px', position: 'relative' }}>
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

            <div className="section-header-new" style={{ padding: '24px 20px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '15px' }}
                >
                    <FiChevronLeft size={20} /> Back
                </button>
            </div>

            <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{job.title}</h1>
                            <p style={{ fontSize: '16px', color: '#64748b' }}>
                                Posted by <span style={{ color: '#0f172a', fontWeight: '500' }}>{job.profiles?.first_name} {job.profiles?.last_name || ''}</span>
                                <button
                                    onClick={() => router.push(`/profile/${job.hirer_id}`)}
                                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginLeft: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    View Hirer Profile
                                </button>
                            </p>
                        </div>
                        <button
                            className={`apply-btn-new ${hasApplied ? 'applied' : ''} ${isOwnJob ? 'own-job' : ''}`}
                            onClick={handleApply}
                            disabled={hasApplied || applying || isOwnJob}
                            style={{ minWidth: '140px' }}
                        >
                            {isOwnJob ? 'Your Listing' : applying ? 'Applying…' : hasApplied ? 'Applied' : 'Apply Now'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                            <FiDollarSign size={18} style={{ color: '#0f172a' }} />
                            <span style={{ fontWeight: '500' }}>{formatBudget(job.budget_min, job.budget_max)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                            <FiMapPin size={18} style={{ color: '#0f172a' }} />
                            <span>{job.location_type === 'remote' ? 'Remote' : job.city || 'On-site'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                            <FiClock size={18} style={{ color: '#0f172a' }} />
                            <span style={{ textTransform: 'capitalize' }}>{job.urgency || 'Standard'}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>Job Description</h3>
                        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                            {job.description || 'No detailed description provided.'}
                        </p>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>Requirements</h3>
                        <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                            {job.requirements || 'No specific requirements listed.'}
                        </p>
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {job.category && (
                            <span style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '100px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                {job.category}
                            </span>
                        )}
                        {job.location_type && (
                            <span style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '100px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                {job.location_type}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
