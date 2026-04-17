"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiMapPin, FiLogOut, FiChevronDown } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import LocationModal from "@/Components/common/LocationModal";
import { formatLocationShort } from "@/lib/location";
import "@/css/dashboard.css";
import "@/css/worker.css";

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data);
      }
    }
    getProfile();
  }, []);

  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : '??';

  // subcity is stored as "Neighbourhood, Suburb" (e.g. "HITEC City, Madhapur")
  // city is stored as the main city (e.g. "Hyderabad")
  // Split subcity back into parts to use the shared formatter
  const subcityParts = profile?.subcity?.split(',').map(s => s.trim()) || [];
  const neighbourhood = subcityParts[0] || '';
  const suburb = subcityParts[1] || '';
  const subcityPart = neighbourhood || suburb || '';
  const mainLocationPart = subcityPart || profile?.city || "Detect Location";
  const contextLocationPart = subcityPart ? profile?.city : "";

  const profilePath = pathname.startsWith('/hirer') ? '/hirer/profile' : '/worker/profile';

  return (
    <header className="wh-header">
      {/* Top Layer: Centered Logo */}
      <div className="wh-header-top">
        <Link href={pathname.startsWith('/hirer') ? '/hirer' : '/worker'} style={{ textDecoration: 'none' }}>
           <h2 className="wh-brand-logo">Hashworks</h2>
        </Link>
      </div>

      {/* Bottom Layer: Location & Profile */}
      <div className="wh-header-bottom">
        <div className="wh-location-new" onClick={() => setIsLocModalOpen(true)}>
          <div className="wh-loc-pin">
            <FiMapPin size={22} />
          </div>
          <div className="wh-loc-details">
            <div className="wh-loc-primary">
              {mainLocationPart} <FiChevronDown size={14} style={{ marginLeft: '4px' }} />
            </div>
            {contextLocationPart && <div className="wh-loc-secondary">{contextLocationPart}</div>}
          </div>
        </div>

        <div className="wh-header-right">
          <Link href={profilePath} className="wh-header-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" />
            ) : (
              <span>{initials}</span>
            )}
          </Link>
        </div>
      </div>

      <LocationModal 
        isOpen={isLocModalOpen} 
        onClose={() => setIsLocModalOpen(false)} 
        onLocationUpdate={(newLoc) => setProfile(prev => ({ ...prev, city: newLoc.city, subcity: newLoc.subcity }))}
      />
    </header>
  );
}
