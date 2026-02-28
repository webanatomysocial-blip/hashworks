'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiChevronLeft, FiXCircle } from 'react-icons/fi';
import '@/css/worker.css';

export default function MyApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        async function fetchApplications() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('applications')
                    .select('*, jobs(*, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                    .eq('worker_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching applications data:', error);
                }

                setApplications(data || []);
            } catch (err) {
                console.error('Error in fetchApplications:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchApplications();
    }, []);

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
                setApplications(prev => prev.filter(app => app.id !== applicationId));
                showToast('Application withdrawn successfully.', 'success');
            }
        } catch (err) {
            console.error('Error withdrawing application:', err);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    if (loading) return <div className="worker-loading">Loading Applications...</div>;

    const getStatusText = (status) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Not Selected';
            default: return 'Under Review';
        }
    };

    const getBadgeStyle = (status) => {
        switch (status) {
            case 'accepted': return { background: '#ecfdf5', color: '#059669', border: '1px solid #10b981' };
            case 'rejected': return { background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444' };
            default: return { background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

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
                    onClick={() => router.push('/worker')}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '15px' }}
                >
                    <FiChevronLeft size={20} /> Dashboard
                </button>
            </div>

            <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
                <div className="section-title-wrap" style={{ marginBottom: '24px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    <h1 className="section-title-new" style={{ fontSize: '24px' }}>My Applications</h1>
                </div>

                <div className="applications-list-new" style={{ gap: '16px' }}>
                    {applications.length === 0 ? (
                        <div className="empty-state-new">You haven't applied to any gigs yet.</div>
                    ) : (
                        applications.map(app => (
                            <div key={app.id} className="app-card-new" style={{ padding: '20px', border: '1px solid #f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#fff', gap: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                                    <div className="app-card-icon" style={{ flexShrink: 0 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 className="app-title-new" style={{ fontSize: '17px', marginBottom: '6px' }}>{app.jobs?.title || 'Untitled Role'}</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', color: '#64748b', fontSize: '13px' }}>
                                            <span>{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''}</span>
                                            <span>•</span>
                                            <span style={{ color: '#000', fontWeight: '500' }}>₹{app.jobs?.budget ? app.jobs.budget.toLocaleString() : 'N/A'}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                                            Applied on {formatDate(app.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                                    <div style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        ...getBadgeStyle(app.status)
                                    }}>
                                        {getStatusText(app.status)}
                                    </div>
                                    {app.status === 'pending' && (
                                        <button
                                            onClick={() => handleWithdraw(app.id)}
                                            style={{
                                                background: 'none', border: 'none', color: '#ef4444', fontSize: '12px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px'
                                            }}
                                        >
                                            <FiXCircle size={14} /> Withdraw
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
