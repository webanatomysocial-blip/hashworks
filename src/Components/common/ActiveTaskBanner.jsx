import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/Components/ui/Card';

export default function ActiveTaskBanner({ contract, role = 'worker', onClick }) {
    const router = useRouter();
    
    // If no contract, we might still have a job (for hirer context)
    // But for now let's stick to the convention: contract prop contains the core data
    if (!contract) return null;

    const job = contract.jobs || contract.job || contract; // Flexible fallback
    const otherPerson = role === 'worker' ? contract.hirer : contract.worker;

    // Logic for Status and Metric
    const statusText = contract.status === 'active' ? 'In Progress' : (contract.status || 'Active');
    
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
                    {otherPerson ? 'Accepted' : statusText.toUpperCase()}
                </div>
                <div style={{ color: lightBlueText, fontSize: '15px', fontWeight: 600 }}>
                    {job.title || 'Ongoing Task'}
                </div>
            </div>

            {/* Metric Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>{metricLabel} {metricValue}</span>
                {metricUnit && <span style={{ fontSize: '24px', color: lightBlueText, fontWeight: 700 }}>{metricUnit}</span>}
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
                    onClick={handleAction}
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
                    {otherPerson ? 'Open Chat' : 'View Applicants'}
                </button>
            </div>
        </Card>
    );
}
