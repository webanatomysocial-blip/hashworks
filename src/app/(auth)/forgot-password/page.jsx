'use client';

import Link from 'next/link';
import '@/css/auth.css';

export default function ForgotPassword() {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">#</div>
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Enter your email to receive a password reset link</p>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            placeholder="username@gmail.com"
                            className="auth-input"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        Send Reset Link
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link href="/login" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
