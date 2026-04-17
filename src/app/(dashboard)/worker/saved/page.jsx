"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiArrowLeft, FiTrash2, FiMapPin, FiClock, FiDollarSign, FiZap } from "react-icons/fi";
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/Button";
import HashLoader from "@/Components/common/HashLoader";
import "@/css/worker.css";

export default function SavedJobsPage() {
  const router = useRouter();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .select(`
          job_id,
          jobs!inner (
            id,
            title,
            budget_min,
            budget_max,
            city,
            urgency,
            created_at,
            reference_image_url,
            status,
            start_date
          )
        `)
        .eq("worker_id", user.id)
        .eq("jobs.status", "active")
        .gte("jobs.start_date", new Date().toISOString().split('T')[0]);

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const removeJob = async (jobId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("worker_id", user.id)
        .eq("job_id", jobId);

      if (error) throw error;
      setSavedJobs((prev) => prev.filter((item) => item.job_id !== jobId));
    } catch (err) {
      console.error("Error removing job:", err);
    }
  };

  const applyToJob = async (jobId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('applications').insert([{
        job_id: jobId,
        worker_id: user.id,
        status: 'pending'
      }]);

      if (error) {
        if (error.code === '23505') {
            alert("You have already applied for this task!");
        } else {
            throw error;
        }
      } else {
        alert("Interest recorded! The owner will be notified.");
        // Optional: Remove from wishlist after applying
        // removeJob(jobId);
      }
    } catch (err) {
      console.error("Error applying to job:", err);
      alert("Failed to record interest. Please try again.");
    }
  };

  if (loading) return <HashLoader />;

  return (
    <div className="wh-dashboard" style={{ padding: 'var(--space-xl) 0' }}>
      <PageContainer size="md">
        <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Button variant="ghost" onClick={() => router.back()} style={{ padding: '8px' }}>
            <FiArrowLeft size={20} />
          </Button>
          <h1 className="text-display-sm">My Wishlist</h1>
        </header>

        {savedJobs.length === 0 ? (
          <Card variant="flat" padding="xl" className="hw-text-center">
            <h2 className="text-headline-md">Your wishlist is empty</h2>
            <p className="text-body-md hw-mt-8 hw-opacity-60">Jobs you favorite will appear here.</p>
            <Button variant="primary" className="hw-mt-24" onClick={() => router.push('/worker')}>
              Discover Gigs
            </Button>
          </Card>
        ) : (
          <div className="hw-flex hw-flex-col hw-gap-16">
            {savedJobs.map(({ jobs: job }) => (
              <Card 
                key={job.id} 
                variant="elevated" 
                padding="md" 
                className="hw-card-interactive"
                onClick={() => router.push(`/worker/browse/detail?id=${job.id}`)}
                style={{ borderRadius: '24px' }}
              >
                <div className="hw-flex hw-items-center hw-gap-16">
                   {job.reference_image_url ? (
                     <div style={{ width: 80, height: 80, borderRadius: '18px', overflow: 'hidden', flexShrink: 0 }}>
                       <img src={job.reference_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                   ) : (
                     <div className="hw-icon-box" style={{ width: 80, height: 80, flexShrink: 0, borderRadius: '18px' }}>
                       <FiDollarSign size={24} />
                     </div>
                   )}
                  
                  <div className="hw-flex-1">
                    <h3 className="text-title-md" style={{ color: '#0F172A', fontWeight: 800 }}>{job.title}</h3>
                    <div className="hw-flex hw-items-center hw-gap-12 hw-mt-4 hw-opacity-80">
                      <span className="text-label-sm hw-flex hw-items-center hw-gap-4">
                        <FiMapPin color="var(--color-primary)" /> {job.city || 'Nearby'}
                      </span>
                      <span className="text-label-sm hw-flex hw-items-center hw-gap-4" style={{ color: '#10B981', fontWeight: 900 }}>
                        ₹{job.budget_max?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="hw-flex hw-items-center hw-gap-8">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); applyToJob(job.id); }}
                      style={{ borderRadius: '12px', padding: '8px 16px', height: '40px' }}
                    >
                      <FiZap size={14} style={{ marginRight: '4px' }} /> Apply
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeJob(job.id); }}
                      style={{ color: '#ff4d4d', padding: '8px', minWidth: '40px' }}
                    >
                      <FiTrash2 size={20} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
