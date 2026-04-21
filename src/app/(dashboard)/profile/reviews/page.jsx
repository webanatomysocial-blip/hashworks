'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiChevronLeft, FiStar } from 'react-icons/fi';
import HashLoader from '@/Components/common/HashLoader';
import { PageContainer } from "@/Components/layouts/PageContainer";
import '@/css/profile.css';
import '@/css/hirer.css'; // for mp-tabs
import RecentReviews from '@/Components/profile/RecentReviews';

function ProfileReviewsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetId = searchParams.get('id');

    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        if (targetId) fetchReviews();
    }, [targetId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Fetch profile for context (optional but good for UI)
            const { data: prof } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', targetId)
                .single();
            setProfile(prof);

            // Fetch Reviews
            const { data: revs } = await supabase
                .from('reviews')
                .select(`*, reviewer:reviewer_id(first_name, last_name, avatar_url)`)
                .eq('reviewee_id', targetId)
                .order('created_at', { ascending: false });

            setReviews(revs || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <HashLoader text="" />;

    // Sort/Filter reviews based on active tab
    // Since 'Most Recent' is chronologically descending (our default fetch), 'All' can default to highest ratings or just standard.
    // For now, we'll make 'All' display as is and 'Most Recent' strictly sorted by date.
    let displayedReviews = [...reviews];
    if (activeTab === 'All') {
        // Maybe sort by rating for "All" just to distinguish, or leave as default. Let's just leave as default for "All"
        // actually, usually 'All' is default order and 'Most Recent' is fresh first. We already fetch fresh first. 
        // Let's sort "All" by best rating just to give tabs a functional difference if not specified.
        displayedReviews.sort((a, b) => b.rating - a.rating);
    } else {
        // Most Recent
        displayedReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return (
        <div className="profile-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiChevronLeft size={24} color="#0F172A" />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>
                        Reviews for {profile?.first_name} {profile?.last_name || ''}
                    </h1>
                </div>
            </div>

            <PageContainer>
                <div style={{ padding: '24px 20px' }}>
                    {/* Tabs */}
                    <div className="mp-tabs" style={{ marginBottom: '24px' }}>
                        {['All', 'Most Recent'].map(tab => (
                            <button
                                key={tab}
                                className={`mp-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Review List */}
                    <RecentReviews 
                        reviews={displayedReviews} 
                        targetId={targetId} 
                        showViewAll={false} 
                        limit={null} 
                    />
                </div>
            </PageContainer>
        </div>
    );
}

export default function ProfileReviewsPage() {
    return (
        <Suspense fallback={<HashLoader text="" />}>
            <ProfileReviewsContent />
        </Suspense>
    );
}
