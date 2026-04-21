import React from 'react';
import { FiPlus, FiUsers, FiChevronRight } from 'react-icons/fi';
import { Card } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';

/**
 * HirerPostingsList Component
 * Horizontal scrollable list for Hirer's own job listings.
 */
export default function HirerPostingsList({ jobs, onJobClick, onAddClick }) {
  return (
    <div className="wh-section" style={{ padding: '0 16px' }}>
      <div className="hw-flex hw-justify-between hw-items-end hw-mb-20">
        <div>
          <h2 className="text-display-sm" style={{ fontWeight: 500, fontSize: '24px' }}>Active Postings</h2>
          <p className="text-body-md hw-mt-2">Manage your current tasks and applicants</p>
        </div>
        <button 
           onClick={onAddClick}
           className="hw-btn hw-btn-secondary"
           style={{ 
             height: '46px', 
             padding: '0 24px', 
             fontSize: '14px', 
             boxShadow: '0 8px 20px rgba(199, 242, 132, 0.3)',
             whiteSpace: 'nowrap',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             background: '#c7f284',
             color: '#0F172A',
             borderRadius: '16px',
             fontWeight: 500
           }}
        >
          <FiPlus size={20} /> <span>Post New</span>
        </button>
      </div>

      <div className="hw-urgent-scroll" style={{ paddingBottom: '12px' }}>
        {jobs.length === 0 ? (
          <Card 
            variant="elevated" 
            padding="xl" 
            className="hw-text-center hw-flex hw-flex-col hw-items-center hw-justify-center"
            style={{ width: '100%', minHeight: '180px', borderRadius: '24px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', border: '1.5px dashed var(--hw-surface-high)' }}
          >
            <div className="hw-icon-box hw-mb-16" style={{ background: 'var(--hw-surface-high)', color: 'var(--hw-text-secondary)' }}>
                <FiPlus size={24} />
            </div>
            <h3 className="text-title-md hw-mb-8">No Active Postings</h3>
            <p className="text-body-md hw-mb-20">Post a new task to start finding talent nearby.</p>
            <button className="hw-btn hw-btn-primary" style={{ height: '48px' }} onClick={onAddClick}>
                Create Your First Task
            </button>
          </Card>
        ) : (
          jobs.map(job => (
            <Card 
              key={job.id} 
              variant="elevated" 
              padding="lg" 
              className="hw-urgent-card" 
              onClick={() => onJobClick(job.id)}
              style={{ minWidth: '280px', borderRadius: '20px' }}
            >
              <div className="hw-flex hw-justify-between hw-items-start hw-mb-12">
                <Badge variant={job.urgency === 'immediate' ? 'urgent' : 'neutral'}>
                  {job.urgency === 'immediate' ? 'Urgent' : 'Flexible'}
                </Badge>
                <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiUsers size={14} />
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{job.application_count || 0}</span>
                </div>
              </div>
              <h3 className="text-title-md hw-line-clamp-1 hw-mb-8">{job.title}</h3>
              <div className="hw-flex hw-justify-between hw-items-center hw-mt-auto">
                <span className="text-label-sm" style={{ fontWeight: 500, color: '#4f74ff' }}>
                  ₹{(job.budget_max || 0).toLocaleString()}
                </span>
                <FiChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
