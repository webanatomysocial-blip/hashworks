"use client";

import React from "react";
import { TaskCard } from "./TaskCard";
import { Button } from "./Button";
import { FiBriefcase } from "react-icons/fi";

export function JobCard({ 
  job, 
  onViewDetails, 
  onApply, 
  isApplied = false,
  isApplying = false,
  distance 
}) {
  const formatBudget = (min, max) => {
    if (!min && !max) return "Negotiable";
    return `₹${(min || 0).toLocaleString()}${max ? ' - ₹' + max.toLocaleString() : '+'}`;
  };

  const badgeConfig = job.urgency === 'immediate' 
      ? { text: 'URGENT', variant: 'urgent' }
      : job.urgency === 'high'
      ? { text: 'HIGH PRIORITY', variant: 'waiting' }
      : null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <TaskCard 
          topTitleLabel={`${job.hirer_first_name || 'Hirer'} ${job.hirer_last_name?.[0] ? job.hirer_last_name[0] + '.' : ''} • ${job.hirer_average_rating ? '★'+Number(job.hirer_average_rating).toFixed(1) : 'New'}`}
          title={job.title}
          thumbnailUrl={job.reference_image_url || job.hirer_avatar_url}
          thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
          badge={badgeConfig}
          metrics={[
              { label: 'PAYOUT', value: formatBudget(job.budget_min, job.budget_max), valueColor: '#1C4DFF', valueSize: '16px' },
              { label: 'LOCATION', value: job.city || 'Remote', subValue: distance !== undefined ? `${distance.toFixed(2)} km away` : null },
              { label: 'CATEGORY', value: job.category || 'Other' }
          ]}
          actionButtons={
              <>
                  <Button variant="ghost" onClick={() => onViewDetails(job.id)} style={{ flex: 1, height: '44px', borderRadius: '22px', fontWeight: 800 }}>
                    Details
                  </Button>
                  <Button 
                    variant={isApplied ? "ghost" : "primary"} 
                    onClick={() => onApply(job)} 
                    disabled={isApplied || isApplying}
                    style={{ flex: 1, height: '44px', borderRadius: '22px', fontWeight: 800 }}
                  >
                    {isApplied ? "Applied" : (isApplying ? "..." : "Accept Task")}
                  </Button>
              </>
          }
      />
    </div>
  );
}
