'use client';

export default function ApplicationItem({ application }) {
    const formattedDate = new Date(application.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="item-card">
            <div className="item-header">
                <h4 className="item-title">{application.profiles?.full_name}</h4>
                <span className={`status-badge ${application.status}`}>{application.status}</span>
            </div>
            <p className="item-meta">Applied for: {application.jobs?.title}</p>
            {application.proposed_budget && (
                <p className="item-price">Proposed: ₹{application.proposed_budget}</p>
            )}
            <span className="item-timestamp">{formattedDate}</span>
        </div>
    );
}
