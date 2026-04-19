'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    FiMapPin, FiGlobe, FiBriefcase, FiCalendar,
    FiCheckCircle, FiStar, FiClock, FiDollarSign,
    FiUser, FiMail, FiExternalLink, FiChevronLeft
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { formatLocation } from '@/lib/location';
import '@/css/profile.css';

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { Button } from "@/Components/ui/Button";

function ProfileContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetId = searchParams.get('id');

    const [viewer, setViewer] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState(null); // 'worker' or 'hirer' (as viewed)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Relational Data
    const [company, setCompany] = useState(null);
    const [skills, setSkills] = useState([]);
    const [education, setEducation] = useState([]);
    const [availability, setAvailability] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ jobs: 0, contracts: 0 });

    useEffect(() => {
        if (targetId) {
            fetchProfileAndRelationship();
        }
    }, [targetId]);

    const fetchProfileAndRelationship = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            setViewer(user);

            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();

            if (profErr) throw new Error(profErr.code === 'PGRST116' ? 'Profile not found' : `Database Error: ${profErr.message}`);
            setProfile(prof);

            // Check for Application relationship
            const { data: asHirerApp } = await supabase
                .from('applications')
                .select('id, jobs(hirer_id)')
                .eq('worker_id', user.id)
                .eq('jobs.hirer_id', targetId)
                .maybeSingle();

            const { data: asWorkerApp } = await supabase
                .from('applications')
                .select('id, jobs(hirer_id)')
                .eq('worker_id', targetId)
                .eq('jobs.hirer_id', user.id)
                .maybeSingle();

            // Check for Contract relationship (Very important for Ongoing tasks)
            const { data: asHirerContract } = await supabase
                .from('contracts')
                .select('id')
                .eq('worker_id', user.id)
                .eq('hirer_id', targetId)
                .maybeSingle();

            const { data: asWorkerContract } = await supabase
                .from('contracts')
                .select('id')
                .eq('worker_id', targetId)
                .eq('hirer_id', user.id)
                .maybeSingle();

            const { data: jobConnection } = await supabase
                .from('jobs')
                .select('id')
                .eq('hirer_id', targetId)
                .limit(1)
                .maybeSingle();

            if (asHirerApp || asHirerContract) {
                setRole('hirer');
                await fetchHirerData(targetId);
            } else if (asWorkerApp || asWorkerContract) {
                setRole('worker');
                await fetchWorkerData(targetId);
            } else if (jobConnection && user.id !== targetId) {
                setRole('hirer');
                await fetchHirerData(targetId);
            } else {
                if (user.id === targetId) {
                    const { data: comp } = await supabase.from('company_details').select('id').eq('hirer_id', targetId).maybeSingle();
                    if (comp) {
                        setRole('hirer');
                        await fetchHirerData(targetId);
                    } else {
                        setRole('worker');
                        await fetchWorkerData(targetId);
                    }
                } else {
                    setError('Access Restricted: You must have an application or contract with this user to view their full profile.');
                }
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchHirerData = async (hId) => {
        const [compRes, jobsRes, contractsRes, reviewsRes] = await Promise.all([
            supabase.from('company_details').select('*').eq('hirer_id', hId).maybeSingle(),
            supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('hirer_id', hId),
            supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('hirer_id', hId).eq('status', 'active'),
            supabase.from('reviews').select(`*, reviewer:reviewer_id(first_name, last_name, avatar_url)`).eq('reviewee_id', hId).order('created_at', { ascending: false })
        ]);

        setCompany(compRes.data);
        setStats({ jobs: jobsRes.count || 0, contracts: contractsRes.count || 0 });
        setReviews(reviewsRes.data || []);
    };

    const fetchWorkerData = async (wId) => {
        const [skillsRes, eduRes, availRes, reviewsRes] = await Promise.all([
            supabase.from('worker_skills').select('skills(name)').eq('worker_id', wId),
            supabase.from('worker_education').select('*').eq('worker_id', wId).order('start_year', { ascending: false }),
            supabase.from('worker_availability').select('*').eq('worker_id', wId).maybeSingle(),
            supabase.from('reviews').select(`*, reviewer:reviewer_id(first_name, last_name, avatar_url)`).eq('reviewee_id', wId).order('created_at', { ascending: false })
        ]);

        setSkills(skillsRes.data?.map(s => s.skills.name) || []);
        setEducation(eduRes.data || []);
        setAvailability(availRes.data);
        setReviews(reviewsRes.data || []);
    };

    if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><HashLoader text="" /></div>;
    if (error) return (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 className="text-display-xl">Access Restricted</h2>
            <p className="text-body-md" style={{ color: 'var(--color-text-main)', marginBottom: '24px' }}>{error}</p>
            <Button variant="primary" onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    return (
        <div className="profile-dashboard" style={{ padding: 0 }}>
            {/* Premium Sticky Header */}
            <header className="hw-profile-header">
                <div className="hw-profile-header-slot left">
                    <button onClick={() => router.back()} className="hw-back-btn">
                        <FiChevronLeft size={24} color="#64748B" />
                    </button>
                </div>
                
                <div className="hw-profile-header-slot center">
                    <h2 className="hw-profile-title">{role === 'worker' ? 'Worker' : 'Hirer'} Profile</h2>
                </div>
                
                <div className="hw-profile-header-slot right">
                    {/* Placeholder for symmetry */}
                </div>
            </header>

            {/* Premium Hero Section */}
            <section className="profile-hero-section">
                <div className="profile-hero-banner"></div>
                <div className="profile-hero-content">
                    <div className="profile-avatar-premium">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={`${profile.first_name}'s avatar`} />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {profile.first_name?.charAt(0)}
                            </div>
                        )}
                        <div className="profile-status-ring">
                            <div className="profile-status-dot"></div>
                        </div>
                    </div>
                    <h1 className="text-display-lg" style={{ color: '#0F172A', marginBottom: '8px' }}>
                        {profile.first_name} {profile.last_name}
                    </h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <p className="text-body-md" style={{ color: 'var(--hw-text-secondary)', fontWeight: 600 }}>
                            {role === 'worker' ? (profile.headline || 'Professional Freelancer') : (company?.company_name || 'Verified Hirer')}
                        </p>
                        <Badge variant="active" showDot>Official</Badge>
                    </div>
                </div>
            </section>

            <PageContainer size="lg" style={{ paddingTop: '32px' }}>
                <div className="profile-grid" style={{ marginTop: '0' }}>
                    {/* ── Main Column ── */}
                    <div className="profile-col-main">
                        
                        {/* About Section */}
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                            <h2 className="text-headline-md hw-mb-24">About {role === 'hirer' ? 'Company' : 'Profile'}</h2>
                            <p className="text-body-md" style={{ lineHeight: 1.7, color: 'var(--hw-text-secondary)', background: 'var(--hw-surface-high)', padding: '24px', borderRadius: '16px' }}>
                                {role === 'hirer' ? (company?.company_description || 'No description provided.') : (profile.bio || 'No bio provided.')}
                            </p>
                        </Card>

                        {/* Expertise / Skills */}
                        {role === 'worker' && skills.length > 0 && (
                            <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                                <h2 className="text-headline-md hw-mb-24">Expertise & Skills</h2>
                                <div className="hw-chip-group">
                                    {skills.map((s, i) => (
                                        <div key={i} className="hw-premium-chip" style={{ background: 'var(--hw-surface-highest)', border: '1.5px solid var(--hw-surface-high)', borderRadius: '16px', padding: '12px 20px' }}>
                                            <span className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Feedback / Reviews */}
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-24)' }}>
                                <h2 className="text-headline-md">Recent Feedback</h2>
                                <Badge variant="active" style={{ height: '32px' }}>★ {profile.average_rating || '5.0'}</Badge>
                            </div>

                            {reviews.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {reviews.map(rev => (
                                        <div key={rev.id} style={{ padding: '20px', background: 'var(--hw-surface-high)', borderRadius: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: 'var(--hw-primary)' }}>
                                                        {rev.reviewer?.avatar_url ? <img src={rev.reviewer.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : rev.reviewer?.first_name?.charAt(0)}
                                                    </div>
                                                    <span className="text-title-md" style={{ fontSize: '16px' }}>{rev.reviewer?.first_name} {rev.reviewer?.last_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', color: 'var(--hw-primary)', gap: '4px' }}>
                                                    {[...Array(5)].map((_, i) => <FiStar key={i} fill={i < rev.rating ? "currentColor" : "none"} size={16} />)}
                                                </div>
                                            </div>
                                            <p className="text-body-md" style={{ fontStyle: 'italic', color: 'var(--hw-text-secondary)', margin: 0 }}>"{rev.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <p className="text-body-md" style={{ color: 'var(--hw-text-secondary)', margin: 0 }}>No reviews received yet.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ── Side Column ── */}
                    <div className="profile-col-side" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hw-space-24)' }}>
                        
                        {/* Stats Card */}
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                            <h3 className="text-headline-md hw-mb-24">Activity Pulse</h3>
                            <div className="profile-stats-grid">
                                <div className="premium-stat-card">
                                    <span className="premium-stat-label">Tasks</span>
                                    <span className="premium-stat-value">{role === 'worker' ? (profile.total_jobs_completed || 0) : stats.jobs}</span>
                                </div>
                                <div className="premium-stat-card">
                                    <span className="premium-stat-label">Active</span>
                                    <span className="premium-stat-value">{stats.contracts || 0}</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: 'var(--hw-surface-high)', textAlign: 'center' }}>
                                <p className="text-label-sm" style={{ marginBottom: '4px' }}>Member Since</p>
                                <p className="text-title-md" style={{ color: 'var(--hw-primary)', margin: 0 }}>{new Date(profile.created_at).getFullYear()}</p>
                            </div>
                        </Card>

                        {/* Contact Info Card */}
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                            <h3 className="text-headline-md hw-mb-24">Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ background: 'var(--hw-surface-high)', padding: '12px', borderRadius: '12px', color: 'var(--hw-primary)' }}>
                                        <FiMapPin size={20} />
                                    </div>
                                    <div>
                                        <label className="text-label-sm" style={{ display: 'block', marginBottom: '2px' }}>Location</label>
                                        <span className="text-body-md" style={{ fontWeight: 800, color: 'var(--hw-text-primary)' }}>
                                            {profile.city || profile.country || 'Global'}
                                        </span>
                                    </div>
                                </div>
                                
                                {role === 'worker' && availability && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ background: availability.is_available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)', padding: '12px', borderRadius: '12px', color: availability.is_available ? 'var(--hw-success)' : 'var(--hw-text-secondary)' }}>
                                            <FiClock size={20} />
                                        </div>
                                        <div>
                                            <label className="text-label-sm" style={{ display: 'block', marginBottom: '2px' }}>Status</label>
                                            <span className="text-body-md" style={{ fontWeight: 800, color: 'var(--hw-text-primary)' }}>
                                                {availability.is_available ? 'READY FOR WORK' : 'CURRENTLY BUSY'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {role === 'hirer' && company?.website && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ background: 'var(--hw-surface-high)', padding: '12px', borderRadius: '12px', color: 'var(--hw-primary)' }}>
                                            <FiGlobe size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <label className="text-label-sm" style={{ display: 'block', marginBottom: '2px' }}>Website</label>
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-body-md" style={{ fontWeight: 800, color: 'var(--hw-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {company.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Pro Badge Card */}
                        <Card variant="elevated" padding="xl" style={{ borderRadius: '24px', background: 'var(--hw-primary-gradient)', border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                                <FiCheckCircle size={24} strokeWidth={3} />
                                <div>
                                    <h3 className="text-title-md" style={{ color: '#fff', margin: 0 }}>Verified Identity</h3>
                                    <p className="text-body-sm" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, margin: 0 }}>Trust Factor 100%</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
    

export default function ProfileViewPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <ProfileContent />
        </Suspense>
    );
}
