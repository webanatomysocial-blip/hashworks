"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
    FiChevronLeft, FiEdit3, FiMapPin, FiClock, 
    FiShield, FiTarget, FiZap, FiCheckCircle,
    FiFileText, FiUsers, FiCalendar
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { Button } from '@/Components/ui/Button';
import { Card } from '@/Components/ui/Card';
import HashLoader from '@/Components/common/HashLoader';
import '@/css/hirer.css';

function HirerPostingViewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ applications: 0 });

    useEffect(() => {
        async function fetchDetails() {
            if (!jobId) return;
            setLoading(true);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch job details
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .single();

                if (jobError) throw jobError;

                // Security check - only owner can view this
                if (jobData.hirer_id !== user.id) {
                    throw new Error("Unauthorized access to this posting.");
                }

                setJob(jobData);

                // Fetch applications count
                const { count } = await supabase
                    .from('applications')
                    .select('*', { count: 'exact', head: true })
                    .eq('job_id', jobId);
                
                setStats({ applications: count || 0 });

            } catch (error) {
                console.error('Error fetching job details:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [jobId, router]);

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="" /></div>;
    if (!job) return <div className="wh-dashboard" style={{ textAlign: 'center', padding: '100px 24px' }}><h3>Posting not found</h3><Button onClick={() => router.back()}>Go Back</Button></div>;

    const formattedDate = job.start_date ? new Date(job.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible';

    return (
        <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
            {/* Header */}
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '16px 20px', 
                background: '#fff', 
                position: 'sticky', 
                top: 0, 
                zIndex: 100, 
                borderBottom: '1.5px solid #f1f5f9'
            }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                    <FiChevronLeft size={24} color="#64748B" />
                </button>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Task Details</h2>
                <button 
                    onClick={() => router.push(`/hirer/postings/edit?id=${job.id}`)}
                    style={{ background: '#EEF2FF', border: 'none', color: '#1C4DFF', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <FiEdit3 size={16} /> Edit
                </button>
            </header>

            <main style={{ padding: '24px 20px 100px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    
                    {/* Status Badge */}
                    <div style={{ marginBottom: '20px' }}>
                        <span style={{ 
                            background: job.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                            color: job.status === 'active' ? '#166534' : '#991B1B',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {job.status}
                        </span>
                    </div>

                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', marginBottom: '16px', lineHeight: 1.2 }}>
                        {job.title}
                    </h1>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                        <Card variant="border" padding="md" style={{ borderRadius: '20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>BUDGET</p>
                            <p style={{ fontSize: '18px', fontWeight: 800, color: '#1C4DFF' }}>₹{job.budget_max || job.budget_min || '---'}</p>
                        </Card>
                        <Card variant="border" padding="md" style={{ borderRadius: '20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>APPLICATIONS</p>
                            <p style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{stats.applications}</p>
                        </Card>
                        <Card variant="border" padding="md" style={{ borderRadius: '20px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}>URGENCY</p>
                            <p style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', textTransform: 'capitalize' }}>{job.urgency}</p>
                        </Card>
                    </div>

                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiFileText color="#1C4DFF" /> Description
                        </h3>
                        <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                            {job.description || "No description provided."}
                        </p>
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <Card variant="border" padding="lg" style={{ borderRadius: '24px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiCalendar color="#1C4DFF" /> Schedule
                            </h4>
                            <p style={{ fontSize: '14px', color: '#475569' }}>{formattedDate}</p>
                            <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{job.start_time || 'flexible'} start</p>
                        </Card>
                        <Card variant="border" padding="lg" style={{ borderRadius: '24px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiMapPin color="#1C4DFF" /> Location
                            </h4>
                            <p style={{ fontSize: '14px', color: '#475569', textTransform: 'capitalize' }}>{job.location_type || 'On-site'}</p>
                            <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>{job.city || 'Anywhere'}{job.subcity ? `, ${job.subcity}` : ''}</p>
                        </Card>
                    </div>

                    {job.reference_image_url && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>Reference Photo</h3>
                            <img 
                                src={job.reference_image_url} 
                                alt="Task Reference" 
                                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '24px', border: '2px solid #E2E8F0' }} 
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Button 
                            variant="primary" 
                            style={{ flex: 1, height: '56px', borderRadius: '28px', fontSize: '16px', fontWeight: 800 }}
                            onClick={() => router.push(`/hirer/applications?job=${job.id}`)}
                        >
                            View Applications
                        </Button>
                        <Button 
                            variant="outline" 
                            style={{ flex: 1, height: '56px', borderRadius: '28px', fontSize: '16px', fontWeight: 800, borderColor: '#CBD5E1' }}
                            onClick={() => router.push(`/hirer/postings/edit?id=${job.id}`)}
                        >
                            Edit Posting
                        </Button>
                    </div>

                </div>
            </main>
        </div>
    );
}

export default function HirerPostingViewPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <HirerPostingViewContent />
        </Suspense>
    );
}
