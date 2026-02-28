"use client";

import Link from 'next/link';
import '@/css/home.css';
import '@/css/auth.css';
import Snowfall from 'react-snowfall';

export default function Home() {
  return (
    <>
     <Snowfall
        radius={[5, 10]}
        color="#b7c3d2ff"
        speed={[0.5, 1.5]}
        wind={[-0.5, 0.5]}
        opacity={[0.3, 0.9]}
        snowflakeCount={100}
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />
    <main className="home-root">
      
      {/* Background orbs */}
      <div className="home-orb home-orb-1" />
      <div className="home-orb home-orb-2" />
      <div className="home-orb home-orb-3" />

      {/* Nav */}
     

      {/* Hero */}
     
      <section className="home-hero">

        <h1 className="home-heading">
          Find work.<br />
          Hire talent.<br />
          <span className="home-heading-accent">All in one place.</span>
        </h1>

        <p className="home-sub">
          HashWorks connects skilled workers with hirers across India.
          Post jobs, apply instantly, track every project — no middlemen, no hassle.
        </p>

        <div className="home-cta-row">

          <Link href="/signup" className="auth-submit-btn">
            Create a free account
          </Link>
        </div>

        <p className="home-hint">Already have an account? <Link href="/login" className="home-hint-link">Log in →</Link></p>
      </section>


      <footer className="home-footer">
        © {new Date().getFullYear()} HashWorks ·
      </footer>
    </main>
    </>
  );
}
