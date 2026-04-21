'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import '@/css/auth.css';

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (loginError) {
                setError(loginError.message);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', data.user.id).single();
                if (profile && profile.first_name) {
                    router.push('/worker'); // Bypass onboarding
                } else {
                    router.push('/role'); // Redirect to onboarding
                }
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Link href="/" className="auth-logo-text">Hashworks</Link>
            
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Continue your journey with Hashworks.</p>

                {error && <div className="auth-message auth-error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <div className="auth-label-row">
                            <label className="auth-label">Email Address</label>
                        </div>
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
                        <div className="auth-label-row">
                            <label className="auth-label">Password</label>
                            <Link href="/forgot-password" style={{ fontSize: '12px', fontWeight: 500, color: '#4f74ff', textDecoration: 'none', textTransform: 'uppercase' }}>
                                Forgot?
                            </Link>
                        </div>
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
                                autoComplete="current-password"
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
                        {loading ? <HashLoader text="" inline /> : (
                            <>
                                Sign In <FiArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span className="auth-divider-text">Or continue with</span>
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
                    Don't have an account? <Link href="/signup" className="auth-link">Join Now</Link>
                </div>
            </div>



            <footer style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 ,padding:"0 20px"}}>
                    By continuing, you agree to Hashworks <Link href="/terms" style={{ color: '#64748b' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#64748b' }}>Privacy Policy</Link>.
                </p>
            </footer>
        </div>
    );
}
