"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiTrash2, FiMapPin, FiZap } from "react-icons/fi";
import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/Button";
import { JobCard } from "@/Components/ui/JobCard";
import HashLoader from "@/Components/common/HashLoader";
import SectionHeader from "@/Components/common/SectionHeader";
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

  const handleDelete = async (jobId) => {
    if (window.confirm("Are you sure you want to remove this task from your wishlist?")) {
      await removeJob(jobId);
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
      }
    } catch (err) {
      console.error("Error applying to job:", err);
      alert("Failed to record interest. Please try again.");
    }
  };

  if (loading) return <HashLoader />;

  return (
    <div className="wh-dashboard" style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <SectionHeader title="My Wishlist" />

      <PageContainer>
        <div style={{ padding: '24px 20px' }}>

        {savedJobs.length === 0 ? (
          <Card variant="flat" padding="xl" className="hw-text-center">
            <h2 className="sub-head-text">Your wishlist is empty</h2>
            <p className="para-text hw-mt-8 hw-opacity-60">Jobs you favorite will appear here.</p>
            <Button variant="primary" className="hw-mt-24" onClick={() => router.push('/worker')}>
              Discover Gigs
            </Button>
          </Card>
        ) : (
          <div className="hw-flex hw-flex-col hw-gap-16">
            {savedJobs.map(({ jobs: job }) => (
              <JobCard 
                key={job.id}
                job={job}
                onViewDetails={(id) => router.push(`/worker/browse/detail?id=${id}`)}
                onApply={applyToJob}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        </div>
      </PageContainer>
    </div>
  );
}
