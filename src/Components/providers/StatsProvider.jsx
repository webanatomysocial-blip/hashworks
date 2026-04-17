"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const [stats, setStats] = useState({
    worker: {
      active_gigs: 0,
      total_applications: 0,
      active_contracts: 0,
    },
    hirer: {
      total_postings: 0,
      active_jobs: 0,
      pending_applications: 0,
      active_contracts: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("StatsProvider: Error fetching stats:", error);
      } else if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error("StatsProvider: Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // ── Setup Realtime Subscription ──
    const channel = supabase
      .channel("stats_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return (
    <StatsContext.Provider value={{ stats, loading, refreshStats: fetchStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
}
