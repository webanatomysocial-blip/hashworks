'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    FiMapPin, FiGlobe, FiBriefcase, FiCalendar,
    FiCheckCircle, FiStar, FiClock,
    FiUser, FiMail, FiExternalLink, FiChevronLeft, FiMessageSquare
} from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import SectionHeader from "@/Components/common/SectionHeader";
import '@/css/profile.css';
import RecentReviews from '@/Components/profile/RecentReviews';

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        return `${h} hour${h > 1 ? 's' : ''} ago`;
    }
    if (diff < 604800) {
        const d = Math.floor(diff / 86400);
        return `${d} day${d > 1 ? 's' : ''} ago`;
    }
    const w = Math.floor(diff / 604800);
    return `${w} week${w > 1 ? 's' : ''} ago`;
}

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
    const [pastWorks, setPastWorks] = useState([]);

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

            // 1. Direct Contract Check (Most common for ongoing tasks)
            const { data: contracts } = await supabase
                .from('contracts')
                .select('id, hirer_id, worker_id')
                .or(`worker_id.eq.${targetId},hirer_id.eq.${targetId}`);

            const hasContractLink = contracts?.some(c => 
                (c.worker_id === targetId && c.hirer_id === user.id) || 
                (c.worker_id === user.id && c.hirer_id === targetId)
            );

            // 2. Application Check
            const { data: apps } = await supabase
                .from('applications')
                .select('id, worker_id, jobs(hirer_id)')
                .or(`worker_id.eq.${targetId},worker_id.eq.${user.id}`);

            const hasAppLink = apps?.some(a => 
                (a.worker_id === targetId && a.jobs?.hirer_id === user.id) ||
                (a.worker_id === user.id && a.jobs?.hirer_id === targetId)
            );

            const isSelf = user.id === targetId;

            if (isSelf || hasContractLink || hasAppLink) {
                // Determine Role for display
                const { data: isHirer } = await supabase.from('company_details').select('id').eq('hirer_id', targetId).maybeSingle();
                const detectedRole = isHirer ? 'hirer' : 'worker';
                setRole(detectedRole);

                if (detectedRole === 'hirer') {
                    await fetchHirerData(targetId);
                } else {
                    await fetchWorkerData(targetId);
                }
            } else {
                // Fallback for public jobs
                const { data: ownsJob } = await supabase.from('jobs').select('id').eq('hirer_id', targetId).limit(1).maybeSingle();
                if (ownsJob) {
                    setRole('hirer');
                    await fetchHirerData(targetId);
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

        const { data: pwData } = await supabase.from('past_works').select('*').eq('hirer_id', hId).order('completed_at', { ascending: false }).limit(5);
        setPastWorks(pwData || []);
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

        const { data: pwData } = await supabase.from('past_works').select('*').eq('worker_id', wId).order('completed_at', { ascending: false }).limit(5);
        setPastWorks(pwData || []);
    };

    const calculateCompleteness = () => {
        if (!profile) return 0;
        const fields = [profile.bio, profile.avatar_url, profile.headline, profile.city];
        const filled = fields.filter(Boolean).length;
        if (role === 'worker') {
            const workerFields = [skills.length > 0, education.length > 0, availability];
            return Math.round(((filled + workerFields.filter(Boolean).length) / (fields.length + 3)) * 100);
        }
        return Math.round((filled / fields.length) * 100);
    };

    const completeness = calculateCompleteness();

    if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><HashLoader text="" /></div>;
    if (error) return (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2 className="text-display-xl">Access Restricted</h2>
            <p className="text-body-md" style={{ color: 'var(--color-text-main)', marginBottom: '24px' }}>{error}</p>
            <Button variant="primary" onClick={() => router.back()}>Go Back</Button>
        </div>
    );

    return (
        <div className="profile-dashboard">
            {/* Premium Header */}
            <SectionHeader title={role === 'worker' ? 'Worker Profile' : 'Hirer Profile'} />

            <PageContainer size="lg" style={{ paddingTop: '0px' }}>
                
                {/* 1. Hero Card */}
                <div className="ph-hero-card hw-premium-card">
                    <div className="ph-hero-top">
                        <div className="ph-avatar-box">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="ph-avatar-img" alt="" />
                            ) : (
                                <div className="profile-avatar-placeholder ph-avatar-img" style={{ fontSize: '32px' }}>
                                    {profile.first_name?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="ph-hero-info">
                            <div className="ph-name">{profile.first_name} {profile.last_name?.charAt(0)}.</div>
                            <div className="ph-location"><FiMapPin size={12} /> {profile.city || 'Location'}</div>
                            <div className="ph-meta-row">
                                <span className="ph-meta-item" style={{ color: '#F59E0B' }}><FiStar size={14} fill="#F59E0B" /> {profile.average_rating || '5.0'}</span>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="profile-grid">
                    {/* Main Content Sections */}
                    <div className="profile-col-main">
                        
                        <div className="ph-section-card">
                            <div className="ph-title-row">
                                <h2 className="ph-title">Skills & Bio</h2>
                                {viewer?.id === targetId && <span className="ph-edit-link">Edit</span>}
                            </div>
                            {role === 'worker' && skills.length > 0 && (
                                <div className="ph-chip-row">
                                    {skills.map((s, i) => <span key={i} className="ph-chip">{s}</span>)}
                                </div>
                            )}
                            <p className="text-body-md" style={{ lineHeight: 1.8, color: '#64748B' }}>
                                {role === 'hirer' ? (company?.company_description || 'No description provided.') : (profile.bio || 'No bio provided.')}
                            </p>
                        </div>

                        <RecentReviews reviews={reviews} targetId={targetId} />

                        {pastWorks.length > 0 && (
                            <div className="ph-section-card">
                                <div className="ph-title-row">
                                    <h2 className="ph-title">Work History</h2>
                                    <span 
                                        className="ph-edit-link" 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/${role}/portfolio?id=${targetId}`)}
                                    >
                                        View All
                                    </span>
                                </div>
                                <div>
                                    {pastWorks.map(pw => (
                                        <div key={pw.id} className="ph-history-item">
                                            <div className="ph-history-icon"><FiBriefcase size={20} /></div>
                                            <div className="ph-history-info">
                                                <div className="ph-history-title">{pw.title}</div>
                                                <div className="ph-history-date">{new Date(pw.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                            </div>
                                            <div className="ph-history-payout">₹{pw.payout.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
