import Link from 'next/link';
import '@/css/home.css';
import '@/css/auth.css';

export default function Home() {
  return (
    <main className="home-root">
      {/* Background orbs */}
      <div className="home-orb home-orb-1" />
      <div className="home-orb home-orb-2" />
      <div className="home-orb home-orb-3" />

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-logo">#hashworks</div>
        {/* <div className="home-nav-links">
          <Link href="/login" className="home-nav-login">Log in</Link>
          <Link href="/signup" className="home-nav-signup">Sign up →</Link>
        </div> */}
      </nav>

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
  );
}
