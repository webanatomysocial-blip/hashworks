'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import '@/css/auth.css';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Generate a default username from email
            const defaultUsername = formData.email.split('@')[0] + Math.floor(Math.random() * 1000);

            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        username: defaultUsername, // Add username to metadata
                    },
                },
            });

            if (signupError) {
                console.error('Signup Error:', signupError);
                setError(signupError.message + (signupError.details ? `: ${signupError.details}` : ''));
            } else {
                if (data.session) {
                    // Auto-login successful (Email confirmation disabled)
                    router.push('/role');
                } else {
                    // Email confirmation required
                    setSuccess(true);
                }
            }
        } catch (err) {
            console.error('Unexpected Error:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">#</div>
                <h1 className="auth-title">Get Started now</h1>
                <p className="auth-subtitle">Create an account or log in to explore about our app</p>

                <div className="auth-tab-container" role="tablist">
                    <button
                        className="auth-tab active"
                        onClick={() => { }}
                        role="tab"
                        aria-selected="true"
                    >
                        Sign Up
                    </button>
                    <Link href="/login" className="auth-tab" role="tab">
                        Log In
                    </Link>
                </div>

                {error && <div className="auth-message auth-error-message">{error}</div>}
                {success && (
                    <div className="auth-message auth-success-message">
                        Registration successful! Please check your email to confirm your account.
                    </div>
                )}

                <form
                    className="auth-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(e);
                    }}
                >
                    <div className="auth-row">
                        <div className="auth-input-group">
                            <label className="auth-label">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                className="auth-input"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="auth-input-group">
                            <label className="auth-label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className="auth-input"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="auth-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="********"
                                className="auth-input auth-input-password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="auth-eye-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (


                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Phone Number</label>
                        <div className="auth-phone-input-wrapper">
                            <div className="auth-country-code">
                                <span>IN</span>
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                className="auth-phone-input"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span className="auth-divider-text">Or Signup with</span>
                </div>

                <div className="auth-social-row">
                    <button className="auth-social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                    </button>
                    <button className="auth-social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </button>
                    <button className="auth-social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                            <path d="M17.05 20.28c-.96.44-1.94.67-2.91.67-1.46 0-2.81-.46-3.8-1.28-1.09-.9-1.85-2.13-2.12-3.47-.27-1.34-.06-2.7.59-4.04.65-1.34 1.72-2.43 3.01-3.07 1.29-.64 2.8-.82 4.25-.51 1.45.31 2.76 1.09 3.69 2.2l.27-.67c.18-.45.45-.85.8-1.18.35-.33.77-.58 1.23-.74l.43-.15c-.48-.52-1.04-.96-1.65-1.3-1.01-.56-2.14-.86-3.29-.86-1.57 0-3.08.57-4.26 1.6-1.18 1.04-1.96 2.44-2.21 4.02-.25 1.58.15 3.19 1.12 4.54.97 1.35 2.39 2.33 3.99 2.77 1.6.44 3.3.31 4.8-.37 1.5-.68 2.75-1.83 3.52-3.24l-.62.24c-.46.18-.95.27-1.44.27z" />
                            <path d="M12.05 1c-6.11 0-11.05 4.94-11.05 11.05s4.94 11.05 11.05 11.05 11.05-4.94 11.05-11.05-4.94-11.05-11.05-11.05z" />
                        </svg>
                    </button>
                    <button className="auth-social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
