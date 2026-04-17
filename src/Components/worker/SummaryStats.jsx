import React from 'react';
import { Card } from '@/Components/ui/Card';
import { FiBriefcase, FiUsers } from 'react-icons/fi';

/**
 * SummaryStats Component
 * Grid of stats for the worker dashboard home.
 * Shows quick counts and actionable links.
 */
export default function SummaryStats({ 
  activeCount = 0, 
  acceptedCount = 0, 
  onActiveClick, 
  onApplicationsClick 
}) {
  return (
    <div className="hw-grid-2">
      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onActiveClick}>
        <div className="hw-flex hw-justify-between hw-items-center">
          <div>
            <span className="text-label-sm hw-mb-4 hw-display-block">Active Gigs</span>
            <div className="text-display-xl hw-text-32">{activeCount}</div>
          </div>
          <div className="hw-icon-box-sm hw-icon-box-success">
            <FiBriefcase size={20} />
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onApplicationsClick}>
        <div className="hw-flex hw-justify-between hw-items-center">
          <div>
            <span className="text-label-sm hw-mb-4 hw-display-block">Applications</span>
            <div className="text-display-xl hw-text-32">{acceptedCount}</div>
          </div>
          <div className="hw-icon-box-sm hw-icon-box-primary">
            <FiUsers size={20} />
          </div>
        </div>
      </Card>
    </div>
  );
}
