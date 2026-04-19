'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiEdit2, FiSave, FiCheckCircle, FiPlus, FiArrowLeft, FiTrash2, FiChevronLeft, FiCheck, FiLogOut } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/Button";
import { Input, TextArea } from "@/Components/ui/Input";
import { Badge } from "@/Components/ui/Badge";
import '@/css/profile.css';

export default function HirerProfilePage() {
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
        country: '',
        avatar_url: '',
    });

    const [company, setCompany] = useState({
        company_name: '',
        industry: '',
        company_size: '',
        website: '',
        founded_year: '',
        company_description: ''
    });

    const [isEditingBase, setIsEditingBase] = useState(false);
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    
    // Stats State
    const [hiringStats, setHiringStats] = useState({
        activeJobs: 0,
        totalHires: 0,
        rating: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            // Fetch Base Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    username: profileData.username || '',
                    phone: profileData.phone || '',
                    country: profileData.country || '',
                    avatar_url: profileData.avatar_url || '',
                });
                setHiringStats(prev => ({ ...prev, rating: profileData.average_rating || 0 }));
            }

            // Fetch Company Details
            const { data: companyData } = await supabase
                .from('company_details')
                .select('*')
                .eq('hirer_id', user.id)
                .maybeSingle();

            if (companyData) {
                setCompany({
                    company_name: companyData.company_name || '',
                    industry: companyData.industry || '',
                    company_size: companyData.company_size || '',
                    website: companyData.website || '',
                    founded_year: companyData.founded_year ? companyData.founded_year.toString() : '',
                    company_description: companyData.company_description || ''
                });
            }

            // Fetch Dynamic Stats
            const [jobsCount, hiresCount] = await Promise.all([
                supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('hirer_id', user.id).eq('status', 'active'),
                supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('hirer_id', user.id)
            ]);

            setHiringStats(prev => ({
                ...prev,
                activeJobs: jobsCount.count || 0,
                totalHires: hiresCount.count || 0
            }));

        } catch (error) {
            console.error('Error fetching hirer profile:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                country: profile.country,
                updated_at: new Date().toISOString()
            };

            if (profile.username && profile.username.trim() !== '') {
                updateData.username = profile.username.trim();
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            setIsEditingBase(false);
        } catch (error) {
            console.error('Error saving base profile:', error);
            alert(`Failed to save profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCompanySave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...company,
                hirer_id: user.id,
                founded_year: company.founded_year ? parseInt(company.founded_year) : null
            };

            const { data: existing } = await supabase
                .from('company_details')
                .select('id')
                .eq('hirer_id', user.id)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('company_details')
                    .update(payload)
                    .eq('hirer_id', user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('company_details')
                    .insert([payload]);
                if (error) throw error;
            }

            setIsEditingCompany(false);
        } catch (error) {
            console.error('Error saving company:', error);
            alert(`Failed to save company: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure? This will hide your profile and jobs. This action is significant.")) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error deleting account:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <HashLoader text="" />;

    const companyComplete = !!company.company_name;

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
                    <h2 className="hw-profile-title">Hirer Profile</h2>
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
                        <div className="profile-avatar-placeholder">
                            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.first_name?.charAt(0) || 'H')}
                        </div>
                        <div className="profile-status-ring">
                            <div className="profile-status-dot"></div>
                        </div>
                    </div>
                    <h1 className="text-display-lg" style={{ color: '#0F172A', marginBottom: '8px' }}>
                        {profile.first_name} {profile.last_name}
                    </h1>
                    <Badge variant={companyComplete ? "active" : "waiting"} showDot>
                        {companyComplete ? "Verified Hirer" : "Incomplete Profile"}
                    </Badge>
                </div>
            </section>

            <div className="profile-grid" style={{ marginTop: '0' }}>
                {/* LEFT COLUMN */}
                <div className="profile-col-main">
                    
                    {/* IDENTITY CARD */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-32)' }}>
                            <h2 className="text-headline-md">Recruiter Profile</h2>
                            {!isEditingBase ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingBase(true)}>
                                    <FiEdit2 /> Edit Profile
                                </Button>
                            ) : (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingBase(false)}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={handleBaseSave} disabled={saving}>{saving ? "..." : "Save Changes"}</Button>
                                </div>
                            )}
                        </div>

                        {!isEditingBase ? (
                            <div className="info-display">
                                <div className="hw-info-grid">
                                    <div className="hw-info-item">
                                        <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Full Name</label>
                                        <p className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{profile.first_name} {profile.last_name}</p>
                                    </div>
                                    <div className="hw-info-item">
                                        <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Username</label>
                                        <p className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{profile.username ? `@${profile.username}` : '@hirer_id'}</p>
                                    </div>
                                    <div className="hw-info-item">
                                        <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Contact Phone</label>
                                        <p className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{profile.phone || '—'}</p>
                                    </div>
                                    <div className="hw-info-item">
                                        <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Location</label>
                                        <p className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{profile.country || '—'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="form-row">
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">First Name</label>
                                        <input className="hw-floating-input" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Last Name</label>
                                        <input className="hw-floating-input" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Phone Number</label>
                                        <input className="hw-floating-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Country</label>
                                        <input className="hw-floating-input" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                                    </div>
                                </div>
                                <div className="hw-floating-group">
                                    <label className="hw-floating-label">Username</label>
                                    <input className="hw-floating-input" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* COMPANY DETAILS CARD */}
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--hw-space-32)' }}>
                            <h2 className="text-headline-md">Company Branding</h2>
                            {!isEditingCompany ? (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingCompany(true)}>
                                    <FiEdit2 /> Edit Brand
                                </Button>
                            ) : (
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingCompany(false)}>Cancel</Button>
                                    <Button variant="primary" size="sm" onClick={handleCompanySave} disabled={saving}>{saving ? "..." : "Save Company"}</Button>
                                </div>
                            )}
                        </div>

                        {!isEditingCompany ? (
                            companyComplete ? (
                                <div className="info-display">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', marginBottom: '24px', borderBottom: '1.5px solid var(--hw-surface-high)' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--hw-surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--hw-primary)', fontWeight: 800 }}>
                                            {company.company_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-headline-md" style={{ marginBottom: '4px' }}>{company.company_name}</h3>
                                            <p className="text-body-md" style={{ color: 'var(--hw-text-secondary)', fontWeight: 600 }}>{company.industry} • {company.company_size} employees</p>
                                        </div>
                                    </div>

                                    <div className="hw-info-grid">
                                        <div className="hw-info-item">
                                            <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Website</label>
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-body-md" style={{ color: 'var(--hw-primary)', fontWeight: 700 }}>{company.website || '—'}</a>
                                        </div>
                                        <div className="hw-info-item">
                                            <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>Founded Year</label>
                                            <p className="text-body-md" style={{ color: 'var(--hw-text-primary)', fontWeight: 700 }}>{company.founded_year || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="hw-info-item" style={{ marginTop: '32px' }}>
                                        <label className="text-label-sm" style={{ marginBottom: '8px', display: 'block' }}>About Company</label>
                                        <p className="text-body-md" style={{ lineHeight: 1.7, color: 'var(--hw-text-secondary)', background: 'var(--hw-surface-high)', padding: '20px', borderRadius: '16px' }}>
                                            {company.company_description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <p className="text-body-md" style={{ color: 'var(--hw-text-secondary)', marginBottom: '20px' }}>Your company details are missing.</p>
                                    <Button variant="primary" size="md" onClick={() => setIsEditingCompany(true)}>Complete Branding</Button>
                                </div>
                            )
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="hw-floating-group">
                                    <label className="hw-floating-label">Company Name</label>
                                    <input className="hw-floating-input" value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Industry</label>
                                        <input className="hw-floating-input" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} />
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Company Size</label>
                                        <select className="hw-floating-input" value={company.company_size} onChange={(e) => setCompany({ ...company, company_size: e.target.value })} style={{ appearance: 'none' }}>
                                            <option value="">Select Size</option>
                                            <option value="1-10">1-10</option>
                                            <option value="11-50">11-50</option>
                                            <option value="51-200">51-200</option>
                                            <option value="201-500">201-500</option>
                                            <option value="500+">500+</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Website URL</label>
                                        <input className="hw-floating-input" type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
                                    </div>
                                    <div className="hw-floating-group">
                                        <label className="hw-floating-label">Founded Year</label>
                                        <input className="hw-floating-input" type="number" value={company.founded_year} onChange={(e) => setCompany({ ...company, founded_year: e.target.value })} />
                                    </div>
                                </div>
                                <div className="hw-floating-group">
                                    <label className="hw-floating-label">Company Description</label>
                                    <textarea className="hw-floating-input" value={company.company_description} onChange={(e) => setCompany({ ...company, company_description: e.target.value })} rows="4" />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="profile-col-side" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hw-space-24)' }}>
                    
                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px', background: 'var(--hw-primary-gradient)', border: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', marginBottom: '12px' }}>
                            <FiSave size={20} strokeWidth={3} />
                            <h3 className="text-title-md" style={{ color: '#fff', margin: 0 }}>Trust & Reliability</h3>
                        </div>
                        <p className="text-body-md" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, margin: 0 }}>
                            A complete hirer profile increases application quality by 65%. Workers trust verified brands.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="xl" style={{ borderRadius: '24px' }}>
                        <h3 className="text-headline-md hw-mb-24">Hiring Stats</h3>
                        <div className="profile-stats-grid">
                            <div className="premium-stat-card">
                                <span className="premium-stat-label">Active Jobs</span>
                                <span className="premium-stat-value">{hiringStats.activeJobs}</span>
                            </div>
                            <div className="premium-stat-card">
                                <span className="premium-stat-label">Hires</span>
                                <span className="premium-stat-value">{hiringStats.totalHires}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '16px', background: 'var(--hw-surface-high)', textAlign: 'center' }}>
                            <p className="text-label-sm" style={{ marginBottom: '4px' }}>Average Rating</p>
                            <p className="text-display-sm" style={{ color: 'var(--hw-primary)', margin: 0 }}>★ {Number(hiringStats.rating).toFixed(1)}</p>
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
                                fontWeight: 800,
                                fontSize: '16px',
                                background: '#1e293b'
                            }}
                        >
                            <FiLogOut size={20} /> Logout Account
                        </Button>
                    </div>

                    <div className="profile-card delete-card" style={{ marginTop: '12px', border: '2px solid rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.02)' }}>
                        <h3 className="text-label-sm" style={{ color: 'var(--hw-error)', marginBottom: '12px' }}>Account Settings</h3>
                        <p className="text-body-sm" style={{ color: 'var(--hw-text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                            Closing your account will hide your identity and all active postings immediately.
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
        </div>
    );
}
