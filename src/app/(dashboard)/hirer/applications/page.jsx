'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";
import HashLoader from "@/Components/common/HashLoader.jsx";
import { FiChevronRight, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function ApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // First get the hirer's jobs
            const { data: jobs } = await supabase
                .from('jobs')
                .select('id')
                .eq('hirer_id', user.id);
            
            if (!jobs || jobs.length === 0) {
                setApplications([]);
                return;
            }

            const jobIds = jobs.map(j => j.id);

            // Fetch applications for these jobs
            const { data: apps } = await supabase
                .from('applications')
                .select(`
                    *,
                    jobs(title),
                    worker:profiles!applications_worker_id_fkey(id, first_name, last_name, avatar_url, average_rating)
                `)
                .in('job_id', jobIds)
                .order('created_at', { ascending: false });

            setApplications(apps || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    if (loading) return <HashLoader text="" />;

    return (
        <div className="wh-dashboard">
            <PageContainer>
                <div style={{ padding: '20px 16px' }}>
                    <div className="hw-mb-32">
                        <h1 className="text-display-xl" style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px' }}>
                            Pending Reviews
                        </h1>
                        <p className="text-body-md" style={{ color: '#64748B', marginTop: '4px' }}>
                            You have {applications.filter(a => a.status === 'pending').length} applications waiting for your decision.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {applications.length === 0 ? (
                            <Card variant="border" padding="xl" className="hw-text-center">
                                <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B' }}>
                                    <FiUsers size={24} />
                                </div>
                                <h3 className="text-title-md">No applications yet</h3>
                                <p className="text-body-md">Active job postings will appear here once workers start applying.</p>
                            </Card>
                        ) : (
                            applications.map(app => (
                                <Card 
                                    key={app.id} 
                                    variant="elevated" 
                                    padding="lg" 
                                    className="hw-card-interactive"
                                    onClick={() => router.push(`/hirer/applications/review?id=${app.id}`)}
                                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                                >
                                    <div className="hw-flex hw-items-center hw-gap-16">
                                        <div className="wh-avatar-placeholder" style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#f1f5f9' }}>
                                            {app.worker?.avatar_url ? (
                                                <img src={app.worker.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} />
                                            ) : (
                                                (app.worker?.first_name?.[0] || 'W').toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="hw-flex hw-justify-between hw-items-start hw-mb-4">
                                                <h4 style={{ fontWeight: 800, fontSize: '18px', margin: 0 }}>
                                                    {app.worker?.first_name} {app.worker?.last_name?.[0]}.
                                                </h4>
                                                <Badge variant={app.status === 'pending' ? 'waiting' : app.status === 'accepted' ? 'success' : 'urgent'}>
                                                    {app.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-body-md" style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>
                                                Applied for <span style={{ color: '#1C4DFF', fontWeight: 700 }}>{app.jobs?.title}</span>
                                            </p>
                                            <div className="hw-flex hw-items-center hw-gap-12" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                <span className="hw-flex hw-items-center hw-gap-4">
                                                    <FiClock size={14} /> {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                                <span style={{ color: '#f59e0b', fontWeight: 800 }}>
                                                    ★ {app.worker?.average_rating && app.worker.average_rating > 0 ? Number(app.worker.average_rating).toFixed(1) : 'NA'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ color: '#cbd5e1' }}>
                                            <FiChevronRight size={24} />
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
