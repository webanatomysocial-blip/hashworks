import React from 'react';

/**
 * PageContainer Component
 * Centered responsive container for all dashboard pages.
 * Mobile: 20px horizontal padding. Desktop: 100px horizontal padding.
 */
export const PageContainer = ({ children, size = 'lg', style = {} }) => {
    const maxWidths = {
        sm: '800px',
        md: '1000px',
        lg: '1200px',
        full: '100%'
    };

    return (
        <div className="hw-page-container" style={{
            maxWidth: maxWidths[size] || maxWidths.lg,
            ...style
        }}>
            {children}
        </div>
    );
};
