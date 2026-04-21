import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';

export default function ActiveTaskBanner({ contract, role = 'worker', onClick }) {
    const router = useRouter();
    
    // If no contract, we might still have a job (for hirer context)
    // But for now let's stick to the convention: contract prop contains the core data
    if (!contract) return null;

    const job = contract.jobs || contract.job || contract; // Flexible fallback
    const otherPerson = role === 'worker' ? contract.hirer : contract.worker;

    // Logic for Status and Metric
    const rawStatus = contract.status || 'active';
    const statusText = rawStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const displayStatus = rawStatus === 'active' ? 'In Progress' : statusText;
    
    // Role-specific Metrics
    let metricLabel = "";
    let metricValue = "";

    if (role === 'worker') {
        metricLabel = "Earn:";
        metricValue = job.budget_max ? `₹${job.budget_max.toLocaleString()}` : "Market Rate";
    } else {
        // Hirer side
        if (otherPerson) {
            metricLabel = "Hired:";
            metricValue = otherPerson.first_name || "Pro";
        } else {
            metricLabel = "Apps:";
            metricValue = job.application_count !== undefined ? job.application_count : "Pending";
        }
    }
    const metricUnit = ""; 

    const bannerBackground = '#0B47F0'; // Deep blue background
    const lightBlueText = 'rgba(255, 255, 255, 0.6)'; // Faded blue for secondary text
    const badgeBg = '#C8FF2C'; // Neon green
    const badgeColor = '#0F172A'; // Dark text for badge
    const buttonBg = '#2F65FF'; // Lighter blue for button
    
    // Description - contextual
    let description = "";
    if (role === 'worker') {
        description = `You are working with ${otherPerson?.first_name || 'the hirer'} on this task. Follow instructions for successful completion.`;
    } else {
        description = otherPerson 
            ? `Hired ${otherPerson.first_name || 'Worker'} for this task. Chat now to coordinate.`
            : `Your post is live. Waiting for applications to be accepted.`;
    }

    const handleAction = (e) => {
        if (onClick) {
            onClick(e);
        } else if (contract.id) {
            router.push(`/messages?contract=${contract.id}`);
        }
    };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Badge 
                    variant={rawStatus}
                    style={{ 
                        backgroundColor: '#C8FF2C', 
                        color: '#0F172A',
                        border: 'none',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: 600
                    }}
                >
                    {displayStatus}
                </Badge>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: 500 }}>
                    {job.title || 'Ongoing Task'}
                </div>
            </div>

            {/* Metric Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                <span style={{ fontSize: '42px', fontWeight: 700, lineHeight: 1 }}>{metricLabel} {metricValue}</span>
                {metricUnit && <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px' }}>{metricUnit}</span>}
            </div>

            {/* Description / Instructions */}
            <p style={{ 
                color: 'rgba(255, 255, 255, 0.95)', 
                margin: 0,
                maxWidth: '92%',
                fontSize: '20px',
                lineHeight: 1.6,
                fontWeight: 450
            }}>
                {description}
            </p>

            {/* Action Button */}
            <div style={{ marginTop: '12px' }}>
                <button 
                    onClick={handleAction}
                    style={{ 
                        background: 'rgba(255, 255, 255, 0.2)', 
                        color: 'white', 
                        border: '1px solid rgba(255, 255, 255, 0.3)', 
                        padding: '14px 32px', 
                        borderRadius: '100px', 
                        fontSize: '18px', 
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                    {otherPerson ? 'Open Chat' : 'View Applicants'}
                </button>
            </div>
        </Card>
    );
}
