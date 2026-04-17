'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import HashLoader from '@/Components/common/HashLoader.jsx';
import '@/css/role.css';

export default function RoleSelection() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        };
        checkUser();
    }, [router]);

    if (loading) {
        return <HashLoader text="" />;
    }

    const handleNext = () => {
        if (selectedRole === 'hirer') {
            router.push('/hirer');
        } else if (selectedRole === 'worker') {
            router.push('/worker');
        }
    };

    return (
        <div className="role-container">
            <div className="role-card-wrapper">
                <div
                    className={`role-card ${selectedRole === 'hirer' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('hirer')}
                >
                    <div className="role-card-header">
                        <div className="role-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <rect x="14" y="2" width="8" height="6" rx="1" />
                                <path d="M18 8v3" />
                                <path d="M15 11h6" />
                            </svg>
                        </div>
                        <div className="role-radio-circle"></div>
                    </div>
                    <div className="role-text">I&apos;m a client, hiring for a project</div>
                </div>

                <div
                    className={`role-card ${selectedRole === 'worker' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('worker')}
                >
                    <div className="role-card-header">
                        <div className="role-icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="role-radio-circle"></div>
                    </div>
                    <div className="role-text">I&apos;m a freelancer, looking for work</div>
                </div>

                <button
                    className="role-submit-btn"
                    disabled={!selectedRole}
                    onClick={handleNext}
                >
                    Join as a {selectedRole ? (selectedRole === 'hirer' ? 'Client' : 'Freelancer') : '...'}
                </button>
            </div>
        </div>
    );
}
