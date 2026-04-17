"use client";

import "@/css/worker.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiCompass, FiClipboard, FiPlus, FiSearch } from "react-icons/fi";
import { MdMessage } from "react-icons/md";
import { AiFillHome } from "react-icons/ai";

export default function DashboardMobileNav({ onAddClick, role }) {
  const pathname = usePathname();
  const isHirer = role === "hirer";

  // Define tabs exactly as in image
  // Define tabs based on role
  const tabs = isHirer ? [
    { label: "HOME", icon: <AiFillHome />, path: "/hirer" },
    { label: "TASKS", icon: <FiClipboard />, path: "/hirer/postings" },
    { label: "POST", icon: <FiPlus />, action: onAddClick },
    { label: "INBOX", icon: <MdMessage />, path: "/messages" },
  ] : [
    { label: "HOME", icon: <AiFillHome />, path: "/worker" },
    { label: "TASKS", icon: <FiClipboard />, path: "/worker/active-gigs" },
    { label: "SEARCH", icon: <FiSearch />, path: "/worker/browse" },
    { label: "INBOX", icon: <MdMessage />, path: "/messages" },
  ];

  return (
    <nav className="wh-mobile-nav">
      {tabs.map((tab, idx) => {
        const isActive = tab.path && (
          pathname === tab.path || 
          (tab.path !== "/" && pathname.startsWith(tab.path))
        );

        if (tab.action) {
          return (
            <div key={idx} className="wh-nav-item" onClick={tab.action}>
              <div className="wh-nav-icon-wrap">
                {tab.icon}
              </div>
              <span>{tab.label}</span>
            </div>
          );
        }

        return (
          <Link key={idx} href={tab.path} className={`wh-nav-item ${isActive ? 'active' : ''}`}>
            <div className="wh-nav-icon-wrap">
              {tab.icon}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
