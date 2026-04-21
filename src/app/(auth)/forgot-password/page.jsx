'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader';
import { FiMail, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import '@/css/auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const validateEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                if (resetError.status === 429) {
                    setError("Too many requests. Please try again in a few minutes.");
                } else {
                    setError(resetError.message);
                }
            } else {
                setMessage("Success! Check your email for the reset link.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Link href="/" className="auth-logo-text">Hashworks</Link>
            
            <div className="auth-card">
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Enter your email to receive a password reset link.</p>

                {error && (
                    <div className="auth-message auth-error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiAlertCircle size={18} /> {error}
                    </div>
                )}
                
                {message && (
                    <div className="auth-message auth-success-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px' }}>
                        <FiCheckCircle size={18} /> {message}
                    </div>
                )}

                {!message && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <div className="auth-label-row">
                                <label className="auth-label">Email Address</label>
                            </div>
                            <div className="auth-input-wrapper">
                                <FiMail className="auth-input-icon" size={20} />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="auth-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <HashLoader text="" /> : (
                                <>
                                    Send Reset Link <FiArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="auth-footer-prompt">
                    Remembered your password? <Link href="/login" className="auth-link">Back to Login</Link>
                </div>
            </div>

            <div className="auth-value-section">
                <div className="auth-value-card">
                    <div className="auth-value-icon-box" style={{ background: '#C8FF2C' }}>
                        <div style={{ width: '20px', height: '20px', background: '#0F172A', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                    </div>
                    <div className="auth-value-content">
                        <span className="auth-value-label">Secure Access</span>
                        <span className="auth-value-title">Encrypted <span>Recovery</span></span>
                    </div>
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
