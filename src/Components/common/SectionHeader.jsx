"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiShare2 } from 'react-icons/fi';

/**
 * SectionHeader Component
 * 
 * Consistent header for sub-dashboard pages.
 * Features a sticky white background, back arrow, title, and optional action.
 */
export default function SectionHeader({ title, onBack, rightAction, showShare }) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) return onBack();
        router.back();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 20px', 
            background: '#fff', 
            position: 'sticky', 
            top: 0, 
            zIndex: 100, 
            borderBottom: '1.5px solid #f1f5f9'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                    onClick={handleBack} 
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: '8px', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <FiChevronLeft size={24} color="#64748B" />
                </button>
            </div>

            <h2 style={{ 
                fontSize: '18px', 
                fontWeight: 500, 
                color: '#0F172A', 
                margin: 0,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'max-content'
            }}>
                {title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center' }}>
                {rightAction ? rightAction : (
                    showShare ? (
                        <button 
                            onClick={handleShare} 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                        >
                            <FiShare2 size={24} color="#64748B" />
                        </button>
                    ) : (
                        /* Spacer to maintain center alignment */
                        <div style={{ width: '40px' }} />
                    )
                )}
            </div>
        </header>
    );
}
