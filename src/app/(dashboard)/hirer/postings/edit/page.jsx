'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft, FiChevronDown, FiCalendar, FiBriefcase, FiZap, FiTool } from 'react-icons/fi';
import '@/css/hirer.css';

const EMPTY_FORM = {
    title: '',
    category: '',
    urgency: '',
    description: '',
    budget_min: '',
    budget_max: '',
    location_type: '',
    city: '',
    start_date: '',
    skills: '',
    tools: '',
    status: 'active',
};

/* Upsert or insert a skill by name, return its id */
async function resolveSkillId(name) {
    const clean = name.trim();
    if (!clean) return null;
    const { data: existing } = await supabase.from('skills').select('id').eq('name', clean).single();
    if (existing) return existing.id;
    const { data: created } = await supabase.from('skills').insert({ name: clean }).select('id').single();
    return created?.id || null;
}

/* Upsert or insert a tool by name, return its id */
async function resolveToolId(name) {
    const clean = name.trim();
    if (!clean) return null;
    const { data: existing } = await supabase.from('tools').select('id').eq('name', clean).single();
    if (existing) return existing.id;
    const { data: created } = await supabase.from('tools').insert({ name: clean }).select('id').single();
    return created?.id || null;
}

function EditJobContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('id');

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobData = useCallback(async () => {
        if (!jobId) return;
        setFetching(true);
        try {
            const { data: job, error: fetchErr } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (fetchErr) throw fetchErr;

            setFormData({
                title: job.title || '',
                category: job.category || '',
                urgency: job.urgency || '',
                description: job.description || '',
                budget_min: job.budget_min != null ? String(job.budget_min) : '',
                budget_max: job.budget_max != null ? String(job.budget_max) : '',
                location_type: job.location_type || '',
                city: job.city || '',
                start_date: job.start_date || '',
                skills: '', // will be populated if needed, or left empty
                tools: '',
                status: job.status || 'active',
            });
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Failed to load job data.');
        } finally {
            setFetching(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchJobData();
    }, [fetchJobData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to edit a job.');

            // Company Profile Check
            const { data: comp } = await supabase.from('company_details').select('company_name').eq('hirer_id', user.id).maybeSingle();

            if (!comp?.company_name) {
                setError('You must set up your Company Profile before editing jobs.');
                setTimeout(() => router.push('/hirer/profile'), 2000);
                return;
            }

            const payload = {
                title: formData.title.trim(),
                category: formData.category || null,
                urgency: formData.urgency || null,
                description: formData.description.trim() || null,
                budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
                budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
                location_type: formData.location_type || null,
                city: formData.city.trim() || null,
                start_date: formData.start_date || null,
                status: formData.status,
                updated_at: new Date().toISOString(),
            };

            const { error: upErr } = await supabase.from('jobs').update(payload).eq('id', jobId);
            if (upErr) throw upErr;

            /* Resolve and insert skills */
            const skillNames = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
            if (skillNames.length > 0) {
                await supabase.from('job_skills').delete().eq('job_id', jobId);
                for (const name of skillNames) {
                    const skillId = await resolveSkillId(name);
                    if (skillId) await supabase.from('job_skills').insert({ job_id: jobId, skill_id: skillId });
                }
            }

            /* Resolve and insert tools */
            const toolNames = formData.tools.split(',').map(t => t.trim()).filter(Boolean);
            if (toolNames.length > 0) {
                await supabase.from('job_tools').delete().eq('job_id', jobId);
                for (const name of toolNames) {
                    const toolId = await resolveToolId(name);
                    if (toolId) await supabase.from('job_tools').insert({ job_id: jobId, tool_id: toolId });
                }
            }

            router.push('/hirer/postings');
        } catch (err) {
            console.error('Error updating job:', err);
            setError(err.message || 'Failed to update job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading-state">Loading Job Details...</div>;
    if (!jobId) return <div className="loading-state">No Job ID provided.</div>;

    return (
        <div className="fp-container">
            <header className="fp-header">
                <button className="fp-back-btn" onClick={() => router.back()}>
                    <FiArrowLeft />
                </button>
                <h1 className="fp-title">Edit Job Posting</h1>
            </header>

            {error && <div className="modal-error" style={{ marginBottom: 20 }}>{error}</div>}

            <form className="fp-card" onSubmit={handleSubmit}>

                {/* Job Title */}
                <div className="fp-section">
                    <label className="fp-label">Job Title</label>
                    <div className="fp-input-group">
                        <input
                            type="text"
                            name="title"
                            className="fp-input"
                            placeholder="e.g. Social Media Marketing Intern"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Category + Urgency */}
                <div className="fp-row">
                    <div className="fp-section">
                        <label className="fp-label">Category</label>
                        <div className="fp-input-group">
                            <select name="category" className="fp-input fp-select" value={formData.category} onChange={handleChange} required>
                                <option value="" disabled>Select</option>
                                <option value="development">Development</option>
                                <option value="design">Design</option>
                                <option value="marketing">Marketing</option>
                                <option value="other">Other</option>
                            </select>
                            <FiChevronDown className="fp-select-chevron" />
                        </div>
                    </div>
                    <div className="fp-section">
                        <label className="fp-label">
                            <FiZap className="fp-label-icon" /> Urgency
                        </label>
                        <div className="fp-input-group">
                            <select name="urgency" className="fp-input fp-select" value={formData.urgency} onChange={handleChange} required>
                                <option value="" disabled>Select</option>
                                <option value="immediate">Immediate</option>
                                <option value="high">High</option>
                                <option value="flexible">Flexible</option>
                            </select>
                            <FiChevronDown className="fp-select-chevron" />
                        </div>
                    </div>
                </div>

                {/* Job Description */}
                <div className="fp-section">
                    <label className="fp-label">Job Description</label>
                    <div className="fp-input-group">
                        <textarea
                            name="description"
                            className="fp-input fp-textarea"
                            placeholder="What Will The Student Be Doing? What Are The Expectations?"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Budget Range */}
                <div className="fp-section">
                    <label className="fp-label">Budget (₹/HR)</label>
                    <div className="fp-row">
                        <input
                            type="number"
                            name="budget_min"
                            className="fp-input"
                            placeholder="Min (e.g. 10,000)"
                            value={formData.budget_min}
                            onChange={handleChange}
                            min="0"
                        />
                        <input
                            type="number"
                            name="budget_max"
                            className="fp-input"
                            placeholder="Max (e.g. 25,000)"
                            value={formData.budget_max}
                            onChange={handleChange}
                            min="0"
                        />
                    </div>
                </div>

                {/* Location Type + City */}
                <div className="fp-row">
                    <div className="fp-section">
                        <label className="fp-label">Work Mode</label>
                        <div className="fp-input-group">
                            <select name="location_type" className="fp-input fp-select" value={formData.location_type} onChange={handleChange} required>
                                <option value="" disabled>Select</option>
                                <option value="remote">Remote</option>
                                <option value="onsite">Onsite</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                            <FiChevronDown className="fp-select-chevron" />
                        </div>
                    </div>
                    <div className="fp-section">
                        <label className="fp-label">City / Location</label>
                        <input
                            type="text"
                            name="city"
                            className="fp-input"
                            placeholder="e.g. Bangalore"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Start Date */}
                <div className="fp-section">
                    <label className="fp-label">
                        <FiCalendar className="fp-label-icon" /> Start Date
                    </label>
                    <input
                        type="date"
                        name="start_date"
                        className="fp-input"
                        value={formData.start_date}
                        onChange={handleChange}
                    />
                </div>

                {/* Skills + Tools */}
                <div className="fp-row">
                    <div className="fp-section">
                        <label className="fp-label">
                            Skills <span className="fp-label-opt">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            name="skills"
                            className="fp-input"
                            placeholder="React, SEO, etc. (Optional)"
                            value={formData.skills}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="fp-section">
                        <label className="fp-label">
                            Tools <span className="fp-label-opt">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            name="tools"
                            className="fp-input"
                            placeholder="Figma, Slack, etc. (Optional)"
                            value={formData.tools}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" className="fp-submit-btn" disabled={loading}>
                    {loading ? 'Updating Job...' : 'Update Job Posting'}
                </button>

            </form>
        </div>
    );
}

export default function EditJobPage() {
    return (
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <EditJobContent />
        </Suspense>
    );
}
