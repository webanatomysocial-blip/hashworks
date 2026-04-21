'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from '@/Components/layouts/PageContainer';
import SectionHeader from '@/Components/common/SectionHeader';
import { TaskCard } from '@/Components/ui/TaskCard';
import { FiBriefcase } from 'react-icons/fi';
import { Button } from '@/Components/ui/Button';
import "@/css/dashboard.css";

export default function PortfolioView({ role = 'worker', userId = null }) {
    const router = useRouter();
    const [pastWorks, setPastWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ownerName, setOwnerName] = useState('');

    useEffect(() => {
        async function fetchPastWorks() {
            setLoading(true);
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const targetId = userId || authUser?.id;

                if (!targetId) { 
                    if (!authUser) router.push('/auth/login');
                    return; 
                }

                // If viewing someone else, fetch their name for the title
                if (userId && userId !== authUser?.id) {
                    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', userId).single();
                    if (prof) setOwnerName(`${prof.first_name}'s `);
                }

                let query = supabase
                    .from('past_works')
                    .select(`
                        *,
                        worker:profiles!past_works_worker_id_fkey(first_name, last_name, avatar_url, average_rating),
                        hirer:profiles!past_works_hirer_id_fkey(first_name, last_name, avatar_url, average_rating),
                        jobs(*)
                    `)
                    .order('completed_at', { ascending: false });

                if (role === 'worker') {
                    query = query.eq('worker_id', targetId);
                } else {
                    query = query.eq('hirer_id', targetId);
                }

                const { data, error } = await query;
                if (error) throw error;
                setPastWorks(data || []);
            } catch (err) {
                console.error('Error fetching past works:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchPastWorks();
    }, [role, router]);

    if (loading) return <HashLoader text="" />;

    return (
        <div className="wh-dashboard" style={{ background: 'var(--hw-surface)', minHeight: '100vh', paddingBottom: '60px' }}>
            <SectionHeader title={ownerName ? `${ownerName} History` : (role === 'worker' ? 'Worker Portfolio' : 'Hirer Portfolio')} />
            <PageContainer style={{ paddingTop: '24px' }}>
                <div style={{ padding: '0 16px' }}>

                    {pastWorks.length === 0 ? (
                        <div style={{
                            width: '100%',
                            padding: '60px 20px',
                            border: '2px dashed var(--hw-surface-high)',
                            borderRadius: '24px',
                            textAlign: 'center',
                            marginTop: '20px',
                            background: 'var(--hw-surface-highest)'
                        }}>
                            <p className="para-text" style={{ fontStyle: 'italic', fontWeight: 500 }}>
                                {role === 'worker' ? 'No Completed Stories Yet' : 'No Completed Postings Yet'}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {pastWorks.map(pw => {
                                const partner = role === 'worker' ? pw.hirer : pw.worker;
                                const completionDate = new Date(pw.completed_at).toLocaleDateString([], { month: 'short', year: 'numeric' });
                                
                                return (
                                    <TaskCard 
                                        key={pw.id}
                                        topTitleLabel={`${partner?.first_name || 'Partner'} ${partner?.last_name?.[0] ? partner.last_name[0] + '.' : ''} • ${partner?.average_rating ? '★'+Number(partner.average_rating).toFixed(1) : 'New'}`}
                                        title={pw.title || pw.jobs?.title || 'Untitled Project'}
                                        thumbnailUrl={pw.jobs?.reference_image_url}
                                        thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
                                        badge={{ text: 'COMPLETED', variant: 'success' }}
                                        metrics={[
                                            { label: 'PAYOUT', value: pw.payout ? `₹${pw.payout.toLocaleString()}` : '-', valueColor: '#1C4DFF' },
                                            { label: 'COMPLETED ON', value: completionDate },
                                            { label: 'LOCATION', value: pw.jobs?.city || 'Remote' }
                                        ]}
                                        actionButtons={
                                            <Button 
                                                variant="ghost"
                                                onClick={() => router.push(`/${role}/portfolio/view?id=${pw.id}`)}
                                                style={{ flex: 1, height: '44px', borderRadius: '22px', fontWeight: 500 }}
                                            >
                                                View Details
                                            </Button>
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </PageContainer>
        </div>
    );
}
