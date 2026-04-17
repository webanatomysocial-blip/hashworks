import React from 'react';
import { TaskCard } from '@/Components/ui/TaskCard';
import { Button } from '@/Components/ui/Button';
import { FiBriefcase } from 'react-icons/fi';

/**
 * ActiveGigCard Component
 * Displays the current ongoing project with progress and key info.
 */
export default function ActiveGigCard({ gig, onViewTask }) {
  if (!gig) return null;

  const progress = gig.progress_percentage || 0;
  const job = gig.jobs || {};
  const otherParty = gig.hirer || gig.worker || {};

  return (
      <TaskCard 
          topTitleLabel={`${otherParty.first_name || 'Partner'} ${otherParty.last_name?.[0] ? otherParty.last_name[0] + '.' : ''} • ${otherParty.average_rating ? '★'+Number(otherParty.average_rating).toFixed(1) : 'New'}`}
          title={job.title || 'Untitled Project'}
          thumbnailUrl={otherParty.avatar_url || job.reference_image_url}
          thumbnailFallbackIcon={<FiBriefcase size={28} color="#64748B" />}
          badge={{ text: 'ACTIVE', variant: 'success' }}
          metrics={[
              { label: 'AGREED AMOUNT', value: `₹${gig.agreed_amount || job.budget_min || job.budget_max || '0'}`, valueColor: '#1C4DFF', valueSize: '16px' },
              { label: 'STATUS', value: 'In Progress' }
          ]}
          actionButtons={
              <Button variant="primary" onClick={onViewTask} style={{ flex: 1, height: '44px', borderRadius: '22px', fontWeight: 800 }}>
                View Workspace
              </Button>
          }
      />
  );
}
