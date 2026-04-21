"use client";

import React from "react";
import { TaskCard } from "./TaskCard";
import { Button } from "./Button";
import { FiBriefcase } from "react-icons/fi";

export function JobCard({ 
  job, 
  onViewDetails, 
  onApply, 
  onDelete, // Added onDelete
  isApplied = false,
  isApplying = false,
  distance 
}) {
  const formatBudget = (max) => {
    if (!max) return "Negotiable";
    return `₹${max.toLocaleString()}`;
  };

  const badgeConfig = job.urgency === 'immediate' 
      ? { text: 'URGENT', variant: 'urgent' }
      : job.urgency === 'flexible'
      ? { text: 'FLEXIBLE', variant: 'neutral' }
      : null;

  const hirerName = job.hirer_first_name || job.profiles?.first_name || 'Hirer';
  const hirerLastInitial = job.hirer_last_name?.[0] || job.profiles?.last_name?.[0] || '';
  const hirerAvatar = job.hirer_avatar_url || job.profiles?.avatar_url;

  return (
    <div style={{ marginBottom: '16px' }}>
      <TaskCard 
          onClick={() => onViewDetails(job.id)} // Card click opens details
          topTitleLabel={
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {hirerName} {hirerLastInitial ? hirerLastInitial + '.' : ''} • 
              <FiStar size={14} fill={job.hirer_average_rating ? "#F59E0B" : "none"} color={job.hirer_average_rating ? "#F59E0B" : "#94A3B8"} />
              <span>{job.hirer_average_rating ? Number(job.hirer_average_rating).toFixed(1) : 'N/A'}</span>
            </div>
          }
          title={job.title}
          thumbnailUrl={job.reference_image_url}
          thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
          badge={badgeConfig}
          metrics={[
              { label: 'PAYOUT', value: formatBudget(job.budget_max), valueColor: '#1C4DFF' },
              { label: 'LOCATION', value: job.city || 'Remote', subValue: distance !== undefined ? `${distance.toFixed(2)} km away` : null },
              { label: 'CATEGORY', value: job.category || 'Other' }
          ]}
          actionButtons={
              <div style={{ display: 'flex', gap: '12px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant={isApplied ? "ghost" : "primary"} 
                    onClick={() => onApply(job.id)} 
                    disabled={isApplied || isApplying}
                    style={{ flex: 2, height: '44px', borderRadius: '22px', fontWeight: 600 }}
                  >
                      {isApplied ? "Applied" : (isApplying ? "..." : "Express Interest")}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => onDelete(job.id)} 
                    style={{ flex: 1, height: '44px', borderRadius: '22px', color: '#EF4444', border: '1px solid #FEE2E2' }}
                  >
                    Delete
                  </Button>
              </div>
          }
      />
    </div>
  );
}
