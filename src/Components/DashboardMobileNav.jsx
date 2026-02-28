'use client';

import '@/css/dashboard.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardMobileNav({ onAddClick, isModalOpen, role }) {
    const pathname = usePathname();
    const isHirer = role === 'hirer';

    return (
        <nav className="mobile-nav" data-role={isHirer ? 'hirer' : 'worker'}>
            {/* 1. Dashboard (Home) */}
            <Link href={isHirer ? '/hirer' : '/worker'} className={`mobile-nav-item ${pathname === (isHirer ? '/hirer' : '/worker') ? 'active' : ''}`}>
                <div className="nav-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <span>Dashboard</span>
            </Link>

            {/* 2. Browse / Chats */}
            {isHirer ? (
                <Link href="/working-on-it" className={`mobile-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>
                    <div className="nav-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <span>Chats</span>
                </Link>
            ) : (
                <Link href="/worker/browse" className={`mobile-nav-item ${pathname === '/worker/browse' ? 'active' : ''}`}>
                    <div className="nav-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </div>
                    <span>Browse</span>
                </Link>
            )}

            {/* 3. Post / Chats */}
            {isHirer ? (
                <div className="mobile-nav-item" onClick={onAddClick} style={{ cursor: 'pointer' }}>
                    <div className="nav-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                    <span>Post</span>
                </div>
            ) : (
                <Link href="/working-on-it" className={`mobile-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>
                    <div className="nav-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <span>Chats</span>
                </Link>
            )}

            {/* 4. Pay / Wallet */}
            <Link href="/working-on-it" className={`mobile-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>
                <div className="nav-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                </div>
                <span>{isHirer ? 'Pay' : 'Wallet'}</span>
            </Link>

            {/* 5. Profile */}
            <Link href="/working-on-it" className={`mobile-nav-item ${pathname === '/working-on-it' ? 'active' : ''}`}>
                <div className="nav-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <span>Profile</span>
            </Link>
        </nav>
    );
}
