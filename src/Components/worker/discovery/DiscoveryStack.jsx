"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import TinderCard from "react-tinder-card";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { 
  FiSearch, FiX, FiHeart, FiBookmark, FiMapPin, 
  FiClock, FiTrendingUp, FiCheckCircle, FiChevronRight 
} from "react-icons/fi";
import { Button } from "@/Components/ui/Button";
import { supabase } from "@/lib/supabase";

// Helper for relative time
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

export default function DiscoveryStack({ jobs, onEmpty }) {
  const router = useRouter();
  const [removedJobIds, setRemovedJobIds] = useState(new Set());
  const [showIndicator, setShowIndicator] = useState(null);
  const childRefs = useMemo(
    () => Array(jobs?.length || 0).fill(0).map((i) => React.createRef()),
    [jobs?.length]
  );

  const swiped = async (direction, jobId) => {
    setRemovedJobIds((prev) => new Set(prev).add(jobId));
    setShowIndicator(direction);
    setTimeout(() => setShowIndicator(null), 800);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (direction === "right") {
        await supabase.from("saved_jobs").upsert({ worker_id: user.id, job_id: jobId });
      } else if (direction === "left") {
        await supabase.from("rejected_jobs").upsert({ worker_id: user.id, job_id: jobId });
      }
    } catch (err) {
      console.error(`Error recording ${direction} swipe:`, err);
    }
  };

  const swipe = async (dir, jobId) => {
    const jobIndex = filteredJobs.findIndex(j => j.id === jobId);
    if (jobIndex !== -1 && childRefs[jobIndex]?.current) {
      await childRefs[jobIndex].current.swipe(dir);
    }
  };

  const filteredJobs = (jobs || []).filter((job) => !removedJobIds.has(job.id));
  const currentJobsDisplay = filteredJobs.slice(0, 10);

  if (filteredJobs.length === 0) {
    return (
      <div className="hw-discovery-empty">
        <h3 className="text-headline-lg">All caught up!</h3>
        <p className="text-body-md">No more recommended gigs at the moment.</p>
        <Button variant="primary" onClick={onEmpty}>
          <FiSearch /> Browse All Gigs
        </Button>
      </div>
    );
  }

  return (
    <div className="hw-discovery-container">
      {/* Swipe Indicators */}
      {showIndicator === 'left' && (
        <div className="hw-swipe-indicator hw-swipe-indicator--left" style={{ animation: 'fadeIn 0.3s' }}>
          <div className="hw-indicator-icon"><FiX size={32} /></div>
          <span className="text-label-sm hw-font-bold">SKIP</span>
        </div>
      )}
      {showIndicator === 'right' && (
        <div className="hw-swipe-indicator hw-swipe-indicator--right" style={{ animation: 'fadeIn 0.3s' }}>
          <div className="hw-indicator-icon"><FiHeart size={32} /></div>
          <span className="text-label-sm hw-font-bold">SAVED</span>
        </div>
      )}

      <div className="hw-card-stack">
        {[...currentJobsDisplay].reverse().map((job) => {
          const index = currentJobsDisplay.findIndex((j) => j.id === job.id);
          
          // Apply stacking logic: the top card (index 0) has no offset. Lower cards get scaled down and shifted down.
          // We limit it to the first 3 visible offset layers for aesthetics.
          const visibleIndex = Math.min(index, 3);
          const stackScale = 1 - visibleIndex * 0.05;
          const stackTranslateY = visibleIndex * 15; // move down slightly
          const stackOpacity = index > 3 ? 0 : 1;
          
          return (
            <TinderCard
              ref={childRefs[index]}
              key={job.id}
              onSwipe={(dir) => swiped(dir, job.id)}
              preventSwipe={["up", "down"]}
              className="hw-tinder-card-wrapper hw-stack-card-layer"
            >
              <div 
                className="hw-discovery-card hw-absolute-fill"
                onClick={() => router.push(`/worker/browse/detail?id=${job.id}`)}
                style={{ 
                  cursor: 'pointer',
                  transform: `scale(${stackScale}) translateY(${stackTranslateY}px)`,
                  opacity: stackOpacity,
                  transition: 'all 0.4s ease',
                  backgroundColor: 'var(--hw-surface-highest)'
                }}
              >
                {/* Top Row: Time & Urgency */}
                <div className="hw-discovery-badge-row">
                  <div className="hw-time-badge">{timeAgo(job.created_at)}</div>
                  {job.urgency === 'immediate' && (
                    <Badge variant="urgent" showDot>URGENT</Badge>
                  )}
                </div>

                {/* Image or Fallback Area */}
                <div className="hw-discovery-image-container">
                  {job.reference_image_url ? (
                    <img src={job.reference_image_url} alt={job.title} className="hw-discovery-image" />
                  ) : (
                    <div className="hw-discovery-no-image">
                      <div className="hw-payout-display">
                        {job.budget_max || job.budget_min ? `₹${(job.budget_max || job.budget_min).toLocaleString()}` : 'TBA'}
                      </div>
                      <p className="text-body-md hw-opacity-60">Payout for this task</p>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="hw-discovery-content">
                  <div>
                    <h1 className="hw-discovery-title">{job.title}</h1>
                    
                    <div className="hw-discovery-meta-row">
                      <span className="hw-flex hw-items-center hw-gap-4">
                        <FiMapPin /> {job.city || job.subcity || job.location_type || 'Nearby'}
                      </span>
                      <span className="hw-flex hw-items-center hw-gap-4">
                        <FiClock /> {job.estimated_minutes ? `${job.estimated_minutes}m` : 'Quick'}
                      </span>
                      {job.verified_only && (
                        <Badge variant="active" showDot style={{ fontSize: '10px' }}>
                          VERIFIED
                        </Badge>
                      )}
                    </div>

                    <div className="hw-discovery-tags">
                      <Badge variant="neutral">{job.category || 'Gig'}</Badge>
                      <Badge variant="success">
                        Payout {job.budget_max || job.budget_min ? `₹${job.budget_max || job.budget_min}` : 'TBA'}
                      </Badge>
                    </div>
                  </div>

                  <div className="hw-swipe-hint">
                    SWIPE TO EXPLORE <FiChevronRight />
                  </div>
                </div>

              </div>
            </TinderCard>
          );
        })}
      </div>

      {/* Manual Actions Row */}
      <div className="hw-discovery-actions">
        <div 
          className="hw-action-btn hw-action-btn--dismiss"
          onClick={() => swipe('left', currentJobsDisplay[0]?.id)}
        >
          <FiX size={28} />
        </div>
      
        <div 
          className="hw-action-btn hw-action-btn--save"
          onClick={() => swipe('right', currentJobsDisplay[0]?.id)}
        >
          <FiBookmark size={28} />
        </div>
      </div>
    </div>
  );
}
