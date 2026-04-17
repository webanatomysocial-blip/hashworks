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

            const { data: asHirer } = await supabase
                .from('applications')
                .select('id, jobs(hirer_id)')
                .eq('worker_id', user.id)
                .eq('jobs.hirer_id', targetId)
                .maybeSingle();

            const { data: asWorker } = await supabase
                .from('applications')
                .select('id, jobs(hirer_id)')
                .eq('worker_id', targetId)
                .eq('jobs.hirer_id', user.id)
                .maybeSingle();

            const { data: jobConnection } = await supabase
                .from('jobs')
                .select('id')
                .eq('hirer_id', targetId)
                .limit(1)
                .maybeSingle();

            if (asHirer) {
                setRole('hirer');
                await fetchHirerData(targetId);
            } else if (asWorker) {
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
        <div className="wh-dashboard" style={{ padding: 'var(--space-xl) 0' }}>
            <PageContainer size="lg">
                <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <Button variant="ghost" onClick={() => router.back()} style={{ padding: '8px' }}>
                        <FiChevronLeft size={20} />
                    </Button>
                    <h1 className="text-display-xl" style={{ fontSize: '32px' }}>Profile</h1>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 2fr) 1fr', gap: 'var(--space-xl)' }}>
                    {/* ── Side Info ── */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <Card variant="elevated" padding="xl" style={{ textAlign: 'center' }}>
                            <div style={{ 
                                width: '120px', height: '120px', borderRadius: 'var(--radius-pill)', 
                                backgroundColor: 'var(--color-border-light)', overflow: 'hidden',
                                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '48px', color: 'var(--color-primary)', border: '4px solid white', boxShadow: 'var(--shadow-md)'
                            }}>
                                {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser />}
                            </div>
                            <h2 className="text-headline-lg" style={{ fontSize: '24px', marginBottom: '4px' }}>
                                {profile.first_name} {profile.last_name}
                            </h2>
                            <p className="text-label-sm" style={{ color: 'var(--color-primary)', fontWeight: '800', marginBottom: '12px' }}>
                                {role === 'worker' ? (profile.headline || 'Freelancer') : (company?.company_name || 'Individual Hirer')}
                            </p>
                            <Badge variant="active">Verified Pro</Badge>
                        </Card>

                        <Card variant="elevated" padding="lg">
                            <h3 className="text-title-md" style={{ marginBottom: '12px' }}>Stats</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-label-sm">Rating</span>
                                    <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{profile.average_rating || 0} / 5</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-label-sm">Tasks</span>
                                    <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{role === 'worker' ? (profile.total_jobs_completed || 0) : stats.jobs}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-label-sm">Join Year</span>
                                    <span style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>{new Date(profile.created_at).getFullYear()}</span>
                                </div>
                            </div>
                        </Card>
                    </aside>

                    {/* ── Main Content ── */}
                    <main style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <Card variant="elevated" padding="xl">
                            <h3 className="text-headline-lg" style={{ marginBottom: '12px' }}>About</h3>
                            <p className="text-body-md" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                {role === 'hirer' ? (company?.company_description || 'No description provided.') : (profile.bio || 'No bio provided.')}
                            </p>
                        </Card>

                        {role === 'worker' && skills.length > 0 && (
                            <Card variant="elevated" padding="xl">
                                <h3 className="text-headline-lg" style={{ marginBottom: '16px' }}>Expertise</h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {skills.map((s, i) => <Badge key={i} variant="active">{s}</Badge>)}
                                </div>
                            </Card>
                        )}

                        <Card variant="elevated" padding="xl">
                            <h3 className="text-headline-lg" style={{ marginBottom: '16px' }}>Feedback</h3>
                            {reviews.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                    {reviews.map(rev => (
                                        <div key={rev.id} style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span className="text-title-md" style={{ fontSize: '15px' }}>{rev.reviewer?.first_name}</span>
                                                <div style={{ display: 'flex', color: 'var(--color-primary)', fontSize: '14px' }}>
                                                    {[...Array(5)].map((_, i) => <FiStar key={i} fill={i < rev.rating ? "currentColor" : "none"} />)}
                                                </div>
                                            </div>
                                            <p className="text-body-md" style={{ fontStyle: 'italic', opacity: 0.8 }}>"{rev.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-label-sm">No reviews yet.</p>}
                        </Card>
                    </main>

                    {/* ── Contact & Availability ── */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <Card variant="elevated" padding="lg">
                            <h3 className="text-title-md" style={{ marginBottom: '16px' }}>Location</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                                <FiMapPin />
                                <span className="text-body-md">
                                    {profile.city || profile.country || 'Global'}
                                </span>
                            </div>
                        </Card>

                        {role === 'worker' && availability && (
                            <Card variant="elevated" padding="lg">
                                <h3 className="text-title-md" style={{ marginBottom: '16px' }}>Availability</h3>
                                <div style={{ 
                                    padding: '12px', borderRadius: 'var(--radius-md)', 
                                    backgroundColor: availability.is_available ? 'var(--color-success-light)' : 'var(--color-border-light)',
                                    color: availability.is_available ? 'var(--color-success)' : 'var(--color-text-main)',
                                    textAlign: 'center', fontWeight: '700', marginBottom: '12px'
                                }}>
                                    {availability.is_available ? 'Ready to Work' : 'Currently Busy'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span className="text-label-sm">Role Type: <span style={{ color: 'var(--color-text-main)', fontWeight: '700' }}>{availability.preferred_role_type || 'Any'}</span></span>
                                </div>
                            </Card>
                        )}
                    </aside>
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
