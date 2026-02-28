'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiChevronLeft } from 'react-icons/fi';
import '@/css/worker.css';

export default function ActiveGigsPage() {
    const router = useRouter();
    const [acceptedApps, setAcceptedApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAcceptedGigs() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from('applications')
                    .select('*, jobs(title, budget, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                    .eq('worker_id', user.id)
                    .eq('status', 'accepted')
                    .order('created_at', { ascending: false });

                setAcceptedApps(data || []);
            } catch (err) {
                console.error('Error fetching active gigs:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAcceptedGigs();
    }, []);

    if (loading) return <div className="worker-loading">Loading Active Gigs...</div>;

    return (
        <div className="worker-dashboard-new" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="section-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    <h1 className="section-title-new" style={{ fontSize: '24px' }}>All Active Gigs</h1>
                </div>

                <div className="active-gigs-list">
                    {acceptedApps.length === 0 ? (
                        <div className="empty-state-new">You don't have any accepted active gigs yet.</div>
                    ) : (
                        acceptedApps.map(app => (
                            <div key={app.id} className="active-gig-card" style={{ marginBottom: '16px' }}>
                                <div className="gig-header">
                                    <div>
                                        <h3 className="gig-title" style={{ fontSize: '18px', marginBottom: '4px' }}>{app.jobs?.title || 'Unknown Gig'}</h3>
                                        <p className="gig-company" style={{ fontSize: '14px' }}>{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''}</p>
                                    </div>
                                    <span className="timeline-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontSize: '12px', padding: '6px 12px' }}>Accepted</span>
                                </div>

                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                        ₹{app.jobs?.budget ? app.jobs.budget.toLocaleString() : 'N/A'}
                                    </div>
                                    <div className="gig-progress-labels" style={{ margin: 0 }}>
                                        <span style={{ color: '#059669', fontWeight: '600', fontSize: '14px' }}>Ready to Work</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
