import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiChevronLeft, FiMessageCircle, FiMoreVertical, FiXCircle } from 'react-icons/fi';
import ChatModal from '@/Components/ChatModal';
import '@/css/worker.css';

export default function ActiveGigsPage() {
    const router = useRouter();
    const [acceptedApps, setAcceptedApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    // Chat State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, contractId: null, otherUserName: '' });

    useEffect(() => {
        async function fetchAcceptedGigs() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                const { data } = await supabase
                    .from('contracts')
                    .select(`
                        *,
                        jobs(
                            title, 
                            budget, 
                            profiles!jobs_hirer_id_fkey(first_name, last_name)
                        ),
                        hirer:profiles!contracts_hirer_id_fkey(first_name, last_name)
                    `)
                    .eq('worker_id', user.id)
                    .eq('status', 'active')
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

    const openChat = (contract) => {
        const hirer = contract.hirer || contract.jobs?.profiles;
        const name = hirer ? `${hirer.first_name} ${hirer.last_name || ''}` : 'Hirer';
        setChatConfig({
            isOpen: true,
            contractId: contract.id,
            otherUserName: name
        });
    };

    const handleCancelContract = async (contractId, jobId) => {
        if (!confirm('Are you sure you want to cancel this contract?')) return;
        try {
            const { error: contractErr } = await supabase
                .from('contracts')
                .update({ status: 'cancelled' })
                .eq('id', contractId);
            if (contractErr) throw contractErr;

            await supabase
                .from('jobs')
                .update({ status: 'active' })
                .eq('id', jobId);

            setAcceptedApps(prev => prev.filter(c => c.id !== contractId));
            setActiveMenuId(null);
        } catch (err) {
            console.error('Error cancelling contract:', err);
            alert('Failed to cancel contract: ' + err.message);
        }
    };

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
                        acceptedApps.map(contract => (
                            <div key={contract.id} className="active-gig-card" style={{ marginBottom: '16px' }}>
                                <div className="gig-header" style={{ position: 'relative' }}>
                                    <div>
                                        <h3 className="gig-title" style={{ fontSize: '18px', marginBottom: '4px' }}>{contract.jobs?.title || 'Unknown Gig'}</h3>
                                        <p className="gig-company" style={{ fontSize: '14px' }}>
                                            {contract.hirer?.first_name || contract.jobs?.profiles?.first_name} {contract.hirer?.last_name || contract.jobs?.profiles?.last_name || ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="timeline-badge" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0', fontSize: '12px', padding: '6px 12px' }}>Active</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === contract.id ? null : contract.id);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <FiMoreVertical size={18} />
                                        </button>

                                        {activeMenuId === contract.id && (
                                            <div 
                                                className="hd-dropdown-menu"
                                                style={{ 
                                                    position: 'absolute', 
                                                    top: '100%', 
                                                    right: '0', 
                                                    background: '#fff', 
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                                                    borderRadius: '8px', 
                                                    padding: '8px', 
                                                    zIndex: 10,
                                                    minWidth: '150px',
                                                    border: '1px solid #f1f5f9'
                                                }}
                                            >
                                                <button 
                                                    onClick={() => handleCancelContract(contract.id, contract.job_id)}
                                                    style={{ 
                                                        width: '100%', 
                                                        textAlign: 'left', 
                                                        padding: '8px 12px', 
                                                        background: 'none', 
                                                        border: 'none', 
                                                        color: '#ef4444', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '8px', 
                                                        fontSize: '13px', 
                                                        fontWeight: '500', 
                                                        cursor: 'pointer',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <FiXCircle size={14} /> Cancel Contract
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                        ₹{contract.agreed_amount ? contract.agreed_amount.toLocaleString() : (contract.jobs?.budget ? contract.jobs.budget.toLocaleString() : 'N/A')}
                                    </div>
                                    <button
                                        onClick={() => openChat(contract)}
                                        style={{ 
                                            padding: '8px 16px', 
                                            borderRadius: '10px', 
                                            background: '#0f172a', 
                                            color: '#fff', 
                                            border: 'none', 
                                            fontSize: '13px', 
                                            fontWeight: '600', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <FiMessageCircle size={16} /> Chat
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ChatModal
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig({ ...chatConfig, isOpen: false })}
                contractId={chatConfig.contractId}
                currentUserId={currentUser?.id}
                otherUserName={chatConfig.otherUserName}
            />
        </div>
    );
}
