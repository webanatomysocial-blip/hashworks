"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiSearch, FiSliders, FiMapPin } from "react-icons/fi";
import WorkerFilterModal from "@/Components/worker/WorkerFilterModal";
import HashLoader from "@/Components/common/HashLoader";
import SectionHeader from "@/Components/common/SectionHeader";
import "@/css/worker.css";

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Button } from "@/Components/ui/Button";
import { JobCard } from "@/Components/ui/JobCard";
import { EmptyState } from "@/Components/ui/EmptyState";

// Standard DB Categories
const DB_CATEGORIES = [
  "Cleaning", "Delivery", "Moving", "Repair", 
  "Development", "Design", "Marketing", "Other"
];

export default function BrowseJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const [filters, setFilters] = useState({
    category: "all",
    budget: 0,
    budget_max: 0,
    location_type: "all",
    urgency: "all",
    city: "",
    radius: 0, // Default to 0 (Anywhere) to show all jobs by default
  });

  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters, searchTerm]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let currentUserCoords = userCoords;
      if (!currentUserCoords) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("latitude, longitude")
          .eq("id", user.id)
          .single();
        if (profile?.latitude && profile?.longitude) {
          currentUserCoords = { lat: profile.latitude, lon: profile.longitude };
          setUserCoords(currentUserCoords);
        }
      }

      // STRATEGY: If radius is 0 (Anywhere), use a standard query to guarantee "Show Everything".
      // Only use the RPC if the user explicitly chooses a distance (Radius > 0).
      if (filters.radius === 0) {
        console.log("Fetching all jobs (Anywhere mode)...");
        let query = supabase
          .from("jobs")
          .select("*, profiles!jobs_hirer_id_fkey(first_name, last_name, avatar_url)")
          .eq("status", "active")
          .neq("hirer_id", user.id);

        if (filters.category !== "all") query = query.eq("category", filters.category);
        if (filters.location_type !== "all") query = query.eq("location_type", filters.location_type);
        if (filters.urgency !== "all") query = query.eq("urgency", filters.urgency);
        if (filters.budget > 0) query = query.gte("budget_max", filters.budget);
        if (filters.budget_max > 0) query = query.lte("budget_max", filters.budget_max);
        if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        setJobs(data || []);
      } else if (currentUserCoords) {
        // Only use RPC if we have both a radius preference AND the user's current location
        console.log(`Fetching nearby jobs (Radius: ${filters.radius}km)...`);
        const { data, error } = await supabase.rpc('get_nearby_jobs', {
          user_lat: currentUserCoords.lat,
          user_lng: currentUserCoords.lon,
          radius_km: parseFloat(filters.radius), 
          category_filter: filters.category,
          mode_filter: filters.location_type,
          urgency_filter: filters.urgency,
          search_term: searchTerm
        });

        if (error) throw error;
        let results = (data || []).filter(j => j.status === 'active' && j.hirer_id !== user.id);
        
        // Manual final filter for budget since RPC doesn't handle it yet
        if (filters.budget > 0) results = results.filter(j => j.budget_max >= filters.budget);
        if (filters.budget_max > 0) results = results.filter(j => j.budget_max <= filters.budget_max);
        
        setJobs(results);
      } else {
        // Case: Radius set but no location permission. Fallback to distance-less query.
        console.log("Radius set but location missing. Falling back to all jobs.");
        let query = supabase
          .from("jobs")
          .select("*, profiles!jobs_hirer_id_fkey(first_name, last_name, avatar_url)")
          .eq("status", "active")
          .neq("hirer_id", user.id);

        if (filters.category !== "all") query = query.eq("category", filters.category);
        if (filters.location_type !== "all") query = query.eq("location_type", filters.location_type);
        if (filters.urgency !== "all") query = query.eq("urgency", filters.urgency);
        if (filters.budget > 0) query = query.gte("budget_max", filters.budget);
        if (filters.budget_max > 0) query = query.lte("budget_max", filters.budget_max);
        if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        setJobs(data || []);
      }

      const { data: appsData } = await supabase.from("applications").select("job_id").eq("worker_id", user.id);
      if (appsData) setMyApplications(appsData.map((a) => a.job_id));
    } catch (err) { console.error("Error fetching jobs:", err); }
    finally { setLoading(false); }
  };

  const handleApply = async (job) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("Please log in to apply"); return; }
      if (myApplications.includes(job.id)) { alert("You have already applied."); return; }

      setApplyingJobId(job.id);
      const { error: applyError } = await supabase.from("applications").insert([{ job_id: job.id, worker_id: user.id, status: "pending" }]);

      if (applyError) throw applyError;
      setMyApplications((prev) => [...prev, job.id]);
    } catch (err) { alert("Failed to apply: " + err.message); }
    finally { setApplyingJobId(null); }
  };

  return (
    <div className="wh-dashboard">
      <SectionHeader title="Find Work" />
      <PageContainer>
        <div style={{ padding: '24px 20px' }}>
          {/* Search Row */}
          <div style={{ display: 'flex', gap: 'var(--hw-space-12)', marginBottom: 'var(--hw-space-24)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hw-text-secondary)' }} />
              <input
                type="text"
                className="hw-input"
                placeholder="Search Roles..."
                style={{ paddingLeft: '48px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                className="hw-btn-ghost" 
                onClick={() => setIsFilterModalOpen(true)} 
                style={{ 
                    width: '52px', 
                    padding: 0, 
                    borderRadius: 'var(--hw-radius-md)',
                    background: 'rgba(28, 77, 255, 0.08)',
                    border: 'none',
                    color: 'var(--hw-primary)'
                }}
            >
              <FiSliders size={20} />
            </button>
          </div>

          {/* Quick Category Filters */}
          <div className="hw-urgent-scroll" style={{ marginBottom: 'var(--hw-space-32)' }}>
            <Button 
                variant={filters.location_type === "remote" ? "primary" : "ghost"} size="sm"
                className="hw-font-bold"
                onClick={() => setFilters({ ...filters, location_type: filters.location_type === "remote" ? "all" : "remote" })}
            >
              Remote
            </Button>
            {DB_CATEGORIES.map((cat) => (
              <Button 
                key={cat} size="sm"
                variant={filters.category === cat.toLowerCase() ? "primary" : "ghost"}
                className="hw-font-bold"
                onClick={() => setFilters({ ...filters, category: filters.category === cat.toLowerCase() ? "all" : cat.toLowerCase() })}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Job List */}
          <div>
            {loading ? (
              <div style={{ padding: 'var(--hw-space-48) 0' }}><HashLoader text="" /></div>
            ) : jobs.length === 0 ? (
              <EmptyState 
                title={searchTerm ? "No results found" : "No tasks available"} 
                description={searchTerm 
                  ? "Try searching for something else or clearing filters." 
                  : "We couldn't find any active tasks. Try expanding your search radius."
                }
                icon={<FiMapPin size={32} />}
                actionLabel="Reset Filters"
                onAction={() => setFilters({ category: "all", budget: 0, budget_max: 0, location_type: "all", urgency: "all", city: "", radius: 0 })}
              />
            ) : (
              <div className="hw-flex hw-flex-col hw-gap-16">
                {jobs.map((job) => (
                  <JobCard 
                    key={job.id}
                    job={job}
                    distance={job.distance}
                    isApplied={myApplications.includes(job.id)}
                    isApplying={applyingJobId === job.id}
                    onViewDetails={(id) => router.push(`/worker/browse/detail/?id=${id}`)}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <WorkerFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </div>
  );
}
