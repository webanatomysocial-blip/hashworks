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
    style = {} 
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--color-border)',
            ...style
        }}>
            {icon && (
                <div style={{ 
                    marginBottom: '16px', 
                    color: 'var(--color-text-muted)',
                    opacity: 0.5
                }}>
                    {icon}
                </div>
            )}
            <h3 className="text-title-md" style={{ marginBottom: '8px', color: 'var(--color-text-main)' }}>
                {title}
            </h3>
            {description && (
                <p className="text-body-md" style={{ color: 'var(--color-text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                    {description}
                </p>
            )}
            {action && (
                <div style={{ marginTop: '24px' }}>
                    {action}
                </div>
            )}
        </div>
    );
};
