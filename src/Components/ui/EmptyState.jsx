import React from 'react';

/**
 * EmptyState Component
 * Used for displaying placeholders when lists are empty.
 */
export const EmptyState = ({ 
    title, 
    description, 
    icon, 
    action,
    actionLabel,
    onAction,
    style = {} 
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.02)',
            ...style
        }}>
            {icon && (
                <div style={{ 
                    margin: '0 auto 16px', 
                    background: '#f1f5f9', 
                    color: '#64748B', 
                    borderRadius: '16px', 
                    width: '48px', 
                    height: '48px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    {React.cloneElement(icon, { size: icon.props.size || 24 })}
                </div>
            )}
            <h3 style={{ marginBottom: '8px', color: '#0F172A', fontWeight: 600, fontSize: '18px' }}>
                {title}
            </h3>
            {description && (
                <p style={{ color: '#64748B', maxWidth: '300px', margin: '0 auto', fontSize: '14px' }}>
                    {description}
                </p>
            )}
            {(action || actionLabel) && (
                <div style={{ marginTop: '24px' }}>
                    {action || (
                        <button 
                            className="hw-btn hw-btn-primary" 
                            onClick={onAction}
                            style={{ borderRadius: '16px', fontSize: '14px', height: '42px', padding: '0 24px' }}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
