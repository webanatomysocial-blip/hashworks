"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/Components/DashboardHeader.jsx";
import DashboardMobileNav from "@/Components/DashboardMobileNav.jsx";
import "@/css/dashboard.css";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  const isHirer = pathname?.includes("/hirer");
  const role = isHirer ? "hirer" : "worker";

  useEffect(() => {
    const checkAndSyncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // 1. Fetch current profile
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching profile:", fetchError);
        }

        // 2. Sync names if missing but present in auth metadata
        const meta = user.user_metadata;
        const needsFirstName = !profile?.first_name && meta?.first_name;
        const needsLastName = !profile?.last_name && meta?.last_name;

        if (needsFirstName || needsLastName) {
          console.log("Syncing profile names from auth metadata...");
          await supabase
            .from("profiles")
            .update({
              first_name: profile?.first_name || meta.first_name,
              last_name: profile?.last_name || meta.last_name,
            })
            .eq("id", user.id);
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAndSyncUser();
  }, [router]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      <main className="dashboard-main">{children}</main>
      <DashboardMobileNav
        onAddClick={() => router.push("/hirer/postings/create")}
        role={role}
      />
    </div>
  );
}
