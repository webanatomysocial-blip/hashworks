'use client';

import React from 'react';
import { useToast } from '@/context/ToastContext';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none',
            width: '100%', // ensure center alignment works correctly
            maxWidth: '450px'
        }}>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const { message, type } = toast;

    const styles = {
        success: {
            icon: <FiCheckCircle size={20} />,
            color: 'var(--hw-success)',
            bg: 'rgba(34, 197, 94, 0.1)'
        },
        error: {
            icon: <FiAlertCircle size={20} />,
            color: 'var(--hw-error)',
            bg: 'rgba(239, 68, 68, 0.1)'
        },
        warning: {
            icon: <FiAlertCircle size={20} />,
            color: 'var(--hw-warning)',
            bg: 'rgba(245, 158, 11, 0.1)'
        },
        info: {
            icon: <FiInfo size={20} />,
            color: 'var(--hw-primary)',
            bg: 'rgba(28, 77, 255, 0.1)'
        }
    };

    const currentStyle = styles[type] || styles.info;

    return (
        <div style={{
            pointerEvents: 'auto',
            width: 'fit-content',
            minWidth: '320px',
            maxWidth: '100%',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${currentStyle.bg.replace('0.1', '0.2')}`,
            borderRadius: '22px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            animation: 'toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <div style={{ color: currentStyle.color, display: 'flex', flexShrink: 0 }}>
                {currentStyle.icon}
            </div>
            
            <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--hw-text-primary)',
                lineHeight: '1.4',
                flex: 1
            }}>
                {message}
            </p>

            <button 
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--hw-text-secondary)',
                    opacity: 0.6,
                    display: 'flex',
                    flexShrink: 0
                }}
            >
                <FiX size={16} />
            </button>

            <style jsx>{`
                @keyframes toast-enter {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default ToastContainer;
