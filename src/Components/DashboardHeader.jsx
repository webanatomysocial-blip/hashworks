'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/css/dashboard.css';

export default function DashboardHeader() {
    const pathname = usePathname();
    const isHirer = pathname?.includes('/hirer');
    const isWorker = pathname?.includes('/worker');

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <div className="header-logo">#</div>

                {/* Role Toggle */}
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
            <div className="header-right">
                <button className="header-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </button>
                <button className="header-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
