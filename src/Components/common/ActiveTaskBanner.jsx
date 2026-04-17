import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/Components/ui/Card';

export default function ActiveTaskBanner({ contract, role = 'worker', onClick }) {
    const router = useRouter();
    
    if (!contract) return null;

    const job = contract.jobs || {};
    const otherPerson = role === 'worker' ? contract.hirer : contract.worker;

    // Determine status badge based on progress or mock logic
    const statusText = contract.status === 'active' ? 'In Progress' : 'Pending';

    // Mock ETA or task metric details for now, you can hook this up to actual data later
    const metricLabel = "ETA:";
    const metricValue = role === 'worker' ? "12" : "24"; 
    const metricUnit = role === 'worker' ? "mins" : "hrs";

    const bannerBackground = '#0B47F0'; // Deep blue background
    const lightBlueText = 'rgba(255, 255, 255, 0.6)'; // Faded blue for secondary text
    const badgeBg = '#C8FF2C'; // Neon green
    const badgeColor = '#0F172A'; // Dark text for badge
    const buttonBg = '#2F65FF'; // Lighter blue for button
    
    // Task description - truncate if necessary
    const description = job.description || `Task with ${otherPerson?.first_name || 'user'}. Please ensure all guidelines are followed for successful completion.`;

    return (
        <Card 
            style={{ 
                background: bannerBackground, 
                borderRadius: '24px', 
                padding: '24px',
                color: 'white',
                border: 'none',
                boxShadow: '0 12px 32px rgba(11, 71, 240, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Header: Badge & Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                    background: badgeBg, 
                    color: badgeColor, 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '13px', 
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: badgeColor }}></div>
                    {statusText}
                </div>
                <div style={{ color: lightBlueText, fontSize: '15px', fontWeight: 600 }}>
                    {job.title || 'Ongoing Gig'}
                </div>
            </div>

            {/* Metric Row (ETA) */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>{metricLabel} {metricValue}</span>
                <span style={{ fontSize: '28px', color: lightBlueText, fontWeight: 700 }}>{metricUnit}</span>
            </div>

            {/* Description / Instructions */}
            <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '15px', 
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '90%'
            }}>
                {description}
            </p>

            {/* Action Button */}
            <div style={{ marginTop: '8px' }}>
                <button 
                    onClick={onClick || (() => router.push(`/messages?contract=${contract.id}`))}
                    style={{ 
                        background: buttonBg, 
                        color: 'white', 
                        border: 'none', 
                        padding: '12px 24px', 
                        borderRadius: '100px', 
                        fontSize: '15px', 
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    {role === 'worker' ? 'View Task' : 'Track Progress'}
                </button>
            </div>
        </Card>
    );
}
