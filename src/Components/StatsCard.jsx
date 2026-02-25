'use client';

export default function StatsCard({ label, value }) {
    return (
        <div className="stats-card">
            <p className="stats-label">{label}</p>
            <h3 className="stats-value">{value}</h3>
        </div>
    );
}
