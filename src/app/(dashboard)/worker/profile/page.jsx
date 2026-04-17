'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiEdit2, FiPlus, FiTrash2, FiSave, FiX, FiFileText } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import AvatarUpload from '@/Components/profile/AvatarUpload';
import ResumeUpload from '@/Components/profile/ResumeUpload';
import '@/css/profile.css';

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

    const handleSkillAdd = async (skillId) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('worker_skills')
                .insert([{ worker_id: user.id, skill_id: skillId }]);

            if (error) throw error;
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

    const handleEduSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...eduForm,
                worker_id: user.id,
                start_year: parseInt(eduForm.start_year),
                end_year: eduForm.end_year ? parseInt(eduForm.end_year) : null
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
        if (!confirm("Are you sure you want to delete this education entry?")) return;
        try {
            const { error } = await supabase
                .from('worker_education')
                .delete()
                .eq('id', eduId);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting education:', error);
            alert("Failed to delete education.");
        }
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
        if (!confirm("This will hide your profile and applications from everyone.")) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            alert("Account deleted successfully.");
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert(`Failed to delete account: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <HashLoader text="" />;

    const completeness = calculateCompleteness();

    return (
        <div className="profile-dashboard">
            <header className="profile-header">
                <div>
                    <h1>Worker Profile</h1>
                </div>
                <div className="completeness-indicator">
                    <div className="comp-text">
                        <span>Profile Completeness</span>
                        <span>{completeness}%</span>
                    </div>
                    <div className="comp-bar-bg">
                        <div className="comp-bar-fill" style={{ width: `${completeness}%` }}></div>
                    </div>
                </div>
            </header>

            <div className="profile-grid">
                {/* LEFT COLUMN */}
                <div className="profile-col-main">

                    {/* BASE INFO CARD */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Basic Information</h2>
                            {!isEditingBase ? (
                                <button className="edit-icon-btn" onClick={() => setIsEditingBase(true)}>
                                    <FiEdit2 /> Edit
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => { setIsEditingBase(false); fetchData(); }}>Cancel</button>
                                    <button className="save-btn" onClick={handleBaseSave} disabled={saving}>
                                        {saving ? <HashLoader text="" /> : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="card-body">
                            {!isEditingBase ? (
                                <div className="info-display">
                                    <div className="avatar-section">
                                        <AvatarUpload 
                                            userId={user.id}
                                            userName={profile.first_name}
                                            currentUrl={profile.avatar_url}
                                            onUploadSuccess={(url) => setProfile(prev => ({ ...prev, avatar_url: url }))}
                                        />
                                        <div className="avatar-titles">
                                            <h3>{profile.first_name} {profile.last_name}</h3>
                                            <p className="headline-text">{profile.headline || 'Add a professional headline'}</p>
                                        </div>
                                    </div>

                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Username</label>
                                            <p>{profile.username || 'Not set'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Phone</label>
                                            <p>{profile.phone || 'Not set'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Country</label>
                                            <p>{profile.country || 'Not set'}</p>
                                        </div>
                                    </div>

                                    <div className="info-item full-width">
                                        <label>Bio {profile.bio ? '' : <span className="req-badge">Required</span>}</label>
                                        <p className="bio-text">{profile.bio || 'Tell hirers about yourself. A bio is required to apply for jobs.'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-edit-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <input type="text" name="first_name" value={profile.first_name} onChange={handleBaseChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input type="text" name="last_name" value={profile.last_name} onChange={handleBaseChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Professional Headline</label>
                                        <input type="text" name="headline" placeholder="e.g. Senior React Developer" value={profile.headline} onChange={handleBaseChange} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Username</label>
                                            <input type="text" name="username" value={profile.username} onChange={handleBaseChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input type="text" name="phone" value={profile.phone} onChange={handleBaseChange} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input type="text" name="country" value={profile.country} onChange={handleBaseChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Bio *</label>
                                        <textarea name="bio" rows="4" value={profile.bio} onChange={handleBaseChange} placeholder="Write a professional summary..."></textarea>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SKILLS SECTION */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Skills</h2>
                            {!isAddingSkill && (
                                <button className="add-text-btn" onClick={() => setIsAddingSkill(true)}>
                                    <FiPlus /> Add Skill
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {isAddingSkill && (
                                <div className="add-skill-form">
                                    <div className="skill-search-container">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) handleSkillAdd(e.target.value);
                                            }}
                                            defaultValue=""
                                            className="skill-select"
                                        >
                                            <option value="" disabled>Select a skill...</option>
                                            {allSkills
                                                .filter(s => !mySkills.some(ms => ms.skill_id === s.id))
                                                .map(skill => (
                                                    <option key={skill.id} value={skill.id}>{skill.name}</option>
                                                ))
                                            }
                                        </select>
                                        <button className="cancel-icon-btn" onClick={() => setIsAddingSkill(false)}><FiX /></button>
                                    </div>
                                </div>
                            )}

                            <div className="skills-container">
                                {mySkills.length === 0 ? (
                                    <p className="empty-text">No skills added yet.</p>
                                ) : (
                                    mySkills.map(ws => (
                                        <div key={ws.id} className="skill-tag">
                                            <span>{ws.skills?.name}</span>
                                            <FiX className="skill-remove" onClick={() => handleSkillRemove(ws.id)} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENTS SECTION */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Documents</h2>
                        </div>
                        <div className="card-body">
                            <ResumeUpload 
                                userId={user?.id}
                                resumePath={profile.resume_path}
                                onUploadSuccess={(path) => setProfile(prev => ({ ...prev, resume_path: path }))}
                            />
                        </div>
                    </div>

                    {/* EDUCATION SECTION */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Education</h2>
                            {!isAddingEdu && (
                                <button className="add-text-btn" onClick={() => setIsAddingEdu(true)}>
                                    <FiPlus /> Add Education
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            {isAddingEdu && (
                                <div className="edu-form">
                                    <div className="form-group">
                                        <label>Institution *</label>
                                        <input
                                            type="text"
                                            value={eduForm.institution}
                                            onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                                            placeholder="e.g. Stanford University"
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Degree</label>
                                            <input
                                                type="text"
                                                value={eduForm.degree}
                                                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                                                placeholder="e.g. Bachelor of Science"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Field of Study</label>
                                            <input
                                                type="text"
                                                value={eduForm.field_of_study}
                                                onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })}
                                                placeholder="e.g. Computer Science"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Start Year *</label>
                                            <input
                                                type="number"
                                                value={eduForm.start_year}
                                                onChange={(e) => setEduForm({ ...eduForm, start_year: e.target.value })}
                                                placeholder="2018"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>End Year (or Expected)</label>
                                            <input
                                                type="number"
                                                value={eduForm.end_year}
                                                onChange={(e) => setEduForm({ ...eduForm, end_year: e.target.value })}
                                                placeholder="2022"
                                            />
                                        </div>
                                    </div>
                                    <div className="edit-actions" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button className="cancel-btn" onClick={() => {
                                            setIsAddingEdu(false);
                                            setEditingEduId(null);
                                            setEduForm({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
                                        }}>Cancel</button>
                                        <button className="save-btn" onClick={handleEduSave} disabled={saving || !eduForm.institution || !eduForm.start_year}>
                                            {saving ? <HashLoader text="" /> : 'Save Education'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="education-list" style={{ marginTop: isAddingEdu ? '24px' : '0' }}>
                                {myEducation.length === 0 && !isAddingEdu ? (
                                    <p className="empty-text">No education history added.</p>
                                ) : (
                                    myEducation.map(edu => (
                                        <div key={edu.id} className="list-item">
                                            <div className="li-header">
                                                <div>
                                                    <h3 className="li-title">{edu.institution}</h3>
                                                    <p className="li-subtitle">
                                                        {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                                                    </p>
                                                    <p className="li-meta" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                                        {edu.start_year} - {edu.end_year || 'Present'}
                                                    </p>
                                                </div>
                                                <div className="li-actions">
                                                    <button onClick={() => handleEduEdit(edu)}><FiEdit2 size={16} /></button>
                                                    <button onClick={() => handleEduDelete(edu.id)} style={{ color: '#fca5a5' }}><FiTrash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="profile-col-side">

                    {/* STATS CARD */}
                    <div className="profile-card stats-card">
                        <h2>Your Stats</h2>
                        <div className="stat-item">
                            <span className="stat-label">Jobs Completed</span>
                            <span className="stat-value">{stats.total_jobs_completed}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Earnings</span>
                            <span className="stat-value">₹{stats.total_earnings.toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Average Rating</span>
                            <span className="stat-value">
                                {stats.average_rating > 0 ? `★${stats.average_rating.toFixed(1)}` : '• NEW'}
                            </span>
                        </div>
                    </div>

                    {/* AVAILABILITY CARD */}
                    <div className="profile-card availability-card">
                        <div className="card-header">
                            <h2>Availability</h2>
                            {!isEditingAvail ? (
                                <button className="edit-icon-btn" onClick={() => setIsEditingAvail(true)}>
                                    <FiEdit2 />
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => setIsEditingAvail(false)}>Cancel</button>
                                    <button className="save-btn" onClick={handleAvailabilityUpdate} disabled={saving}>Save</button>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {!isEditingAvail ? (
                                <>
                                    <p className={`status-badge ${availability.is_available ? 'active' : 'inactive'}`}>
                                        {availability.is_available ? 'Available for Work' : 'Not Available'}
                                    </p>
                                    <div className="avail-info" style={{ marginTop: '16px' }}>
                                        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>PREFERRED ROLE</label>
                                        <p style={{ margin: '4px 0 0 0', fontWeight: '600', textTransform: 'capitalize' }}>{availability.preferred_role_type}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="avail-edit">
                                    <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px' }}>
                                        <input
                                            type="checkbox"
                                            checked={availability.is_available}
                                            onChange={(e) => setAvailability({ ...availability, is_available: e.target.checked })}
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: '600' }}>Available for new opportunities</span>
                                    </label>
                                    <div className="form-group">
                                        <label>Preferred Role Type</label>
                                        <select
                                            value={availability.preferred_role_type}
                                            onChange={(e) => setAvailability({ ...availability, preferred_role_type: e.target.value })}
                                            className="skill-select"
                                        >
                                            <option value="internship">Internship</option>
                                            <option value="gig">Gig / Freelance</option>
                                            <option value="full_time">Full-time</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-card delete-card" style={{ marginTop: '20px', border: '1px solid #fee2e2', padding: '20px' }}>
                        <h3 style={{ color: '#991b1b', fontSize: '16px', marginBottom: '8px' }}>Delete Account</h3>
                      
                        <button
                            className="delete-account-btn"
                            onClick={handleDeleteAccount}
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            {saving ? <HashLoader text="" /> : 'Delete My Account'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );

    function calculateCompleteness() {
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
}
