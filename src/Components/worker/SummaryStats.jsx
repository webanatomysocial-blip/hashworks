import React from 'react';
import { Card } from '@/Components/ui/Card';
import { FiBriefcase, FiUsers, FiCheckCircle } from 'react-icons/fi';

/**
 * SummaryStats Component
 * Grid of stats for the worker dashboard home.
 * Shows quick counts and actionable links.
 */
export default function SummaryStats({ 
  activeCount = 0, 
  acceptedCount = 0, 
  pastWorksCount = 0,
  onActiveClick, 
  onApplicationsClick,
  onPortfolioClick 
}) {
  return (
    <div className="hw-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onActiveClick} style={{ borderRadius: '24px' }}>
        <div className="hw-flex hw-flex-col">
          <div className="hw-icon-box-success hw-mb-16" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <FiBriefcase size={22} />
          </div>
          <div className="hw-flex hw-justify-between hw-items-end">
            <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '10px' }}>Active</span>
            <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A', fontSize: '24px' }}>{activeCount}</div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onApplicationsClick} style={{ borderRadius: '24px' }}>
        <div className="hw-flex hw-flex-col">
          <div className="hw-icon-box-primary hw-mb-16" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>
            <FiUsers size={22} />
          </div>
          <div className="hw-flex hw-justify-between hw-items-end">
            <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '10px' }}>Applications</span>
            <div className="text-display-xl hw-text-32" style={{ lineHeight: 0.8, color: '#0F172A', fontSize: '24px' }}>{acceptedCount}</div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg" className="hw-card-interactive" onClick={onPortfolioClick} style={{ borderRadius: '24px', gridColumn: 'span 2' }}>
        <div className="hw-flex hw-justify-between hw-items-center">
          <div className="hw-flex hw-items-center hw-gap-16">
            <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', background: '#DCFCE7', color: '#16A34A', flexShrink: 0 }}>
              <FiCheckCircle size={22} />
            </div>
            <span className="text-label-sm" style={{ color: '#64748B', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '10px' }}>Previous Works</span>
          </div>
          <div className="text-display-xl hw-text-32" style={{ color: '#0F172A', fontSize: '24px' }}>{pastWorksCount}</div>
        </div>
      </Card>
    </div>
  );
}
