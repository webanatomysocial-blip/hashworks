'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiEdit2, FiPlus, FiTrash2, FiSave, FiX, FiFileText, FiChevronLeft, FiCheck, FiLogOut, FiStar } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import SectionHeader from '@/Components/common/SectionHeader';
import { PageContainer } from '@/Components/layouts/PageContainer';
import AvatarUpload from '@/Components/profile/AvatarUpload';
import ResumeUpload from '@/Components/profile/ResumeUpload';
import { Card } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/Button";
import { Badge } from "@/Components/ui/Badge";
import '@/css/profile.css';
import ConfirmModal from '@/Components/common/ConfirmModal';

function calculateCompleteness(profile, mySkills, myEducation, availability) {
    let score = 0;
    if (profile.first_name) score += 10;
    if (profile.last_name) score += 5;
    if (profile.username) score += 5;
    if (profile.bio) score += 20;
    if (profile.headline) score += 10;
    if (profile.phone) score += 5;
    if (profile.country) score += 5;

    // Relational
    if (mySkills.length > 0) score += 20;
    if (myEducation.length > 0) score += 10;
    if (availability.preferred_role_type) score += 10;
    if (profile.resume_path) score += 10;

    return Math.min(score, 100);
}

export default function WorkerProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        username: '',
        phone: '',
        bio: '',
        headline: '',
        country: '',
        avatar_url: '',
        resume_path: '',
    });

    const [stats, setStats] = useState({
        total_earnings: 0,
        average_rating: 0,
        total_jobs_completed: 0
    });

    const [mySkills, setMySkills] = useState([]);
    const [allSkills, setAllSkills] = useState([]);
    const [myEducation, setMyEducation] = useState([]);
    const [availability, setAvailability] = useState({
        is_available: true,
        preferred_role_type: 'gig'
    });

    const [isEditingBase, setIsEditingBase] = useState(false);
    const [isAddingEdu, setIsAddingEdu] = useState(false);
    const [editingEduId, setEditingEduId] = useState(null);
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [isEditingAvail, setIsEditingAvail] = useState(false);

    // Confirm Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        variant: 'destructive',
        loading: false
    });

    const [eduForm, setEduForm] = useState({
        institution: '',
        degree: '',
        field_of_study: '',
        start_year: '',
        end_year: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUser(user);

            // Fetch Base Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    username: profileData.username || '',
                    phone: profileData.phone || '',
                    bio: profileData.bio || '',
                    headline: profileData.headline || '',
                    country: profileData.country || '',
                    avatar_url: profileData.avatar_url || '',
                    resume_path: profileData.resume_path || '',
                });
                setStats({
                    total_earnings: profileData.total_earnings || 0,
                    average_rating: profileData.average_rating || 0,
                    total_jobs_completed: profileData.total_jobs_completed || 0
                });
            }

            // Fetch Skills
            const { data: skillsData } = await supabase
                .from('worker_skills')
                .select('id, skill_id, skills(name)')
                .eq('worker_id', user.id);
            if (skillsData) setMySkills(skillsData);

            const { data: globalSkills } = await supabase.from('skills').select('*').order('name');
            if (globalSkills) setAllSkills(globalSkills);

            // Fetch Education
            const { data: eduData } = await supabase
                .from('worker_education')
                .select('*')
                .eq('worker_id', user.id)
                .order('start_year', { ascending: false });
            if (eduData) setMyEducation(eduData);

            // Fetch Availability
            const { data: availData } = await supabase
                .from('worker_availability')
                .select('*')
                .eq('worker_id', user.id)
                .single();
            if (availData) {
                setAvailability({
                    is_available: availData.is_available,
                    preferred_role_type: availData.preferred_role_type
                });
            } else {
                // Ensure record exists
                await supabase.from('worker_availability').insert([{ worker_id: user.id }]);
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            alert("Failed to load profile data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleBaseSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                country: profile.country
            };

            // Only include fields if they have a value to avoid unique constraint 
            // violations or clearing data unintentionally.
            if (profile.username && profile.username.trim() !== '') {
                updateData.username = profile.username;
            }
            if (profile.bio) updateData.bio = profile.bio;
            if (profile.headline) updateData.headline = profile.headline;

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            setIsEditingBase(false);
        } catch (error) {
            console.error('Error saving base profile:', error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleBaseChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSkillAdd = async (skillName) => {
        if (!skillName.trim()) return;
        setSaving(true);
        try {
            // 1. Check if skill exists in global skills table
            let { data: skill, error: skillError } = await supabase
                .from('skills')
                .select('id')
                .ilike('name', skillName.trim())
                .maybeSingle();

            let skillId;
            if (!skill) {
                // 2. Create new global skill if doesn't exist
                const { data: newSkill, error: createError } = await supabase
                    .from('skills')
                    .insert([{ name: skillName.trim() }])
                    .select('id')
                    .single();
                if (createError) throw createError;
                skillId = newSkill.id;
            } else {
                skillId = skill.id;
            }

            // 3. Check if worker already has this skill
            const alreadyHas = mySkills.some(ms => ms.skill_id === skillId);
            if (alreadyHas) {
                setIsAddingSkill(false);
                return;
            }

            // 4. Link skill to worker
            const { error: linkError } = await supabase
                .from('worker_skills')
                .insert([{ worker_id: user.id, skill_id: skillId }]);

            if (linkError) throw linkError;
            
            setIsAddingSkill(false);
            fetchData();
        } catch (error) {
            console.error('Error adding skill:', error);
            alert("Failed to add skill.");
        } finally {
            setSaving(false);
        }
    };

    const handleSkillRemove = async (workerSkillId) => {
        try {
            const { error } = await supabase
                .from('worker_skills')
                .delete()
                .eq('id', workerSkillId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error removing skill:', error);
            alert("Failed to remove skill.");
        }
    };

    const handleEduSave = async (quickData = null) => {
        setSaving(true);
        try {
            const dataToSave = quickData || eduForm;
            const payload = {
                ...dataToSave,
                worker_id: user.id,
                start_year: parseInt(dataToSave.start_year),
                end_year: dataToSave.end_year ? parseInt(dataToSave.end_year) : null
            };

            if (editingEduId) {
                const { error } = await supabase
                    .from('worker_education')
                    .update(payload)
                    .eq('id', editingEduId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('worker_education')
                    .insert([payload]);
                if (error) throw error;
            }

            setIsAddingEdu(false);
            setEditingEduId(null);
            setEduForm({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
            fetchData();
        } catch (error) {
            console.error('Error saving education:', error);
            alert("Failed to save education.");
        } finally {
            setSaving(false);
        }
    };

    const handleEduDelete = async (eduId) => {
        setConfirmConfig({
            isOpen: true,
            title: "Delete Entry?",
            message: "Are you sure you want to delete this education entry? This cannot be undone.",
            variant: 'destructive',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, loading: true }));
                try {
                    const { error } = await supabase
                        .from('worker_education')
                        .delete()
                        .eq('id', eduId);
                    if (error) throw error;
                    fetchData();
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    console.error('Error deleting education:', error);
                    alert("Failed to delete education.");
                } finally {
                    setConfirmConfig(prev => ({ ...prev, loading: false }));
                }
            }
        });
    };

    const handleEduEdit = (edu) => {
        setEduForm({
            institution: edu.institution,
            degree: edu.degree || '',
            field_of_study: edu.field_of_study || '',
            start_year: edu.start_year.toString(),
            end_year: edu.end_year ? edu.end_year.toString() : ''
        });
        setEditingEduId(edu.id);
        setIsAddingEdu(true);
    };

    const handleAvailabilityUpdate = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('worker_availability')
                .update({
                    is_available: availability.is_available,
                    preferred_role_type: availability.preferred_role_type
                })
                .eq('worker_id', user.id);
            if (error) throw error;
            setIsEditingAvail(false);
            fetchData();
        } catch (error) {
            console.error('Error updating availability:', error);
            alert("Failed to update availability.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setConfirmConfig({
            isOpen: true,
            title: "Deactivate Account?",
            message: "This will hide your profile and applications from everyone. Are you sure you want to proceed?",
            variant: 'destructive',
            onConfirm: async () => {
                setConfirmConfig(prev => ({ ...prev, loading: true }));
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            is_deleted: true,
                            deleted_at: new Date().toISOString()
                        })
                        .eq('id', user.id);

                    if (error) throw error;

                    await supabase.auth.signOut();
                    router.push('/');
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert(`Failed to delete account: ${error.message}`);
                } finally {
                    setConfirmConfig(prev => ({ ...prev, loading: false, isOpen: false }));
                }
            }
        });
    };

    if (loading) return <HashLoader text="" />;

    const completeness = calculateCompleteness(profile, mySkills, myEducation, availability);

    return (
        <div className="profile-dashboard">
            <SectionHeader title="Worker Profile" />

            <PageContainer size="lg" style={{ paddingTop: '16px' }}>
                {/* Premium Hero Section */}
                <div className="ph-hero-card hw-premium-card" style={{ marginBottom: '24px' }}>
                    <div className="ph-hero-top">
                        <div className="ph-avatar-box">
                            <AvatarUpload 
                                userId={user.id}
                                userName={profile.first_name}
                                currentUrl={profile.avatar_url}
                                onUploadSuccess={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
                            />
                        </div>
                        <div className="ph-hero-info">
                            <div className="ph-name">{profile.first_name} {profile.last_name}</div>
                            <div className="ph-location"><FiFileText size={12} /> {profile.headline || 'Professional Freelancer'}</div>
                            <div className="ph-meta-row" style={{ marginTop: '12px' }}>
                                <div className="header-completeness" style={{ padding: 0, background: 'transparent' }}>
                                    <div className="header-comp-text">
                                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Profile Completeness {completeness}%</span>
                                    </div>
                                    <div className="header-comp-bar" style={{ width: '120px' }}>
                                        <div className="header-comp-fill" style={{ width: `${completeness}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-grid">
                {/* LEFT COLUMN */}
                <div className="profile-col-main">

                    {/* BASE INFO CARD */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-32)' }}>
                            <h2 className="sub-head-text">Identity Details</h2>
                            {!isEditingBase ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingBase(true)}>
                                    <FiEdit2 /> Edit Profile
                                </Button>
                            ) : (
                                <div className="edit-actions">
                                    <Button variant="ghost" size="sm" onClick={() => { setIsEditingBase(false); fetchData(); }}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={handleBaseSave} disabled={saving}>
                                        {saving ? "..." : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="card-body" style={{ padding: 0 }}>
                            {!isEditingBase ? (
                                <div className="info-display">
                                    <div className="hw-info-grid">
                                        <div className="hw-info-item">
                                            <label className="sub-para-text" style={{ marginBottom: '8px', display: 'block' }}>Username</label>
                                            <p className="para-text" style={{ color: 'var(--hw-text-primary)' }}>{profile.username || '@notset'}</p>
                                        </div>
                                        <div className="hw-info-item">
                                            <label className="sub-para-text" style={{ marginBottom: '8px', display: 'block' }}>Phone</label>
                                            <p className="para-text" style={{ color: 'var(--hw-text-primary)' }}>{profile.phone || 'Not set'}</p>
                                        </div>
                                        <div className="hw-info-item">
                                            <label className="sub-para-text" style={{ marginBottom: '8px', display: 'block' }}>Country</label>
                                            <p className="para-text" style={{ color: 'var(--hw-text-primary)' }}>{profile.country || 'Not set'}</p>
                                        </div>
                                    </div>

                                    <div className="hw-info-item" style={{ marginTop: '32px' }}>
                                        <label className="sub-para-text" style={{ marginBottom: '8px', display: 'block' }}>Bio {profile.bio ? '' : <span style={{ color: 'var(--hw-error)' }}>(Required)</span>}</label>
                                        <p className="para-text" style={{ color: 'var(--hw-text-secondary)', background: 'var(--hw-surface-high)', padding: '16px', borderRadius: '16px' }}>
                                            {profile.bio || 'Tell hirers about yourself. A bio is required to apply for jobs.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-edit-form">
                                    <div className="form-row">
                                        <div className="hw-floating-group">
                                            <label className="hw-floating-label">First Name</label>
                                            <input className="hw-floating-input" type="text" name="first_name" value={profile.first_name} onChange={handleBaseChange} />
                                        </div>
                                        <div className="hw-floating-group">
                                            <label className="hw-floating-label">Last Name</label>
                                            <input className="hw-floating-input" type="text" name="last_name" value={profile.last_name} onChange={handleBaseChange} />
                                        </div>
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Professional Headline</label>
                                        <input className="hw-floating-input" type="text" name="headline" placeholder="e.g. Senior React Developer" value={profile.headline} onChange={handleBaseChange} />
                                    </div>
                                    <div className="form-row">
                                        <div className="hw-floating-group">
                                            <label className="hw-floating-label">Username</label>
                                            <input className="hw-floating-input" type="text" name="username" value={profile.username} onChange={handleBaseChange} />
                                        </div>
                                        <div className="hw-floating-group">
                                            <label className="hw-floating-label">Phone</label>
                                            <input className="hw-floating-input" type="text" name="phone" value={profile.phone} onChange={handleBaseChange} />
                                        </div>
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Country</label>
                                        <input className="hw-floating-input" type="text" name="country" value={profile.country} onChange={handleBaseChange} />
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Bio *</label>
                                        <textarea className="hw-floating-input" name="bio" rows="4" value={profile.bio} onChange={handleBaseChange} placeholder="Write a professional summary..."></textarea>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* SKILLS SECTION */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-24)' }}>
                            <h2 className="sub-head-text">Expertise & Skills</h2>
                            {!isAddingSkill && (
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingSkill(true)}>
                                    <FiPlus /> Add Skill
                                </Button>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {isAddingSkill && (
                                <div className="hw-floating-group">
                                    <label className="hw-floating-label">Skill Name (Press Enter)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            autoFocus
                                            className="hw-floating-input"
                                            placeholder="e.g. React Native, Copywriting..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSkillAdd(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button className="hw-back-btn" onClick={() => setIsAddingSkill(false)} style={{ background: 'var(--hw-surface-high)' }}>
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="hw-chip-group">
                                {mySkills.length === 0 && !isAddingSkill ? (
                                    <p className="para-text" style={{ fontStyle: 'italic' }}>No skills added yet.</p>
                                ) : (
                                    mySkills.map(ws => (
                                        <div key={ws.id} className="hw-premium-chip" style={{ background: 'var(--hw-surface-highest)', border: '1.5px solid var(--hw-surface-high)', borderRadius: '16px', padding: '12px 20px' }}>
                                            <span className="para-text" style={{ color: 'var(--hw-text-primary)' }}>{ws.skills?.name}</span>
                                            <div className="hw-chip-remove" onClick={() => handleSkillRemove(ws.id)} style={{ color: 'var(--hw-text-secondary)' }}>
                                                <FiX size={16} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* EDUCATION SECTION */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-24)' }}>
                            <h2 className="sub-head-text">Education History</h2>
                            {!isAddingEdu && (
                                <Button variant="ghost" size="sm" onClick={() => setIsAddingEdu(true)}>
                                    <FiPlus /> Add Entry
                                </Button>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {isAddingEdu && (
                                <div className="hw-floating-group">
                                    <label className="hw-floating-label">Institution & Degree (Press Enter)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            autoFocus
                                            className="hw-floating-input"
                                            placeholder="e.g. B.Tech Computer Science, IIT Delhi (2023)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleEduSave({ institution: e.target.value, start_year: new Date().getFullYear() });
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button className="hw-back-btn" onClick={() => setIsAddingEdu(false)} style={{ background: 'var(--hw-surface-high)' }}>
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="education-list" style={{ marginTop: isAddingEdu ? '24px' : '0' }}>
                                {myEducation.length === 0 && !isAddingEdu ? (
                                    <p className="text-body-md" style={{ fontStyle: 'italic' }}>Qualification details will appear here.</p>
                                ) : (
                                    myEducation.map(edu => (
                                        <div key={edu.id} className="list-item" style={{ borderBottom: '1px solid var(--hw-surface-high)', padding: '20px 0' }}>
                                            <div className="li-header">
                                                <div style={{ flex: 1 }}>
                                                    <h3 className="sub-head-text" style={{ marginBottom: '4px' }}>{edu.institution}</h3>
                                                    <p className="para-text" style={{ color: 'var(--hw-text-secondary)' }}>
                                                        {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                                                    </p>
                                                    <p className="sub-para-text" style={{ marginTop: '8px', color: 'var(--hw-primary)' }}>
                                                        {edu.start_year} — {edu.end_year || 'PRESENT'}
                                                    </p>
                                                </div>
                                                <div className="li-actions" style={{ display: 'flex', gap: '12px' }}>
                                                    <button onClick={() => handleEduEdit(edu)} style={{ background: 'var(--hw-surface-high)', padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'var(--hw-text-secondary)' }}><FiEdit2 size={16} /></button>
                                                    <button onClick={() => handleEduDelete(edu.id)} style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'var(--hw-error)' }}><FiTrash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN */}
                <div className="profile-col-side" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hw-space-24)' }}>
                    
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px', background: 'var(--hw-primary-gradient)', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', marginBottom: '12px' }}>
                            <FiCheck size={20} strokeWidth={3} />
                            <h3 className="sub-head-text" style={{ color: '#fff', margin: 0 }}>Pro Profile Tip</h3>
                        </div>
                        <p className="para-text" style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                            Profiles with a professional headline and a detailed bio get 40% more job invitations.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <h2 className="sub-head-text hw-mb-24">Worker Pulse</h2>
                        <div className="profile-stats-grid">
                            <div className="premium-stat-card">
                                <span className="premium-stat-label">Earnings</span>
                                <span className="premium-stat-value">₹{stats.total_earnings.toLocaleString()}</span>
                            </div>
                            <div className="premium-stat-card">
                                <span className="premium-stat-label">Rating</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                                    <FiStar size={18} fill={stats.average_rating > 0 ? "#F59E0B" : "none"} color={stats.average_rating > 0 ? "#F59E0B" : "#94A3B8"} />
                                    <span className="premium-stat-value" style={{ margin: 0 }}>
                                        {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* AVAILABILITY CARD */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-24)' }}>
                            <h2 className="sub-head-text">Status</h2>
                            {!isEditingAvail ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingAvail(true)}>
                                    <FiEdit2 />
                                </Button>
                            ) : (
                                <div className="edit-actions">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingAvail(false)}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={handleAvailabilityUpdate} disabled={saving}>Save</Button>
                                </div>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {!isEditingAvail ? (
                                <div className="hw-flex hw-flex-col hw-gap-16">
                                    <div style={{ 
                                        padding: '16px', 
                                        borderRadius: '16px', 
                                        background: availability.is_available ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                        color: availability.is_available ? 'var(--hw-success)' : 'var(--hw-text-secondary)',
                                        textAlign: 'center',
                                        fontWeight: 500,
                                        fontSize: '14px',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {availability.is_available ? 'AVAILABLE FOR WORK' : 'CURRENTLY BUSY'}
                                    </div>
                                    <div className="avail-info">
                                        <label className="sub-para-text" style={{ marginBottom: '8px', display: 'block' }}>PREFERRED ROLE</label>
                                        <p className="para-text" style={{ color: 'var(--hw-text-primary)' }}>{availability.preferred_role_type}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="avail-edit">
                                    <div className="hw-switch-wrapper" style={{ marginBottom: '24px', border: '2px solid var(--hw-surface-high)', borderRadius: '18px' }}>
                                        <div className="hw-flex hw-gap-12 hw-items-center">
                                            <div>
                                                <p className="para-text" style={{ fontWeight: 500, color: 'var(--hw-text-primary)', margin: 0 }}>Open to work</p>
                                                <p className="sub-para-text" style={{ textTransform: 'none', margin: 0 }}>Show profile to hirers</p>
                                            </div>
                                        </div>
                                        <label className="hw-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={availability.is_available}
                                                onChange={(e) => setAvailability({ ...availability, is_available: e.target.checked })}
                                            />
                                            <span className="hw-switch-slider"></span>
                                        </label>
                                    </div>

                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Preferred Role Type</label>
                                        <select
                                            value={availability.preferred_role_type}
                                            onChange={(e) => setAvailability({ ...availability, preferred_role_type: e.target.value })}
                                            className="hw-floating-input"
                                            style={{ appearance: 'none' }}
                                        >
                                            <option value="internship">Internship</option>
                                            <option value="gig">Gig / Freelance</option>
                                            <option value="full_time">Full-time</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div style={{ marginTop: '32px', marginBottom: '16px' }}>
                        <Button
                            variant="primary"
                            onClick={handleLogout}
                            style={{ 
                                width: '100%', 
                                height: '56px', 
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                fontWeight: 500,
                                fontSize: '16px',
                                background: '#1e293b'
                            }}
                        >
                            <FiLogOut size={20} /> Logout Account
                        </Button>
                    </div>

                    <div className="profile-card delete-card" style={{ marginTop: '12px', border: '2px solid rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.02)' }}>
                        <h3 className="text-label-sm" style={{ color: 'var(--hw-error)', marginBottom: '12px' }}>Account Security</h3>
                        <p className="text-body-sm" style={{ color: 'var(--hw-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                            Deactivating your account will hide your identity and all active applications immediately.
                        </p>
                        <Button
                            variant="danger"
                            onClick={handleDeleteAccount}
                            disabled={saving}
                            style={{ width: '100%', height: '48px', borderRadius: '14px' }}
                        >
                            {saving ? "..." : 'Deactivate Account'}
                        </Button>
                    </div>
                </div>
            </div>
            </PageContainer>
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant={confirmConfig.variant}
                loading={confirmConfig.loading}
            />
        </div>
    );
}
