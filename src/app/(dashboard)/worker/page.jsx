"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiSearch, FiBookmark } from "react-icons/fi";
import { calculateDistance } from "@/lib/location";
import HashLoader from "@/Components/common/HashLoader";
import "@/css/worker.css";

import { PageContainer } from "@/Components/layouts/PageContainer";
import { Card } from "@/Components/ui/Card";
import ActiveGigCard from "@/Components/worker/ActiveGigCard";
import SummaryStats from "@/Components/worker/SummaryStats";
import UrgentJobsList from "@/Components/worker/UrgentJobsList";
import LatestChatsList from "@/Components/worker/LatestChatsList";
import DiscoveryStack from "@/Components/worker/discovery/DiscoveryStack";
import { useStats } from "@/Components/providers/StatsProvider";
import { Button } from "@/Components/ui/Button";

export default function WorkerDashboardHome() {
  const router = useRouter();
  const { stats } = useStats();
  const [activeGig, setActiveGig] = useState(null);
  const [urgentJobs, setUrgentJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [latestChats, setLatestChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeToggle, setActiveToggle] = useState("findWork");
  const [profile, setProfile] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      // Fetch Profile
      const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Active contract
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`*, jobs(*), hirer:profiles!contracts_hirer_id_fkey(first_name, last_name, avatar_url)`)
        .eq("worker_id", user.id).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1);
      if (contractsData?.[0]) setActiveGig(contractsData[0]);

      // Urgent jobs
      const { data: urgentData } = await supabase
        .from("jobs")
        .select("id, title, description, budget_min, budget_max, city, subcity, urgency, role_type, location_type, created_at, estimated_minutes, latitude, longitude")
        .in("urgency", ["immediate", "high"]).eq("status", "active")
        .order("created_at", { ascending: false }).limit(8);
        
      const urgentWithDistance = (urgentData || []).map(job => {
        if (prof?.latitude && prof?.longitude && job.latitude && job.longitude) {
          const dist = calculateDistance(prof.latitude, prof.longitude, job.latitude, job.longitude);
          return { ...job, distance: dist };
        }
        return job;
      });
      setUrgentJobs(urgentWithDistance);

      // Fetch IDs of jobs the worker has already interaction with (saved or rejected)
      const { data: savedData } = await supabase.from("saved_jobs").select("job_id").eq("worker_id", user.id);
      const { data: rejectedData } = await supabase.from("rejected_jobs").select("job_id").eq("worker_id", user.id);
      
      const seenJobIds = [
        ...(savedData?.map(s => s.job_id) || []),
        ...(rejectedData?.map(r => r.job_id) || [])
      ];

      // Recommended jobs for Discovery Stack (filtered to remove seen jobs)
      let discoveryQuery = supabase
        .from("jobs")
        .select("*, profiles!jobs_hirer_id_fkey(first_name, last_name, avatar_url)")
        .eq("status", "active")
        .gte("start_date", new Date().toISOString().split('T')[0]); 
      
      if (seenJobIds.length > 0) {
        discoveryQuery = discoveryQuery.not("id", "in", `(${seenJobIds.join(',')})`);
      }

      const { data: discoveryData } = await discoveryQuery
        .order("created_at", { ascending: false })
        .limit(10);

      const discoveryWithDistance = (discoveryData || []).map(job => {
        if (prof?.latitude && prof?.longitude && job.latitude && job.longitude) {
          const dist = calculateDistance(prof.latitude, prof.longitude, job.latitude, job.longitude);
          return { ...job, distance: dist };
        }
        return job;
      });
      setRecommendedJobs(discoveryWithDistance);

      // Latest chats — one per contract, most recent message
      const { data: chatsData } = await supabase
        .from("messages")
        .select(`id, content, created_at, is_read,
          contract:contracts!messages_contract_id_fkey(
            id,
            hirer:profiles!contracts_hirer_id_fkey(id, first_name, last_name, avatar_url),
            worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, avatar_url)
          )`)
        .order("created_at", { ascending: false }).limit(20);

      const seen = new Set();
      const deduped = [];
      for (const msg of (chatsData || [])) {
        const cid = msg.contract?.id;
        if (cid && !seen.has(cid)) {
          seen.add(cid);
          const isWorker = msg.contract?.worker?.id === user.id;
          deduped.push({ ...msg, otherPerson: isWorker ? msg.contract?.hirer : msg.contract?.worker });
          if (deduped.length >= 5) break;
        }
      }
      setLatestChats(deduped);

    } catch (err) { console.error("Dashboard Fetch Error:", err); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <HashLoader text="" />;

  return (
    <div className="wh-dashboard">
      <PageContainer>

        {/* Role Toggle */}
        <div className="hw-role-toggle" style={{ marginTop: '20px' }}>
          <button 
            className={`hw-toggle-btn ${activeToggle === 'findWork' ? 'hw-toggle-btn--active' : ''}`} 
            onClick={() => setActiveToggle("findWork")}
          >
            Find Work
          </button>
          <button 
            className={`hw-toggle-btn ${activeToggle === 'postTask' ? 'hw-toggle-btn--active' : ''}`} 
            onClick={() => { setActiveToggle("postTask"); router.push('/hirer'); }}
          >
            Post Task
          </button>
        </div>

        {/* Greeting Section */}
        <div className="hw-flex hw-justify-between hw-items-end hw-mb-32" style={{ padding: '0 16px' }}>
            <div>
                <p className="text-label-sm" style={{ color: '#64748B', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>WORKER HUB</p>
                <h1 className="text-display-xl" style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px' }}>
                    Hello, {profile?.first_name || 'Worker'}
                </h1>
            </div>
            <Button 
                variant="ghost" 
                onClick={() => router.push('/worker/saved')}
                className="hw-flex hw-items-center hw-gap-8"
                style={{ color: 'var(--color-primary)', padding: '0 0 8px 0', height: 'auto' }}
            >
                <FiBookmark size={20} />
                <span className="text-label-sm" style={{ fontWeight: 800 }}>WISHLIST</span>
            </Button>
        </div>

        {/* Active Gig or CTA */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          {activeGig ? (
            <ActiveGigCard gig={activeGig} onViewTask={() => router.push('/worker/active-gigs')} />
          ) : (
            <Card variant="elevated" padding="lg" className="hw-card-primary hw-text-center" style={{ borderRadius: '28px' }}>
              <div className="text-label-sm">Ready to Work</div>
              <h1 className="text-headline-lg">No Active Gigs</h1>
              <p className="text-body-md hw-mt-4">
                Browse available opportunities nearby to start earning today.
              </p>
              <button 
                className="hw-btn hw-btn-secondary hw-mt-4" 
                onClick={() => router.push('/worker/browse')}
              >
                Explore Gigs
              </button>
            </Card>
          )}
        </div>

        {/* Urgent Opportunities */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <UrgentJobsList
            jobs={urgentJobs}
            onViewAll={() => router.push('/worker/browse?urgency=immediate')}
            onJobClick={(id) => router.push(`/worker/browse/detail?id=${id}`)}
          />
        </div>

        {/* Explore All Gigs */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <Card 
            variant="elevated" 
            padding="lg" 
            className="hw-card-interactive" 
            onClick={() => router.push('/worker/browse')}
            style={{ borderRadius: '20px' }}
          >
            <div className="hw-flex hw-items-center hw-gap-16">
              <div className="hw-icon-box" style={{ background: '#f1f5f9', color: '#1C4DFF' }}>
                <FiSearch size={22} />
              </div>
              <div className="hw-flex-1">
                <h3 className="text-title-md" style={{ fontWeight: 800 }}>Explore All Nearby Gigs</h3>
                <p className="text-body-md hw-mt-2">Find more opportunities to increase your earnings.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <SummaryStats
            activeCount={stats.worker.active_gigs}
            acceptedCount={stats.worker.total_applications}
            onActiveClick={() => router.push('/worker/active-gigs')}
            onApplicationsClick={() => router.push('/worker/applications')}
          />
        </div>

        {/* Discovery Stack */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <div className="hw-mb-16">
            <h2 className="text-headline-lg" style={{ fontWeight: 800 }}>Discover Your Next Gig</h2>
            <p className="text-body-md hw-mt-2">Swipe cards to save or ignore</p>
          </div>
          <DiscoveryStack 
            jobs={recommendedJobs} 
            onEmpty={() => router.push('/worker/browse')} 
          />
        </div>

        {/* Latest Chats */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <LatestChatsList
            chats={latestChats}
            onViewAll={() => router.push('/messages')}
            onChatClick={(contractId) => router.push(`/messages?contract=${contractId}`)}
          />
        </div>
      </PageContainer>
    </div>
  );
}
