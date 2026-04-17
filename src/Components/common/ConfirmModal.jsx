'use client';

import { useState } from 'react';
import HashLoader from './HashLoader';
import '@/css/dashboard.css';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    variant = 'destructive'
}) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 400);
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isClosing ? 'closing' : ''}`}>
            <div className={`modal-container confirm-modal ${isClosing ? 'closing' : ''}`}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close-btn" onClick={handleClose} disabled={loading}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="confirm-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button
                        className="confirm-cancel-btn"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-action-btn ${variant}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? <HashLoader text="" /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
