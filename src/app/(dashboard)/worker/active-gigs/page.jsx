"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiBriefcase } from 'react-icons/fi';
import { useToast } from '@/context/ToastContext';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { TaskCard } from "@/Components/ui/TaskCard";
import SectionHeader from "@/Components/common/SectionHeader";

export default function ActiveGigsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [acceptedApps, setAcceptedApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    useEffect(() => {
        async function fetchAcceptedGigs() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                const { data, error: fetchError } = await supabase
                    .from('contracts')
                    .select(`
                        *,
                        jobs(
                            title, 
                            budget_max, 
                            profiles!jobs_hirer_id_fkey(first_name, last_name)
                        ),
                        hirer:profiles!contracts_hirer_id_fkey(first_name, last_name)
                    `)
                    .eq('worker_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (fetchError) {
                    console.error('ActiveGigs: Error fetching active gigs:', fetchError);
                } else {
                    setAcceptedApps(data || []);
                }
            } catch (err) {
                console.error('Error fetching active gigs:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAcceptedGigs();
    }, []);

    const openChat = (contract) => {
        router.push(`/messages?contract=${contract.id}`);
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

    if (loading) return <HashLoader text="" />;

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
            <SectionHeader title="Active Gigs" />

            <PageContainer>
                <div style={{ padding: '24px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {acceptedApps.length === 0 ? (
                            <Card variant="border" padding="xl" className="hw-text-center">
                                 <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B' }}>
                                     <FiBriefcase size={24} />
                                 </div>
                                 <h3 className="text-title-md">No active gigs.</h3>
                                 <p className="text-body-md">You don't have any accepted ongoing gigs at the moment.</p>
                            </Card>
                        ) : (
                            acceptedApps.map(contract => (
                                <TaskCard 
                                    key={contract.id} 
                                    topTitleLabel="ACTIVE TASK"
                                    title={contract.jobs?.title || 'Ongoing Task'}
                                    thumbnailUrl={contract.jobs?.reference_image_url}
                                    badge={{ 
                                        text: contract.status.toUpperCase(), 
                                        bg: '#DCFCE7', 
                                        color: '#16A34A' 
                                    }}
                                    metrics={[
                                        { label: 'EARN', value: contract.agreed_amount ? `₹${contract.agreed_amount.toLocaleString()}` : (contract.jobs?.budget_max ? `₹${contract.jobs.budget_max.toLocaleString()}` : "Market Rate") },
                                        { label: 'HIRER', value: contract.hirer ? `${contract.hirer.first_name} ${contract.hirer.last_name || ''}` : "Pro" }
                                    ]}
                                    actionButtons={
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/worker/workercontract?id=${contract.id}`);
                                            }}
                                            style={{ flex: 1, background: 'var(--hw-primary)', color: '#fff', border: 'none', borderRadius: '22px', height: '48px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' }}
                                        >
                                            View Details
                                        </button>
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
