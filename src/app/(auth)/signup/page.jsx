'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import '@/css/auth.css';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
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
            // Split full name into first and last for database consistency
            const nameParts = formData.fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Generate a default username from email
            const defaultUsername = formData.email.split('@')[0] + Math.floor(Math.random() * 1000);

            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone: formData.phone,
                        username: defaultUsername,
                    },
                },
            });

            if (signupError) {
                setError(signupError.message);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                if (data.session) {
                    router.push('/role');
                } else {
                    setSuccess(true);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <Link href="/" className="auth-logo-text">Hashworks</Link>
                <div className="auth-card">
                    <h1 className="auth-title">Check your email</h1>
                    <p className="auth-subtitle">We've sent a confirmation link to {formData.email}.</p>
                    <Link href="/login" className="auth-submit-btn" style={{ textDecoration: 'none' }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <Link href="/" className="auth-logo-text">Hashworks</Link>
            
            <div className="auth-card">
                <h1 className="auth-title">Get started</h1>
                <p className="auth-subtitle">Create your account in seconds</p>

                {error && <div className="auth-message auth-error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label className="auth-label">Full Name</label>
                        <div className="auth-input-wrapper">
                            <FiUser className="auth-input-icon" size={20} />
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Enter your name"
                                className="auth-input"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Phone Number</label>
                        <div className="auth-input-wrapper">
                             <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#0f172a', borderRight: '1px solid #cbd5e1', paddingRight: '8px' }}>+91</div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="98765 43210"
                                className="auth-input"
                                style={{ paddingLeft: '64px' }}
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <div className="auth-input-wrapper">
                            <FiMail className="auth-input-icon" size={20} />
                            <input
                                type="email"
                                name="email"
                                placeholder="name@company.com"
                                className="auth-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrapper">
                            <FiLock className="auth-input-icon" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="........"
                                className="auth-input"
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
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? <HashLoader text="" /> : 'Continue'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span className="auth-divider-text">Or</span>
                </div>

                <div className="auth-social-row">
                    <button className="auth-social-btn">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Google
                    </button>
                    <button className="auth-social-btn">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" />
                        Apple
                    </button>
                </div>

                <div className="auth-footer-prompt">
                    Already have an account? <Link href="/login" className="auth-link">Log in</Link>
                </div>
            </div>

            <footer style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    By continuing, you agree to our <Link href="/terms" style={{ color: '#64748b' }}>Terms</Link> & <Link href="/privacy" style={{ color: '#64748b' }}>Privacy Policy</Link>
                </p>
            </footer>
        </div>
    );
}
