'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function CreateJobPage() {
    const router = useRouter();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to post a job.');

            // Company Profile Check
            const { data: comp } = await supabase.from('company_details').select('company_name').eq('hirer_id', user.id).maybeSingle();

            if (!comp?.company_name) {
                setError('You must set up your Company Profile before posting a job.');
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
                hirer_id: user.id,
                updated_at: new Date().toISOString(),
            };

            const { data: inserted, error: insErr } = await supabase
                .from('jobs')
                .insert(payload)
                .select('id')
                .single();

            if (insErr) throw insErr;
            const jobId = inserted.id;

            /* Resolve and insert skills */
            const skillNames = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
            for (const name of skillNames) {
                const skillId = await resolveSkillId(name);
                if (skillId) await supabase.from('job_skills').insert({ job_id: jobId, skill_id: skillId });
            }

            /* Resolve and insert tools */
            const toolNames = formData.tools.split(',').map(t => t.trim()).filter(Boolean);
            for (const name of toolNames) {
                const toolId = await resolveToolId(name);
                if (toolId) await supabase.from('job_tools').insert({ job_id: jobId, tool_id: toolId });
            }

            // Navigate back to listings
            router.push('/hirer/postings');
        } catch (err) {
            console.error('Error saving job:', err);
            setError(err.message || 'Failed to save job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fp-container">
            <header className="fp-header">
                <button className="fp-back-btn" onClick={() => router.back()}>
                    <FiArrowLeft />
                </button>
                <h1 className="fp-title">Post New Job</h1>
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
                            placeholder="React, SEO, etc."
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
                            placeholder="Figma, Slack, etc."
                            value={formData.tools}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" className="fp-submit-btn" disabled={loading}>
                    {loading ? 'Posting Job...' : 'Post Job Now'}
                </button>

            </form>
        </div>
    );
}
