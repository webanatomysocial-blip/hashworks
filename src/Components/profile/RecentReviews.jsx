'use client';

import React from 'react';
import { FiStar, FiMessageSquare } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        return `${h} hour${h > 1 ? 's' : ''} ago`;
    }
    if (diff < 604800) {
        const d = Math.floor(diff / 86400);
        return `${d} day${d > 1 ? 's' : ''} ago`;
    }
    const w = Math.floor(diff / 604800);
    return `${w} week${w > 1 ? 's' : ''} ago`;
}

export default function RecentReviews({ reviews = [], targetId, showViewAll = true, limit = 3 }) {
    const router = useRouter();
    
    if (!reviews || reviews.length === 0) {
        return (
            <div className="ph-section-card">
                <div className="hw-flex hw-items-center hw-gap-8 hw-mb-24">
                    <FiMessageSquare size={20} color="var(--hw-primary)" />
                    <h2 className="ph-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>Recent Reviews</h2>
                </div>
                <p className="para-text" style={{ color: '#94A3B8', textAlign: 'center' }}>No reviews yet.</p>
            </div>
        );
    }

    const displayedReviews = limit ? reviews.slice(0, limit) : reviews;

    return (
        <div className="ph-section-card">
            <div className="hw-flex hw-items-center hw-gap-8 hw-mb-24">
                <FiMessageSquare size={20} color="var(--hw-primary)" />
                <h2 className="ph-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>Recent Reviews</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {displayedReviews.map((rev, index) => (
                    <div key={rev.id} style={{ borderBottom: index === displayedReviews.length - 1 && !showViewAll ? 'none' : '1px solid #f1f5f9', paddingBottom: index === displayedReviews.length - 1 && !showViewAll ? '0' : '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div 
                                style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}
                                onClick={() => router.push(`/profile/view?id=${rev.reviewer_id}`)}
                            >
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    background: '#eff6ff', 
                                    color: '#1C4DFF', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontWeight: 600, 
                                    fontSize: '14px', 
                                    flexShrink: 0,
                                    overflow: 'hidden'
                                }}>
                                    {rev.reviewer?.avatar_url ? (
                                        <img src={rev.reviewer.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    ) : (
                                        ((rev.reviewer?.first_name?.[0] || 'U') + (rev.reviewer?.last_name?.[0] || '')).toUpperCase() || 'U'
                                    )}
                                </div>
                                <div>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', display: 'block' }}>{rev.reviewer?.first_name} {rev.reviewer?.last_name || ''}</span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{timeAgo(rev.created_at)}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {[...Array(5)].map((_, i) => (
                                    <FiStar 
                                        key={i} 
                                        fill={i < rev.rating ? "#FF6A3D" : "none"} 
                                        color="#FF6A3D" 
                                        size={12} 
                                        strokeWidth={2} 
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="para-text" style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{rev.comment}</p>
                    </div>
                ))}
                
                {showViewAll && reviews.length > 0 && targetId && (
                    <button 
                        onClick={() => router.push(`/profile/reviews?id=${targetId}`)}
                        style={{ 
                            width: '100%', 
                            marginTop: '8px',
                            padding: '12px', 
                            borderRadius: '30px', 
                            border: '1px solid #e2e8f0', 
                            background: 'transparent', 
                            color: '#1C4DFF', 
                            fontWeight: 500, 
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        Read all {reviews.length} reviews
                    </button>
                )}
            </div>
        </div>
    );
}
