'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiEdit2, FiSave, FiCheckCircle, FiPlus, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
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

        } catch (error) {
            console.error('Error fetching hirer profile:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        <div className="wh-dashboard" style={{ padding: 'var(--space-xl) 0' }}>
            <PageContainer>
                <header style={{ marginBottom: 'var(--space-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="text-display-xl" style={{ fontSize: '32px' }}>Profile Settings</h1>
                        <p className="text-body-md" style={{ marginTop: '4px' }}>Manage your recruiter and company identity</p>
                    </div>
                    <Badge variant={companyComplete ? "active" : "waiting"} showDot>
                        {companyComplete ? "Ready to Hire" : "Incomplete Profile"}
                    </Badge>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-xl)', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                        
                        {/* ── RECRUITER INFO ── */}
                        <Card variant="elevated" padding="xl">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                                <h2 className="text-headline-lg">Recruiter Identity</h2>
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
                                <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
                                    <div style={{ 
                                        width: '80px', height: '80px', borderRadius: 'var(--radius-pill)', 
                                        backgroundColor: 'var(--color-border-light)', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--color-primary)', fontWeight: '700'
                                    }}>
                                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : profile.first_name?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 className="text-title-md">{profile.first_name} {profile.last_name}</h3>
                                        <p className="text-body-md" style={{ color: 'var(--color-text-sub)' }}>{profile.username ? `@${profile.username}` : 'Official Hirer Account'}</p>
                                        <div style={{ display: 'flex', gap: 'var(--space-xl)', marginTop: 'var(--space-md)' }}>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Phone</span>
                                                <span className="text-body-md">{profile.phone || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Country</span>
                                                <span className="text-body-md">{profile.country || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <Input label="First Name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                                        <Input label="Last Name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                        <Input label="Country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* ── COMPANY DETAILS ── */}
                        <Card variant="elevated" padding="xl">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                                <h2 className="text-headline-lg">Company Details</h2>
                                {!isEditingCompany ? (
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingCompany(true)}>
                                        <FiEdit2 /> Edit Company
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Organization</span>
                                                <span className="text-body-lg" style={{ fontWeight: '600' }}>{company.company_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Industry</span>
                                                <span className="text-body-lg">{company.industry || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Website</span>
                                                <span className="text-body-lg" style={{ color: 'var(--color-primary)' }}>{company.website || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-label-sm" style={{ display: 'block' }}>Size</span>
                                                <span className="text-body-lg">{company.company_size || '—'}</span>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-lg)' }}>
                                            <span className="text-label-sm" style={{ display: 'block', marginBottom: '8px' }}>Description</span>
                                            <p className="text-body-md" style={{ lineHeight: '1.6' }}>{company.company_description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                                        <p className="text-body-md" style={{ marginBottom: 'var(--space-md)' }}>You haven't set up your company profile yet.</p>
                                        <Button variant="primary" onClick={() => setIsEditingCompany(true)}>
                                            <FiPlus /> Initialize Company Profile
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <Input label="Company Name *" value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <Input label="Industry" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} />
                                        <Input label="Website URL" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label className="text-label-sm">Company Size</label>
                                            <select 
                                                value={company.company_size} 
                                                onChange={(e) => setCompany({ ...company, company_size: e.target.value })}
                                                style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                                            >
                                                <option value="">Select size...</option>
                                                <option value="1-10">1-10 employees</option>
                                                <option value="11-50">11-50 employees</option>
                                                <option value="51-200">51-200 employees</option>
                                                <option value="201-500">201-500 employees</option>
                                                <option value="500+">500+ employees</option>
                                            </select>
                                        </div>
                                        <Input type="number" label="Founded Year" value={company.founded_year} onChange={(e) => setCompany({ ...company, founded_year: e.target.value })} />
                                    </div>
                                    <TextArea label="Company Description" rows={5} value={company.company_description} onChange={(e) => setCompany({ ...company, company_description: e.target.value })} />
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* SIDEBAR */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <Card variant="bordered" padding="lg">
                            <h3 className="text-title-md" style={{ marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
                            <Button variant="ghost" onClick={() => router.push('/hirer/postings')} style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '8px' }}>
                                View All My Postings
                            </Button>
                            <Button variant="ghost" onClick={() => router.push('/hirer/postings/create')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                                Create New Posting
                            </Button>
                        </Card>

                        <Card variant="flat" padding="lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                            <h3 className="text-title-md" style={{ color: '#991b1b', marginBottom: '8px' }}>Danger Zone</h3>
                            <p className="text-label-sm" style={{ color: '#b91c1c', marginBottom: '16px', lineHeight: '1.5' }}>
                                Deleting your account will hide your identity and all active job postings immediately.
                            </p>
                            <Button variant="secondary" onClick={handleDeleteAccount} style={{ width: '100%', color: '#991b1b', borderColor: '#fecaca' }}>
                                <FiTrash2 /> Deactivate Account
                            </Button>
                        </Card>
                    </aside>
                </div>
            </PageContainer>
        </div>
    );
}
