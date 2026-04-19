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
      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onActiveClick} style={{ borderRadius: '24px' }}>
        <div className="hw-flex hw-flex-col">
          <div className="hw-icon-box-success hw-mb-16" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <FiBriefcase size={22} />
          </div>
          <div className="hw-flex hw-justify-between hw-items-end">
            <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Gigs</span>
            <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A' }}>{activeCount}</div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onApplicationsClick} style={{ borderRadius: '24px' }}>
        <div className="hw-flex hw-flex-col">
          <div className="hw-icon-box-primary hw-mb-16" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <FiUsers size={22} />
          </div>
          <div className="hw-flex hw-justify-between hw-items-end">
            <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Applications</span>
            <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A' }}>{acceptedCount}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
