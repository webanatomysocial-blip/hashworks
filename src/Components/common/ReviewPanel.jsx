import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function ReviewPanel({ contractId, reviewerId, revieweeId, role, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return showToast("Please select a rating", "error");
        if (!comment.trim()) return showToast("Please provide a comment", "error");

        try {
            setSubmitting(true);
            const { error } = await supabase.from('reviews').insert([{
                contract_id: contractId,
                reviewer_id: reviewerId,
                reviewee_id: revieweeId,
                rating,
                comment: comment.trim(),
                reviewer_role: role
            }]);

            if (error) {
                if (error.code === '23505') throw new Error("You have already reviewed this project.");
                throw error;
            }

            showToast("Review submitted successfully!", "success");
            if (onSubmitted) onSubmitted();
        } catch (err) {
            console.error('Review Error:', err);
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="hw-card" style={{ marginTop: '24px', border: '1.5px solid var(--hw-surface-high)', borderRadius: '24px' }}>
            <h3 className="text-display-sm" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '16px' }}>Feedback & Rating</h3>
            <p className="text-body-md hw-mb-24" style={{ color: 'var(--hw-text-secondary)' }}>How was your experience working on this project?</p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
                    {[...Array(5)].map((_, i) => {
                        const starValue = i + 1;
                        return (
                            <button
                                key={starValue}
                                type="button"
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    padding: '4px',
                                    transition: 'transform 0.2s'
                                }}
                                onClick={() => setRating(starValue)}
                                onMouseEnter={() => setHover(starValue)}
                                onMouseLeave={() => setHover(0)}
                                className="hw-star-btn"
                            >
                                <FiStar 
                                    size={40} 
                                    fill={(hover || rating) >= starValue ? "var(--hw-primary)" : "none"}
                                    color={(hover || rating) >= starValue ? "var(--hw-primary)" : "#CBD5E1"}
                                    strokeWidth={2}
                                />
                            </button>
                        );
                    })}
                </div>

                <div className="hw-mb-24">
                    <label className="text-label-sm hw-mb-8" style={{ display: 'block' }}>Review Details</label>
                    <textarea 
                        className="hw-input"
                        rows={4}
                        placeholder="Describe your collaboration (e.g., communication, quality of work, professionalism)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        style={{ borderRadius: '16px', padding: '16px' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="hw-btn hw-btn-primary hw-w-full"
                    style={{ borderRadius: '100px', height: '52px' }}
                >
                    {submitting ? 'Submitting...' : 'Post Review'}
                </button>
            </form>
        </div>
    );
}
