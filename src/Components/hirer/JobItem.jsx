'use client';

export default function JobItem({ job, onEdit, onDelete }) {
    const formattedDate = new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="item-card">
            <h4 className="item-title">{job.title}</h4>
            <p className="item-meta">
                {job.budget ? `₹${job.budget} • ` : ''}
                <span className={`status-badge ${job.status}`}>{job.status}</span>
                <span className="item-timestamp">{formattedDate}</span>
            </p>
            <div className="item-actions">
                <button className="action-btn" onClick={() => onEdit(job)} title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button className="action-btn delete" onClick={() => onDelete(job.id)} title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}
