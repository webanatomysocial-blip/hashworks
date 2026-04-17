'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiXCircle, FiSend, FiBriefcase, FiChevronRight, FiClock } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";

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

    if (loading) return <HashLoader text="" />;

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
        <div className="wh-dashboard" style={{ minHeight: '100vh', paddingBottom: '40px', position: 'relative' }}>
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

            <PageContainer>
                <div style={{ padding: '20px 16px' }}>
                    <div className="hw-mb-32">
                        <Button variant="ghost" onClick={() => router.push('/worker')} style={{ marginBottom: '16px', padding: '0', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                            <FiArrowLeft size={16} /> <span style={{ fontSize: '14px', fontWeight: 600 }}>Back to Dashboard</span>
                        </Button>
                        <h1 className="text-display-xl" style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FiSend size={32} style={{ color: '#1C4DFF' }} /> My Applications
                        </h1>
                        <p className="text-body-md" style={{ color: '#64748B', marginTop: '8px' }}>
                            Track the status of the gigs you've applied to.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {applications.length === 0 ? (
                             <Card variant="border" padding="xl" className="hw-text-center">
                                 <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B' }}>
                                     <FiBriefcase size={24} />
                                 </div>
                                 <h3 className="text-title-md">No applications yet</h3>
                                 <p className="text-body-md">You haven't applied to any gigs yet.</p>
                             </Card>
                        ) : (
                            applications.map(app => (
                                <Card 
                                    key={app.id} 
                                    variant="elevated" 
                                    padding="lg" 
                                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                >
                                    <div className="hw-flex hw-items-start hw-justify-between hw-gap-16">
                                        <div style={{ flex: 1 }}>
                                            <div className="hw-flex hw-justify-between hw-items-start hw-mb-4">
                                                <h4 className="text-title-md" style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>
                                                    {app.jobs?.title || 'Untitled Role'}
                                                </h4>
                                                <Badge variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'urgent' : 'waiting'}>
                                                    {getStatusText(app.status).toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-body-md" style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                                                Hirer: <span style={{ color: '#1C4DFF', fontWeight: 700 }}>{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''}</span>
                                                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                                                <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{app.jobs?.budget ? app.jobs.budget.toLocaleString() : 'N/A'}</span>
                                            </p>
                                            <div className="hw-flex hw-items-center hw-justify-between">
                                                <span className="text-label-sm hw-flex hw-items-center hw-gap-4" style={{ color: '#94a3b8' }}>
                                                    <FiClock size={14} /> Applied on {formatDate(app.created_at)}
                                                </span>
                                                {app.status === 'pending' && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleWithdraw(app.id)} style={{ color: '#ef4444' }}>
                                                        <FiXCircle size={14} /> Withdraw
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
