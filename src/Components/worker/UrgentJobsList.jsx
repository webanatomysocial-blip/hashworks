"use client";

import { FiArrowRight, FiBriefcase } from "react-icons/fi";
import { Badge } from "../ui/Badge";

export default function UrgentJobsList({ jobs = [], onViewAll, onJobClick }) {
  if (!jobs.length) return null;

  return (
    <div>
      {/* Section Header */}
      <div className="hw-flex hw-justify-between hw-items-center hw-mb-12">
        <div>
          <div className="text-label-sm text-urgent hw-mb-4" style={{ color: '#8898aa' }}>HIGH PRIORITY</div>
          <h2 className="text-headline-lg" style={{ color: '#0F172A', fontWeight: 500 }}>Urgent Opportunities</h2>
        </div>
        <button
          className="hw-btn hw-btn-ghost hw-btn-sm"
          onClick={onViewAll}
          style={{ paddingRight: 0, fontWeight: 500, color: '#475569' }}
        >
          View All Urgent <FiArrowRight size={13} style={{ marginLeft: '4px' }} />
        </button>
      </div>

      {/* Horizontal Scroll */}
      <div className="hw-urgent-scroll" style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px', scrollSnapType: 'x mandatory' }}>
        {jobs.map((job) => (
          <div 
            key={job.id} 
            style={{ 
              scrollSnapAlign: 'start', 
              flexShrink: 0, 
              width: '260px', 
              background: '#FFF', 
              borderRadius: '24px', 
              padding: '24px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={() => onJobClick(job.id)}
          >
            {/* Top row: Alert Badge + Distance */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <Badge variant="urgent" showDot>
                URGENT
              </Badge>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                {job.subcity ? `${job.subcity}${job.city ? `, ${job.city}` : ''}` : (job.city || (job.distance ? `${job.distance.toFixed(1)} km away` : 'Near you'))}
              </div>
            </div>

            {/* Middle: Image + Title */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              {job.reference_image_url ? (
                  <img 
                    src={job.reference_image_url} 
                    alt="job" 
                    style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} 
                  />
              ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FiBriefcase color="#64748B" size={20} />
                  </div>
              )}
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#1E293B', margin: 0, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.title}
              </h3>
            </div>

            {/* Bottom: Payout & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Payout</p>
                <p style={{ fontSize: '18px', fontWeight: 500, color: '#0F172A', margin: 0 }}>
                   ₹{(job.budget_max || job.budget_min || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '10px', fontWeight: 500, color: '#64748B', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Time</p>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#0F172A', margin: 0 }}>
                  {job.estimated_minutes ? `${job.estimated_minutes}m` : 'ASAP'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
