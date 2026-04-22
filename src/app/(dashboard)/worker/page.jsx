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
import ActiveTaskBanner from "@/Components/common/ActiveTaskBanner";
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

      // Parallelize primary queries to prevent sequential waterfall blocking
      const [
        { data: prof },
        { data: contractsData },
        { data: urgentData },
        { data: savedData },
        { data: rejectedData },
        { data: chatsData }
      ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from("contracts")
            .select(`*, jobs(*), hirer:profiles!contracts_hirer_id_fkey(first_name, last_name, avatar_url)`)
            .eq("worker_id", user.id).eq("status", "active")
            .order("created_at", { ascending: false }).limit(1),
          supabase.from("jobs")
            .select("id, title, description, budget_min, budget_max, city, subcity, urgency, role_type, location_type, created_at, estimated_minutes, latitude, longitude, reference_image_url")
            .eq("urgency", "immediate").eq("status", "active")
            .neq("hirer_id", user.id).order("created_at", { ascending: false }).limit(8),
          supabase.from("saved_jobs").select("job_id").eq("worker_id", user.id),
          supabase.from("rejected_jobs").select("job_id").eq("worker_id", user.id),
          supabase.from("messages")
            .select(`id, content, created_at, is_read,
              contract:contracts!messages_contract_id_fkey(
                id,
                hirer:profiles!contracts_hirer_id_fkey(id, first_name, last_name, avatar_url),
                worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, avatar_url)
              )`)
            .order("created_at", { ascending: false }).limit(20)
      ]);

      setProfile(prof);

      if (contractsData?.[0]) {
        setActiveGig(contractsData[0]);
      } else {
        setActiveGig(null);
      }

      const urgentWithDistance = (urgentData || []).map(job => {
        if (prof?.latitude && prof?.longitude && job.latitude && job.longitude) {
          const dist = calculateDistance(prof.latitude, prof.longitude, job.latitude, job.longitude);
          return { ...job, distance: dist };
        }
        return job;
      });
      setUrgentJobs(urgentWithDistance);

      const seenJobIds = [
        ...(savedData?.map(s => s.job_id) || []),
        ...(rejectedData?.map(r => r.job_id) || [])
      ];

      // Discovery query relies on seenJobIds
      let discoveryQuery = supabase
        .from("jobs")
        .select("*, profiles!jobs_hirer_id_fkey(first_name, last_name, avatar_url)")
        .eq("status", "active")
        .neq("hirer_id", user.id)
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

      const seen = new Set();
      const deduped = [];
      for (const msg of (chatsData || [])) {
        const otherPerson = msg.contract?.worker?.id === user.id 
          ? msg.contract?.hirer 
          : msg.contract?.worker;
          
        if (otherPerson?.id && !seen.has(otherPerson.id)) {
          seen.add(otherPerson.id);
          deduped.push({ ...msg, otherPerson });
          if (deduped.length >= 5) break;
        }
      }
      setLatestChats(deduped);

    } catch (err) { console.error("Dashboard Fetch Error:", err); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { 
    fetchData(); 

    // ── Realtime Listener for Contracts ──
    const contractsChannel = supabase
      .channel('worker_dashboard_contracts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
    };
  }, [fetchData]);

  if (loading) return <HashLoader text="" />;

  return (
    <div className="wh-dashboard">
      <PageContainer style={{ paddingTop: '20px' }}>

        {/* Role Toggle */}
        <div className="hw-role-toggle">
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
        <div className="hw-mb-32" style={{ padding: '0 16px' }}>
            <p className="sub-para-text" style={{ fontWeight: 500, letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase' }}>WORKER HUB</p>
            <h1 className="big-text-head" style={{ fontWeight: 500, color: '#0F172A', letterSpacing: '-1.5px' }}>
                Hello, {profile?.first_name || 'Worker'}
            </h1>
        </div>

        {/* Active Gig or CTA */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          {activeGig ? (
            <ActiveTaskBanner 
              contract={activeGig} 
              role="worker"
              onClick={() => router.push(`/messages?contract=${activeGig.id}`)} 
            />
          ) : (
            <Card variant="elevated" padding="lg" className="hw-card-primary hw-text-center" style={{ borderRadius: '28px' }}>
              <div className="sub-para-text" style={{ textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Ready to Work</div>
              <h1 className="head-text">No Active Gigs</h1>
              <p className="para-text hw-mt-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
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
                <h3 className="sub-head-text" style={{ fontWeight: 500 }}>Explore All Nearby Gigs</h3>
                <p className="para-text hw-mt-2">Find more opportunities to increase your earnings.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="hw-section" style={{ padding: '0 16px' }}>
          <SummaryStats
            activeCount={stats.worker.active_gigs}
            acceptedCount={stats.worker.total_applications}
            pastWorksCount={stats.worker.past_works_count}
            onActiveClick={() => router.push('/worker/active-gigs')}
            onApplicationsClick={() => router.push('/worker/applications?tab=all')}
            onPortfolioClick={() => router.push('/worker/portfolio')}
          />
        </div>

        <div className="hw-section" style={{ padding: '0 16px' }}>
          <div className="hw-mb-16">
            <h2 className="head-text" style={{ fontWeight: 500, marginBottom: '4px' }}>Discover Your Next Gig</h2>
            <div className="hw-flex hw-justify-between hw-items-center">
              <p className="para-text" style={{ color: '#64748B' }}>Swipe cards to save or ignore</p>
              <Button 
                  variant="ghost" 
                  onClick={() => router.push('/worker/saved')}
                  className="hw-flex hw-items-center hw-gap-4"
                  style={{ color: 'var(--wh-blue-primary)', padding: 0, height: 'auto' }}
              >
                  <FiBookmark size={18} />
                  <span className="sub-para-text" style={{ fontWeight: 500, fontSize: '13px', textTransform: 'uppercase' }}>WISHLIST</span>
              </Button>
            </div>
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
