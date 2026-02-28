'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/Components/DashboardHeader.jsx';
import DashboardMobileNav from '@/Components/DashboardMobileNav.jsx';
import '@/css/dashboard.css';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    const isHirer = pathname?.includes('/hirer');
    const role = isHirer ? 'hirer' : 'worker';

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
        return (
            <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Authenticating...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <DashboardHeader />
            <main className="dashboard-main">
                {children}
            </main>
            <DashboardMobileNav
                onAddClick={() => router.push('/hirer/postings/create')}
                role={role}
            />
        </div>
    );
}
