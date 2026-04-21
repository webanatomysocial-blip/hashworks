'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader.jsx';
import { FiArrowLeft, FiArrowRight, FiCamera, FiCheck, FiSearch, FiUser, FiX } from 'react-icons/fi';
import '@/css/role.css';

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);

    // Form Data
    const [fullName, setFullName] = useState('');
    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        country: '',
        username: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkUser = async () => {
             const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login');
                return;
            }
            setUser(authUser);

            // Check if profile already exists and has data to skip bios step if needed
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                if (profile.first_name || profile.last_name) {
                    setFullName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
                } else if (authUser.user_metadata?.first_name) {
                    setFullName(`${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name || ''}`.trim());
                }
                
                if (profile.headline) setFormData(prev => ({ ...prev, headline: profile.headline }));
                if (profile.bio) setFormData(prev => ({ ...prev, bio: profile.bio }));
                if (profile.country) setFormData(prev => ({ ...prev, country: profile.country }));
                if (profile.username) {
                    setFormData(prev => ({ ...prev, username: profile.username }));
                } else if (authUser.user_metadata?.username) {
                    setFormData(prev => ({ ...prev, username: authUser.user_metadata.username }));
                }

                if (profile.avatar_url) {
                    setAvatarPreview(profile.avatar_url);
                }
            } else if (authUser.user_metadata) {
                if (authUser.user_metadata.first_name) {
                    setFullName(`${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name || ''}`.trim());
                }
                if (authUser.user_metadata.username) {
                    setFormData(prev => ({ ...prev, username: authUser.user_metadata.username }));
                }
            }
            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let avatarUrl = avatarPreview;

            // 1. Upload Avatar if new file exists
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${user.id}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('Avatar')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('Avatar')
                    .getPublicUrl(filePath);
                
                avatarUrl = publicUrl;
            }

            // 2. Upsert Profile
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    first_name: firstName,
                    last_name: lastName,
                    headline: formData.headline,
                    bio: formData.bio,
                    country: formData.country,
                    username: formData.username,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            setStep(2);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message || 'Please try again'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRoleSubmit = async (role) => {
        setSelectedRole(role);
        setSubmitting(true);
        // We could save the preferred role to profile here if needed
        // For now, just redirect
        setTimeout(() => {
            router.push(`/${role}`);
        }, 500);
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HashLoader text="" /></div>;
    }

    return (
        <div className="onboarding-container">
            {/* Header - Only for Step 2 */}
            {step === 2 && (
                <div className="onboarding-header">
                    <div className="onboarding-header-left">
                         <button className="onboarding-back-btn" onClick={() => setStep(1)}>
                            <FiArrowLeft size={20} />
                        </button>
                        <span className="onboarding-logo-text">Hashworks</span>
                    </div>
                    <button className="onboarding-back-btn" onClick={() => router.push('/')}>
                        <FiX size={20} />
                    </button>
                    <div className="onboarding-progress-bar">
                        <div className="progress-fill" style={{ width: '100%' }}></div>
                    </div>
                </div>
            )}

            {step === 1 ? (
                /* STEP 1: BIO */
                <div className="onboarding-content">
                    <h1 className="onboarding-title">Who are you?</h1>
                    <p className="onboarding-subtitle">Let&apos;s set up your profile to start building your professional identity on Hashworks.</p>

                    <div className="avatar-section">
                        <div className="avatar-upload-wrapper" onClick={() => fileInputRef.current.click()}>
                            <div className={`avatar-circle ${avatarPreview ? 'has-image' : ''}`}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="avatar-image" alt="Preview" />
                                ) : (
                                    <FiCamera className="avatar-placeholder-icon" size={32} />
                                )}
                            </div>
                            <div className="avatar-edit-btn">
                                <FiCamera size={14} />
                            </div>
                        </div>
                        <div className="avatar-info-box">
                            <span className="avatar-info-label">Profile Photo</span>
                            <span className="avatar-info-sub">JPG or PNG, max 3MB.</span>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                    </div>

                    <form className="onboarding-form" onSubmit={handleStep1Submit}>
                        <div className="input-group">
                            <label className="input-label">Full Name *</label>
                            <input 
                                type="text" 
                                className="onboarding-input" 
                                placeholder="e.g. John Doe" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Username *</label>
                            <input 
                                type="text" 
                                className="onboarding-input" 
                                placeholder="e.g. johndoe" 
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Professional Headline</label>
                            <input 
                                type="text" 
                                className="onboarding-input" 
                                placeholder="e.g. Full Stack Developer" 
                                value={formData.headline}
                                onChange={(e) => setFormData({...formData, headline: e.target.value})}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Country</label>
                            <input 
                                type="text" 
                                className="onboarding-input" 
                                placeholder="e.g. India" 
                                value={formData.country}
                                onChange={(e) => setFormData({...formData, country: e.target.value})}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Short Bio</label>
                            <textarea
                                className="onboarding-input" 
                                rows={3}
                                placeholder="Tell us a little about yourself..." 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            />
                        </div>

                        <button type="submit" className="onboarding-submit-btn" disabled={submitting || !fullName.trim() || !formData.username.trim()}>
                            {submitting ? <HashLoader text="" inline /> : (
                                <>
                                    Continue <FiArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <footer style={{ marginTop: 'auto', padding: '24px 0', textAlign: 'center' }}>
                         <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                            By continuing, you agree to our <a href="#" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms of Service</a>.
                        </p>
                    </footer>
                </div>
            ) : (
                /* STEP 2: GOAL */
                <div className="onboarding-content">
                    <h1 className="onboarding-title">I want to...</h1>
                    <p className="onboarding-subtitle">Select your primary goal to personalize your Hashworks experience.</p>

                    <div className="goal-cards-container">
                        <div 
                            className={`goal-card ${selectedRole === 'worker' ? 'selected' : ''}`}
                            onClick={() => handleRoleSubmit('worker')}
                        >
                            <div className="goal-icon-box" style={{ background: '#0047ff' }}>
                                <FiSearch size={28} />
                            </div>
                            <div className="goal-content">
                                <h3 className="goal-title">Find Work</h3>
                                <p className="goal-desc">Browse and accept nearby gigs instantly</p>
                            </div>
                        </div>

                        <div 
                            className={`goal-card ${selectedRole === 'hirer' ? 'selected' : ''}`}
                            onClick={() => handleRoleSubmit('hirer')}
                        >
                            <div className="goal-icon-box" style={{ background: '#C8FF2C', color: '#0f172a' }}>
                                <FiCheck size={28} />
                            </div>
                            <div className="goal-content">
                                <h3 className="goal-title">Post Task</h3>
                                <p className="goal-desc">Get reliable help for small tasks</p>
                            </div>
                        </div>
                    </div>

                  
                </div>
            )}
        </div>
    );
}
