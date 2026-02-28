'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    FiMapPin, FiGlobe, FiBriefcase, FiCalendar,
    FiCheckCircle, FiStar, FiClock, FiDollarSign,
    FiUser, FiMail, FiExternalLink, FiChevronLeft
} from 'react-icons/fi';
import '@/css/profile.css';

export default function ProfileClient({ targetId }) {
    const router = useRouter();
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

            // 1. Fetch the target profile
            const { data: prof, error: profErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();

            if (profErr || !prof) throw new Error('Profile not found');
            setProfile(prof);

            // 2. Determine Relationship & Role
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

            if (asHirer) {
                setRole('hirer');
                await fetchHirerData(targetId);
            } else if (asWorker) {
                setRole('worker');
                await fetchWorkerData(targetId);
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
                    setError('You do not have permission to view this profile at this stage.');
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

    if (loading) return <div className="loading-state">Loading Profile...</div>;
    if (error) return (
        <div className="profile-dashboard" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Access Restricted</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
            <button className="save-btn" onClick={() => router.back()}>Go Back</button>
        </div>
    );

    return (
        <div className="profile-dashboard">
            <button className="lm-back" onClick={() => router.back()} style={{ marginBottom: '24px', position: 'static' }}>
                <FiChevronLeft /> Back
            </button>

            <div className="profile-header" style={{ alignItems: 'center' }}>
                <div className="avatar-section">
                    <div className="avatar-circle">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <FiUser />}
                    </div>
                    <div className="avatar-titles">
                        <h3>{profile.first_name} {profile.last_name} {profile.is_verified && <FiCheckCircle color="#3b82f6" style={{ marginLeft: '4px' }} />}</h3>
                        {role === 'worker' ? (
                            <p className="headline-text">{profile.headline || 'Freelancer'}</p>
                        ) : (
                            <p className="headline-text">{company?.company_name || 'Individual Hirer'}</p>
                        )}
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                            <FiMapPin style={{ marginRight: '4px' }} /> {profile.country || 'Global'}
                        </p>
                    </div>
                </div>

                <div className="completeness-indicator" style={{ minWidth: '200px' }}>
                    <div className="comp-text">
                        <span>Rating</span>
                        <span>{profile.average_rating || 0} / 5</span>
                    </div>
                    <div className="comp-bar-bg">
                        <div className="comp-bar-fill" style={{ width: `${(profile.average_rating || 0) * 20}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-col-main">
                    {role === 'hirer' ? (
                        <>
                            <div className="profile-card">
                                <div className="card-header"><h2>Company Description</h2></div>
                                <div className="card-body">
                                    <p className="bio-text" style={{ color: company?.company_description ? '#334155' : '#94a3b8' }}>
                                        {company?.company_description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="profile-card">
                                <div className="card-header"><h2>Company Overview</h2></div>
                                <div className="card-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Industry</label>
                                            <p>{company?.industry || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Company Size</label>
                                            <p>{company?.company_size || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Founded</label>
                                            <p>{company?.founded_year || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Website</label>
                                            <p>
                                                {company?.website ? (
                                                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Visit <FiExternalLink size={12} />
                                                    </a>
                                                ) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-card">
                                <div className="card-header"><h2>About Me</h2></div>
                                <div className="card-body">
                                    <p className="bio-text" style={{ color: profile.bio ? '#334155' : '#94a3b8' }}>
                                        {profile.bio || 'This worker hasn\'t provided a bio yet.'}
                                    </p>
                                </div>
                            </div>

                            <div className="profile-card">
                                <div className="card-header"><h2>Skills</h2></div>
                                <div className="card-body">
                                    {skills.length > 0 ? (
                                        <div className="skills-container">
                                            {skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
                                        </div>
                                    ) : <p className="empty-text">No skills listed.</p>}
                                </div>
                            </div>

                            <div className="profile-card">
                                <div className="card-header"><h2>Education</h2></div>
                                <div className="card-body">
                                    {education.length > 0 ? (
                                        education.map(edu => (
                                            <div key={edu.id} className="list-item">
                                                <div className="li-header">
                                                    <h4 className="li-title">{edu.degree} in {edu.field_of_study}</h4>
                                                    <p className="li-subtitle">{edu.start_year} - {edu.end_year || 'Present'}</p>
                                                </div>
                                                <p className="li-subtitle" style={{ fontWeight: '500', color: '#475569' }}>{edu.institution}</p>
                                            </div>
                                        ))
                                    ) : <p className="empty-text">No education history added.</p>}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="profile-card">
                        <div className="card-header"><h2>Recent Reviews</h2></div>
                        <div className="card-body">
                            {reviews.length > 0 ? (
                                reviews.map(rev => (
                                    <div key={rev.id} className="list-item" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                                        <div className="li-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden' }}>
                                                    {rev.reviewer?.avatar_url ? <img src={rev.reviewer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiUser style={{ margin: '8px' }} />}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{rev.reviewer?.first_name} {rev.reviewer?.last_name}</p>
                                                    <div style={{ display: 'flex', color: '#f59e0b', fontSize: '12px' }}>
                                                        {[...Array(5)].map((_, i) => <FiStar key={i} fill={i < rev.rating ? "#f59e0b" : "none"} />)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{new Date(rev.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#475569', margin: '10px 0 0 0', lineHeight: '1.5' }}>"{rev.comment}"</p>
                                    </div>
                                ))
                            ) : <p className="empty-text">No reviews yet.</p>}
                        </div>
                    </div>
                </div>

                <div className="profile-col-side">
                    <div className="profile-card stats-card">
                        <div className="card-header"><h2>Professional Stats</h2></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {role === 'worker' ? (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-label">Jobs Completed</span>
                                        <span className="stat-value">{profile.total_jobs_completed || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Total Earnings</span>
                                        <span className="stat-value">₹{profile.total_earnings?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Member Since</span>
                                        <span className="stat-value">{new Date(profile.created_at).getFullYear()}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="stat-item">
                                        <span className="stat-label">Jobs Posted</span>
                                        <span className="stat-value">{stats.jobs}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Active Contracts</span>
                                        <span className="stat-value">{stats.contracts}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Member Since</span>
                                        <span className="stat-value">{new Date(profile.created_at).getFullYear()}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {role === 'worker' && availability && (
                        <div className="profile-card">
                            <div className="card-header"><h2>Availability</h2></div>
                            <div className="card-body">
                                <div className="status-badge active" style={{ backgroundColor: availability.is_available ? '#dcfce7' : '#fee2e2', color: availability.is_available ? '#166534' : '#991b1b', marginBottom: '16px' }}>
                                    {availability.is_available ? 'Available Now' : 'Not Available'}
                                </div>
                                <div className="info-item" style={{ marginBottom: '16px' }}>
                                    <label>Preferred Role</label>
                                    <p style={{ textTransform: 'capitalize' }}>{availability.preferred_role_type || 'Any'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Available From</label>
                                    <p>{availability.available_from ? new Date(availability.available_from).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
