'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiXCircle, FiBriefcase, FiClock, FiSearch } from 'react-icons/fi';

export default function MyApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
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

    const getStatusText = (status) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Not Selected';
            default: return 'Under Review';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filteredApplications = applications.filter(app => {
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchesSearch = 
            (app.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.jobs?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.jobs?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesStatus && matchesSearch;
    });

    if (loading) return <HashLoader text="" />;

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px', position: 'relative' }}>
            <SectionHeader title="My Applications" />
            
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
                <div style={{ padding: '24px 20px' }}>
                    
                    {/* Search & Filter Row */}
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                className="hw-input"
                                placeholder="Search by job title or hirer name..."
                                style={{ paddingLeft: '48px', height: '52px', borderRadius: '16px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="hw-urgent-scroll" style={{ padding: '4px 0' }}>
                            {[
                                { val: 'all', label: 'All' }, 
                                { val: 'pending', label: 'Under Review' }, 
                                { val: 'accepted', label: 'Accepted' }, 
                                { val: 'rejected', label: 'Not Selected' }
                            ].map((s) => (
                                <Button
                                    key={s.val}
                                    variant={statusFilter === s.val ? "primary" : "ghost"}
                                    size="sm"
                                    className="hw-font-bold"
                                    onClick={() => setStatusFilter(s.val)}
                                    style={{ borderRadius: '12px', minWidth: '100px', whiteSpace: 'nowrap' }}
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <p className="text-body-md" style={{ color: '#64748B', margin: 0 }}>
                            {statusFilter === 'all' 
                                ? `You have applied to ${filteredApplications.length} gigs total.` 
                                : `Showing ${filteredApplications.length} applications ${statusFilter === 'pending' ? 'under review' : statusFilter === 'accepted' ? 'accepted' : 'not selected'}.`
                            }
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredApplications.length === 0 ? (
                            <Card variant="border" padding="xl" className="hw-text-center" style={{ borderRadius: '24px', borderStyle: 'dashed' }}>
                                <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B' }}>
                                    <FiBriefcase size={24} />
                                </div>
                                <h3 className="text-title-md">No applications found</h3>
                                <p className="text-body-md">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? "Try adjusting your search or filters." 
                                        : "You haven't applied to any gigs yet."
                                    }
                                </p>
                                {(searchTerm || statusFilter !== 'all') && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} style={{ marginTop: '12px' }}>
                                        Reset Filters
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            filteredApplications.map(app => (
                                <Card 
                                    key={app.id} 
                                    variant="elevated" 
                                    padding="lg" 
                                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.02)' }}
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
