"use client";

import React from "react";
import Link from "next/link";
import { FiShare2, FiShield } from "react-icons/fi";
import "@/css/worker.css";

export default function Footer() {
  return (
    <footer className="wh-footer">
      <div className="wh-footer-brand">
        <h2>Hashworks</h2>
        <p className="wh-footer-tagline">
          A trust-driven command center for the next generation of workforce. 
          Fast, secure, and kinetic.
        </p>
        
        <div className="wh-footer-socials">
          <div className="wh-social-icon">
            <FiShare2 size={20} />
          </div>
          <div className="wh-social-icon">
            <FiShield size={20} />
          </div>
        </div>
      </div>

      <div className="wh-footer-grid">
        <div className="wh-footer-col">
          <h4>Platform</h4>
          <ul className="wh-footer-links">
            <li><Link href="/worker/browse">Find Gigs</Link></li>
            <li><Link href="/hirer/postings">Post Task</Link></li>
            <li><Link href="/working-on-it">Rewards</Link></li>
          </ul>
        </div>

        <div className="wh-footer-col">
          <h4>Trust</h4>
          <ul className="wh-footer-links">
            <li><Link href="/working-on-it">Safety Center</Link></li>
            <li><Link href="/working-on-it">Verification</Link></li>
            <li><Link href="/working-on-it">Dispute Res.</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
