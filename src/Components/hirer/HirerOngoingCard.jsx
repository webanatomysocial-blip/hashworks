import React from 'react';
import { Card } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { FiClock, FiMessageCircle, FiUser } from 'react-icons/fi';

/**
 * HirerOngoingCard Component
 * Displays the most recent active contract from the hirer's perspective.
 * Shows which worker is currently performing which task.
 */
export default function HirerOngoingCard({ contract, onViewContract, onChat }) {
  if (!contract) return null;

  const job = contract.jobs || {};
  const worker = contract.worker || {};
  const progress = contract.progress_percentage || 0;

  return (
    <Card variant="elevated" padding="lg" className="hw-card-primary" style={{ borderRadius: '28px', boxShadow: '0 20px 48px rgba(28, 77, 255, 0.25)', border: 'none' }}>
      <div className="hw-flex hw-justify-between hw-items-start hw-mb-24">
        <div>
          <div className="hw-flex hw-items-center hw-gap-8 hw-mb-12">
            <Badge variant="success" showDot>ACTIVE COLLABORATION</Badge>
          </div>
          <h2 className="text-display-sm" style={{ color: 'white', fontSize: '28px', lineHeight: 1.2 }}>{job.title || 'Ongoing Task'}</h2>
        </div>
        <button 
            onClick={onViewContract}
            style={{ padding: '10px 18px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        >
          View Workspace
        </button>
      </div>

      <div className="hw-flex hw-items-center hw-gap-16" style={{ background: 'white', padding: '16px', borderRadius: '22px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div className="wh-avatar-placeholder" style={{ width: '52px', height: '52px', borderRadius: '18px', fontSize: '18px', background: '#f1f5f9', color: '#1C4DFF', fontWeight: 900 }}>
            {worker.avatar_url ? (
              <img src={worker.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} />
            ) : (
              (worker.first_name?.[0] || 'W').toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
             <p className="text-label-sm" style={{ color: '#64748B', marginBottom: '4px', fontSize: '10px' }}>WORKING ON TASK</p>
             <h4 style={{ color: '#0F172A', fontWeight: 800, fontSize: '17px', margin: 0 }}>{worker.first_name || 'Anonymous'} {worker.last_name?.[0] ? `${worker.last_name[0]}.` : ''}</h4>
          </div>
          <button 
            onClick={onChat}
            style={{ background: '#1C4DFF', color: 'white', border: 'none', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(28, 77, 255, 0.3)' }}
          >
            <FiMessageCircle size={22} />
          </button>
      </div>

    </Card>
  );
}
