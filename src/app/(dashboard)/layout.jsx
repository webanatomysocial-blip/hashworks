'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/Components/DashboardHeader.jsx';
import DashboardMobileNav from '@/Components/DashboardMobileNav.jsx';
import PostJobModal from '@/Components/PostJobModal.jsx';
import '@/css/dashboard.css';

export default function DashboardLayout({ children }) {
    const [showPostModal, setShowPostModal] = useState(false);
    const [editJob, setEditJob] = useState(null);

    const handleOpenModal = (job = null) => {
        setEditJob(job);
        setShowPostModal(true);
    };

    const handleCloseModal = () => {
        setShowPostModal(false);
        setEditJob(null);
    };

    // Listen for Edit/Add events from children (since layout wraps pages)
    useEffect(() => {
        const handleEditEvent = (e) => handleOpenModal(e.detail);
        window.addEventListener('openPostJobModal', handleEditEvent);
        return () => window.removeEventListener('openPostJobModal', handleEditEvent);
    }, []);

    return (
        <div className="dashboard-layout">
            <DashboardHeader />
            <main className="dashboard-main">
                {children}
            </main>
            <DashboardMobileNav
                onAddClick={() => handleOpenModal()}
                isModalOpen={showPostModal}
            />
            <PostJobModal
                isOpen={showPostModal}
                onClose={handleCloseModal}
                jobToEdit={editJob}
                onJobPosted={() => {
                    // This will refresh the page to update the list
                    window.location.reload();
                }}
            />
        </div>
    );
}
