"use client";

import React from "react";
import { FiStar, FiBriefcase, FiClock } from "react-icons/fi";
import { formatLocationShort } from "@/lib/location";

export default function RecommendedJobsList({ jobs, onJobClick }) {
  return (
    <div className="wh-section">
      <div className="wh-section-header">
        <div className="wh-sec-title-wrap">
          <h2><FiStar color="#3b82f6" style={{ marginRight: '8px' }} /> Recommended</h2>
        </div>
      </div>
      <div className="wh-v-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {jobs.map((job, idx) => (
          <div key={job.id} className="wh-rec-item" onClick={() => onJobClick(job.id)}>
            <div className="wh-rec-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div 
                className={`wh-rec-icon ${idx % 2 === 0 ? 'blue' : 'green'}`}
                style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px'
                }}
              >
                {idx % 2 === 0 ? <FiBriefcase /> : <FiClock />}
              </div>
              <div className="wh-rec-info">
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>{job.title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  {formatLocationShort({ city: job.city || job.profiles?.city })} • {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>
            <div className="wh-rec-price" style={{ fontSize: '18px', fontWeight: '800' }}>
              ₹{job.budget_max || job.budget_min}
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
           <div style={{ color: '#64748b', fontSize: '13px', padding: '10px' }}>No recommendations found.</div>
        )}
      </div>
    </div>
  );
}
