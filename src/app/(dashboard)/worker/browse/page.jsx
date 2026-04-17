"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiSearch, FiSliders, FiMapPin } from "react-icons/fi";
import WorkerFilterModal from "@/Components/worker/WorkerFilterModal";
import HashLoader from "@/Components/common/HashLoader";
import "@/css/worker.css";

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Button } from "@/Components/ui/Button";
import { JobCard } from "@/Components/ui/JobCard";
import { EmptyState } from "@/Components/ui/EmptyState";

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
    location_type: "all",
    urgency: "all",
    city: "",
    radius: 50, // Default to 50km
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

      // If user has no coordinates, we do a basic filtered query instead of RPC
      if (!currentUserCoords) {
        let query = supabase
          .from("jobs")
          .select("*, profiles!jobs_hirer_id_fkey(first_name, last_name, avatar_url)")
          .eq("status", "active");

        if (filters.category !== "all") query = query.eq("category", filters.category);
        if (filters.location_type !== "all") query = query.eq("location_type", filters.location_type);
        if (filters.urgency !== "all") query = query.eq("urgency", filters.urgency);
        if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        setJobs(data || []);
      } else {
        // Use RPC for location-based search
        const { data, error } = await supabase.rpc('get_nearby_jobs', {
          user_lat: currentUserCoords.lat,
          user_lng: currentUserCoords.lon,
          radius_km: parseFloat(filters.radius || 50),
          category_filter: filters.category,
          mode_filter: filters.location_type,
          urgency_filter: filters.urgency,
          search_term: searchTerm
        });

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
    <div className="wh-dashboard" style={{ padding: 'var(--space-xl) 0' }}>
      <PageContainer>
        <header style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 className="text-display-xl" style={{ fontSize: '36px', marginBottom: 'var(--space-xs)' }}>Find Work</h1>
          <p className="text-body-md">Explore premium opportunities tailored for you</p>
        </header>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Search Roles..."
              style={{
                width: '100%', padding: '12px 12px 12px 48px', borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                outline: 'none', fontSize: '15px'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" onClick={() => setIsFilterModalOpen(true)} style={{ padding: '0 16px' }}>
            <FiSliders size={20} />
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          <Button 
            variant={filters.location_type === "remote" ? "primary" : "ghost"} size="sm"
            onClick={() => setFilters({ ...filters, location_type: filters.location_type === "remote" ? "all" : "remote" })}
          >
            Remote
          </Button>
          <Button 
            variant={filters.urgency === "immediate" ? "primary" : "ghost"} size="sm"
            onClick={() => setFilters({ ...filters, urgency: filters.urgency === "immediate" ? "all" : "immediate" })}
          >
            Immediate
          </Button>
          {["Development", "Design", "Marketing"].map((cat) => (
            <Button 
              key={cat} size="sm"
              variant={filters.category === cat.toLowerCase() ? "primary" : "ghost"}
              onClick={() => setFilters({ ...filters, category: filters.category === cat.toLowerCase() ? "all" : cat.toLowerCase() })}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div>
          {loading ? (
            <div style={{ padding: 'var(--space-2xl) 0' }}><HashLoader text="" /></div>
          ) : jobs.length === 0 ? (
            <EmptyState 
              title={!userCoords ? "No tasks available" : "No tasks nearby"} 
              description={!userCoords 
                ? "We couldn't find any active tasks. Try checking back later or adjusting your category filters."
                : "Try expanding your search radius or checking different categories."
              }
              icon={<FiMapPin size={32} />}
              actionLabel="Refresh Search"
              onAction={fetchJobs}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
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
