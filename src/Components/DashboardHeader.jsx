'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiMapPin, FiLogOut } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import LocationModal from './LocationModal';
import '@/css/dashboard.css';

export default function DashboardHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const isHirer = pathname?.includes('/hirer');
    const isWorker = pathname?.includes('/worker');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <div className="header-logo">#</div>

                {(isHirer || isWorker) && (
                    <div className="role-toggle">
                        <Link
                            href="/hirer"
                            className={`role-toggle-btn ${isHirer ? 'active' : ''}`}
                        >
                            Hirer
                        </Link>
                        <Link
                            href="/worker"
                            className={`role-toggle-btn ${isWorker ? 'active' : ''}`}
                        >
                            Worker
                        </Link>
                    </div>
                )}
            </div>

            {/* Desktop Center Navigation */}
            <nav className="desktop-main-nav" data-role={isHirer ? 'hirer' : 'worker'}>
                {isHirer ? (
                    <>
                        <Link href="/hirer" className={`d-nav-item ${pathname === '/hirer' ? 'active' : ''}`}>Dashboard</Link>
                        <Link href="/messages" className={`d-nav-item ${pathname === '/messages' ? 'active' : ''}`}>Chats</Link>
                        <button className="d-nav-item" onClick={() => (window.location.href = '/hirer/postings/create')}>Post</button>
                        <Link href="/working-on-it" className={`d-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>Pay</Link>
                        <Link href="/hirer/profile" className={`d-nav-item ${pathname === '/hirer/profile' ? 'active' : ''}`}>Profile</Link>
                    </>
                ) : isWorker ? (
                    <>
                        <Link href="/worker" className={`d-nav-item ${pathname === '/worker' ? 'active' : ''}`}>Dashboard</Link>
                        <Link href="/worker/browse" className={`d-nav-item ${pathname === '/worker/browse' ? 'active' : ''}`}>Browse</Link>
                        <Link href="/messages" className={`d-nav-item ${pathname === '/messages' ? 'active' : ''}`}>Chats</Link>
                        <Link href="/working-on-it" className={`d-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>Wallet</Link>
                        <Link href="/worker/profile" className={`d-nav-item ${pathname === '/worker/profile' ? 'active' : ''}`}>Profile</Link>
                    </>
                ) : null}
            </nav>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="header-icon-btn" aria-label="Location" onClick={() => setIsLocationModalOpen(true)}>
                    <FiMapPin size={22} />
                </button>

                <button className="header-icon-btn" aria-label="Logout" onClick={handleLogout}>
                    <FiLogOut size={22} />
                </button>
            </div>

            <LocationModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
            />
        </header>
    );
}
