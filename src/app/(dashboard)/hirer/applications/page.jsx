'use client';

import { useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import HashLoader from "@/Components/common/HashLoader.jsx";
import SectionHeader from '@/Components/common/SectionHeader';
import { FiChevronRight, FiUsers, FiClock, FiSearch, FiStar } from 'react-icons/fi';
import { Button } from "@/Components/ui/Button";

function ApplicationsListContent() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobParam = searchParams.get('job');

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

            let appsQuery = supabase
                .from('applications')
                .select(`
                    *,
                    jobs(title),
                    worker:profiles!applications_worker_id_fkey(id, first_name, last_name, avatar_url, average_rating)
                `)
                .in('job_id', jobIds)
                .order('created_at', { ascending: false });

            // If jobParam is present, only show applications for that specific task
            if (jobParam) {
                appsQuery = appsQuery.eq('job_id', jobParam);
            }

            const { data: apps } = await appsQuery;

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

    const filteredApplications = applications.filter(app => {
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        const matchesSearch = 
            (app.worker?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.worker?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (app.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesStatus && matchesSearch;
    });

    if (loading) return <HashLoader text="" />;

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
            <SectionHeader title="Applications" />

            <PageContainer>
                <div style={{ padding: '24px 20px' }}>
                    
                    {/* Search & Filter Row */}
                    <div style={{ marginBottom: '32px' }}>
                        <div className="mp-search-container" style={{ marginBottom: '16px' }}>
                            <FiSearch className="mp-search-icon" />
                            <input
                                type="text"
                                className="mp-search-input"
                                placeholder="Search by name or job title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                    <div className="mp-tabs" style={{ marginBottom: '0' }}>
                        {['all', 'pending', 'accepted', 'rejected'].map((status) => (
                            <button
                                key={status}
                                className={`mp-tab ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <p className="para-text" style={{ color: '#64748B', margin: 0 }}>
                            {statusFilter === 'all' 
                                ? `Showing all ${filteredApplications.length} applications.` 
                                : `Showing ${filteredApplications.length} ${statusFilter} applications.`
                            }
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredApplications.length === 0 ? (
                            <Card variant="elevated" padding="xl" className="hw-text-center" style={{ borderRadius: '24px' }}>
                                <div className="hw-icon-box hw-mb-16" style={{ margin: '0 auto', background: '#f1f5f9', color: '#64748B', borderRadius: '16px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiUsers size={24} />
                                </div>
                                <h3 className="sub-head-text">No applications found</h3>
                                <p className="para-text">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? "Try adjusting your search or filters." 
                                        : "Active job postings will appear here once workers start applying."
                                    }
                                </p>
                                {(searchTerm || statusFilter !== 'all') && (
                                    <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} style={{ marginTop: '12px' }}>
                                        Clear All Filters
                                    </Button>
                                )}
                            </Card>
                        ) : (
                            filteredApplications.map(app => (
                                <Card 
                                    key={app.id} 
                                    variant="elevated" 
                                    padding="lg" 
                                    className="hw-card-interactive"
                                    onClick={() => router.push(`/hirer/applications/review?id=${app.id}`)}
                                    style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.02)' }}
                                >
                                    <div className="hw-flex hw-items-center hw-gap-16">
                                        <div className="wh-avatar-placeholder" style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#f1f5f9' }}>
                                            {app.worker?.avatar_url ? (
                                                <img src={app.worker.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} />
                                            ) : (
                                                <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--hw-primary)' }}>
                                                    {(app.worker?.first_name?.[0] || 'W').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="hw-flex hw-justify-between hw-items-start hw-mb-4">
                                                <h4 className="sub-head-text" style={{ margin: 0 }}>
                                                    {app.worker?.first_name} {app.worker?.last_name?.[0]}.
                                                </h4>
                                                <Badge variant={app.status === 'pending' ? 'waiting' : app.status === 'accepted' ? 'success' : 'urgent'}>
                                                    {app.status}
                                                </Badge>
                                            </div>
                                            <p className="para-text" style={{ color: '#64748B', marginBottom: '8px' }}>
                                                Applied for <span style={{ color: 'var(--hw-primary)', fontWeight: 500 }}>{app.jobs?.title}</span>
                                            </p>
                                            <div className="hw-flex hw-items-center hw-gap-12" style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                <span className="sub-para-text hw-flex hw-items-center hw-gap-4">
                                                    <FiClock size={14} /> {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                                <div className="sub-para-text hw-flex hw-items-center hw-gap-4" style={{ color: '#f59e0b', fontWeight: 500 }}>
                                                    <FiStar size={12} fill={app.worker?.average_rating > 0 ? "#f59e0b" : "none"} color={app.worker?.average_rating > 0 ? "#f59e0b" : "#94a3b8"} />
                                                    <span>{app.worker?.average_rating && app.worker.average_rating > 0 ? Number(app.worker.average_rating).toFixed(1) : 'NA'}</span>
                                                </div>
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

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <ApplicationsListContent />
        </Suspense>
    );
}
