"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiMessageCircle, FiMoreVertical, FiXCircle, FiActivity, FiBriefcase } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";
import ActiveTaskBanner from "@/Components/common/ActiveTaskBanner";

export default function ActiveGigsPage() {
    const router = useRouter();
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
                    console.log('ActiveGigs: Data:', data);
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
        <div className="wh-dashboard" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <PageContainer>
                <div style={{ padding: '20px 16px' }}>
                    <div className="hw-mb-32">
                        <Button variant="ghost" onClick={() => router.push('/worker')} style={{ marginBottom: '16px', padding: '0', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                            <FiArrowLeft size={16} /> <span style={{ fontSize: '14px', fontWeight: 600 }}>Back to Dashboard</span>
                        </Button>
                        <h1 className="text-display-xl" style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FiActivity size={32} style={{ color: '#16A34A' }} /> All Active Gigs
                        </h1>
                        <p className="text-body-md" style={{ color: '#64748B', marginTop: '8px' }}>
                            Manage your currently ongoing projects and communicate with hirers.
                        </p>
                    </div>

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
                                <ActiveTaskBanner 
                                    key={contract.id} 
                                    contract={contract} 
                                    role="worker" 
                                    onClick={() => router.push(`/messages?contract=${contract.id}`)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
