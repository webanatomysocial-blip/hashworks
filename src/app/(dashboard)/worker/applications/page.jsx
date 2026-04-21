'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiXCircle, FiBriefcase, FiClock, FiSearch } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import SectionHeader from '@/Components/common/SectionHeader';
import { Suspense } from 'react';
import { PageContainer } from '@/Components/layouts/PageContainer';
import { Button } from '@/Components/ui/Button';
import { Card } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import "@/css/worker.css";

function MyApplicationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('tab') || 'all');
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
                    .select('*, jobs!inner(*, profiles!jobs_hirer_id_fkey(first_name, last_name))')
                    .eq('worker_id', user.id)
                    .neq('jobs.status', 'completed')
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
        
        // If no searchTerm, show everything. If there's a searchTerm, check title and names safely.
        const matchesSearch = !searchTerm || (
            (app.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.jobs?.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.jobs?.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
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
                        <div className="mp-search-container" style={{ marginBottom: '16px' }}>
                            <FiSearch className="mp-search-icon" />
                            <input
                                type="text"
                                className="mp-search-input"
                                placeholder="Search by job title or hirer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                    <div className="mp-tabs" style={{ marginBottom: '0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {[
                            { val: 'all', label: 'All' }, 
                            { val: 'pending', label: 'Under Review' }, 
                            { val: 'accepted', label: 'Accepted' }, 
                            { val: 'rejected', label: 'Not Selected' }
                        ].map((s) => (
                            <button
                                key={s.val}
                                className={`mp-tab ${statusFilter === s.val ? 'active' : ''}`}
                                onClick={() => setStatusFilter(s.val)}
                                style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <p className="para-text" style={{ color: '#64748B', margin: 0 }}>
                            {statusFilter === 'all' 
                                ? `You have applied to ${filteredApplications.length} gigs total.` 
                                : `Showing ${filteredApplications.length} applications ${statusFilter === 'pending' ? 'under review' : statusFilter === 'accepted' ? 'accepted' : 'not selected'}.`
                            }
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredApplications.length === 0 ? (
                            <Card variant="elevated" padding="xl" className="hw-text-center" style={{ borderRadius: '24px' }}>
                                <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiBriefcase size={24} />
                                </div>
                                <h3 className="sub-head-text">No applications found</h3>
                                <p className="para-text">
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
                                                <h4 className="sub-head-text" style={{ fontWeight: 500, margin: 0 }}>
                                                    {app.jobs?.title || 'Untitled Role'}
                                                </h4>
                                                <Badge variant={app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'urgent' : 'waiting'}>
                                                    {getStatusText(app.status)}
                                                </Badge>
                                            </div>
                                            <p className="para-text" style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                                                Hirer: <span style={{ color: '#1C4DFF', fontWeight: 500 }}>{app.jobs?.profiles?.first_name} {app.jobs?.profiles?.last_name || ''}</span>
                                                <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                                                <span style={{ fontWeight: 500, color: '#0F172A' }}>₹{app.jobs?.budget ? app.jobs.budget.toLocaleString() : 'N/A'}</span>
                                            </p>
                                            <div className="hw-flex hw-items-center hw-justify-between">
                                                <span className="sub-para-text hw-flex hw-items-center hw-gap-4" style={{ color: '#94a3b8' }}>
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

export default function MyApplicationsPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <MyApplicationsContent />
        </Suspense>
    );
}
