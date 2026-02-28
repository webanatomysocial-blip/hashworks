'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiEdit2, FiSave, FiCheckCircle, FiPlus } from 'react-icons/fi';
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
                    country: profileData.country || '',
                    avatar_url: profileData.avatar_url || '',
                });
            }

            // Fetch Company Details
            const { data: companyData } = await supabase
                .from('company_details')
                .select('*')
                .eq('hirer_id', user.id)
                .single();

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

        } catch (error) {
            console.error('Error fetching hirer profile:', error);
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
                country: profile.country,
            };

            // Only include username if it has a value to avoid unique constraint 
            // violations on empty strings if one is already taken.
            if (profile.username && profile.username.trim() !== '') {
                updateData.username = profile.username;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;
            setIsEditingBase(false);
            fetchData();
        } catch (error) {
            console.error('Error saving base profile:', error);
            alert(`Failed to save profile: ${error.message || 'Unknown error'}`);
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
                .single();

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
            fetchData();
        } catch (error) {
            console.error('Error saving company:', error);
            alert(`Failed to save company details: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure? This will hide your profile and jobs from everyone. You can contact support to recover it.")) return;

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

    if (loading) return <div className="profile-loading">Loading Hirer Profile...</div>;

    const companyComplete = !!company.company_name;

    return (
        <div className="profile-dashboard">
            <header className="profile-header">
                <div>
                    <h1>Hirer Profile</h1>
                </div>
                <div className="completeness-indicator">
                    <div className="comp-text">
                        <span>Company Status</span>
                        <span>{companyComplete ? 'Ready to Post' : 'Incomplete'}</span>
                    </div>
                    <div className="comp-bar-bg">
                        <div className="comp-bar-fill" style={{ width: companyComplete ? '100%' : '50%', background: companyComplete ? '#10b981' : '#f59e0b' }}></div>
                    </div>
                </div>
            </header>

            <div className="profile-grid">
                <div className="profile-col-main">

                    {/* BASE INFO */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Recruiter Information</h2>
                            {!isEditingBase ? (
                                <button className="edit-icon-btn" onClick={() => setIsEditingBase(true)}>
                                    <FiEdit2 /> Edit
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => setIsEditingBase(false)}>Cancel</button>
                                    <button className="save-btn" onClick={handleBaseSave} disabled={saving}>Save</button>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {!isEditingBase ? (
                                <div className="info-display">
                                    <div className="avatar-section">
                                        <div className="avatar-circle">
                                            {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" /> : <span>{profile.first_name?.charAt(0)}</span>}
                                        </div>
                                        <div className="avatar-titles">
                                            <h3>{profile.first_name} {profile.last_name}</h3>
                                            <p className="headline-text">Official Hirer Account</p>
                                        </div>
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Phone</label>
                                            <p>{profile.phone || 'Not set'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label>Country</label>
                                            <p>{profile.country || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-edit-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>First Name</label>
                                            <input type="text" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Last Name</label>
                                            <input type="text" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Country</label>
                                            <input type="text" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COMPANY DETAILS */}
                    <div className="profile-card">
                        <div className="card-header">
                            <h2>Company Details</h2>
                            {!isEditingCompany ? (
                                <button className="edit-icon-btn" onClick={() => setIsEditingCompany(true)}>
                                    <FiEdit2 /> Edit
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="cancel-btn" onClick={() => setIsEditingCompany(false)}>Cancel</button>
                                    <button className="save-btn" onClick={handleCompanySave} disabled={saving}>Save Company</button>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            {!isEditingCompany ? (
                                company.company_name ? (
                                    <div className="info-display">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>Company Name</label>
                                                <p>{company.company_name}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Industry</label>
                                                <p>{company.industry || 'Not set'}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Website</label>
                                                <p>{company.website || 'Not set'}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Company Size</label>
                                                <p>{company.company_size || 'Not set'}</p>
                                            </div>
                                        </div>
                                        <div className="info-item full-width" style={{ marginTop: '20px' }}>
                                            <label>About Company</label>
                                            <p className="bio-text">{company.company_description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state-cta">
                                        <p>You haven't set up your company profile yet.</p>
                                        <button className="setup-btn" onClick={() => setIsEditingCompany(true)}>
                                            <FiPlus /> Set Up Company Profile
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="info-edit-form">
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input type="text" value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} placeholder="e.g. HashWorks Inc." />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Industry</label>
                                            <input type="text" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} placeholder="e.g. Tech Services" />
                                        </div>
                                        <div className="form-group">
                                            <label>Website</label>
                                            <input type="text" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Company Size</label>
                                            <select value={company.company_size} onChange={(e) => setCompany({ ...company, company_size: e.target.value })} className="skill-select">
                                                <option value="">Select size...</option>
                                                <option value="1-10">1-10 employees</option>
                                                <option value="11-50">11-50 employees</option>
                                                <option value="51-200">51-200 employees</option>
                                                <option value="201-500">201-500 employees</option>
                                                <option value="500+">500+ employees</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Founded Year</label>
                                            <input type="number" value={company.founded_year} onChange={(e) => setCompany({ ...company, founded_year: e.target.value })} placeholder="2020" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Company Description</label>
                                        <textarea rows="4" value={company.company_description} onChange={(e) => setCompany({ ...company, company_description: e.target.value })} placeholder="Tell workers about your company culture and mission..."></textarea>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-col-side">
                    <div className="profile-card stats-card">
                        <h2>Quick Stats</h2>
                        <div className="stat-item">
                            <span className="stat-label">Active Postings</span>
                            <span className="stat-value">0</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Total Spent</span>
                            <span className="stat-value">₹0</span>
                        </div>
                    </div>

                    {!companyComplete && (
                        <div className="alert-card warning">
                            <h3>Complete Profile</h3>
                            <p>You must set up a company profile before you can post any jobs.</p>
                        </div>
                    )}

                    <div className="profile-card delete-card" style={{ marginTop: '20px', border: '1px solid #fee2e2', padding: '20px' }}>
                        <h3 style={{ color: '#991b1b', fontSize: '16px', marginBottom: '8px' }}>Danger Zone</h3>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                            Soft-deleting your account will hide your profile and all your job postings from the platform.
                        </p>
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
                            {saving ? 'Processing...' : 'Delete My Account'}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .setup-btn {
                    margin-top: 12px;
                    padding: 12px 24px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .empty-state-cta {
                    text-align: center;
                    padding: 40px 0;
                    color: #64748b;
                }
                .alert-card.warning {
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    padding: 20px;
                    border-radius: 16px;
                }
                .alert-card.warning h3 {
                    color: #92400e;
                    font-size: 16px;
                    margin: 0 0 8px 0;
                }
                .alert-card.warning p {
                    color: #b45309;
                    font-size: 14px;
                    margin: 0;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
