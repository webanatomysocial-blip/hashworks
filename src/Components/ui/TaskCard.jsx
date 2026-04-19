import React from 'react';
import { Card } from '@/Components/ui/Card';
import { FiBriefcase } from 'react-icons/fi';
import { Badge } from '@/Components/ui/Badge';

/**
 * TaskCard
 * A unified, premium card component used across the application to present jobs/tasks consistently.
 *
 * @param {Object} props
 * @param {string} props.topTitleLabel - Small uppercase label above the title (e.g. "TASK TITLE")
 * @param {string} props.title - Main large title of the card
 * @param {string} props.thumbnailUrl - URL to thumbnail image
 * @param {React.ReactNode} props.thumbnailFallbackIcon - Icon component if no image (default: FiBriefcase)
 * @param {Object} props.badge - Top right badge config { text: 'PREVIEW', bg: '#FFF', color: '#1C4DFF', variant: 'active' }
 * @param {Array} props.metrics - Up to 3 metric objects { label: 'BUDGET', value: '₹250', valueColor: '#1C4DFF' }
 * @param {Object} props.footerMessage - Optional bottom message { icon: <FiCheck/>, text: 'Safety message...', color: '#22C55E' }
 * @param {React.ReactNode} props.actionButtons - Optional button row (buttons go here)
 * @param {string} props.cardWidth - Default '100%'. Can be fixed for horizontal scrolling lists.
 * @param {React.CSSProperties} props.style - Additional card styles
 * @param {function} props.onClick - Optional click handler for the card itself
 */
export function TaskCard({
    topTitleLabel = 'TASK',
    title = 'Untitled',
    thumbnailUrl = null,
    thumbnailFallbackIcon = <FiBriefcase size={28} color="#64748B" />,
    badge = null,
    metrics = [],
    footerMessage = null,
    actionButtons = null,
    cardWidth = '100%',
    style = {},
    onClick = undefined
}) {
    // Fill up to 3 metrics just in case less are passed, to keep grid balanced if needed.
    // Though usually it's better to just render what's there.
    
    return (
        <div 
            style={{ 
                background: '#FFFFFF', 
                borderRadius: '24px', 
                border: '1px solid var(--hw-surface-high)', 
                padding: '24px', // lg padding equivalent
                width: cardWidth,
                boxSizing: 'border-box',
                cursor: onClick ? 'pointer' : 'default',
                ...style 
            }}
            onClick={onClick}
        >
            {/* Top Row: Thumbnail + Title + Badge */}
            <div className="hw-flex hw-justify-between hw-items-start hw-mb-20">
                <div className="hw-flex hw-gap-16">
                    {thumbnailUrl ? (
                        <img 
                            src={thumbnailUrl} 
                            alt="Task" 
                            style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', objectFit: 'cover' }} 
                        />
                    ) : (
                        <div style={{ flexShrink: 0, width: '60px', height: '60px', borderRadius: '16px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {thumbnailFallbackIcon}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ fontSize: '10px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                            {topTitleLabel}
                        </p>
                        <p style={{ fontWeight: 800, fontSize: '17px', color: '#1E293B', lineHeight: '1.2' }}>
                            {title}
                        </p>
                    </div>
                </div>

                {/* Optional Top Right Badge */}
                {badge && (
                    <Badge 
                        variant={badge.variant || (badge.text?.toLowerCase() === 'active' ? 'success' : 'active')}
                        style={{ 
                            backgroundColor: badge.bg, 
                            color: badge.color,
                            flexShrink: 0,
                            marginLeft: '12px'
                        }}
                    >
                        {badge.text}
                    </Badge>
                )}
            </div>

            {/* Metrics Grid */}
            {metrics && metrics.length > 0 && (
                <div 
                    className={`hw-grid-${Math.min(metrics.length, 3)} hw-gap-8`}
                    style={{ 
                        padding: '16px 0', 
                        marginBottom: (footerMessage || actionButtons) ? '12px' : '0' 
                    }} 
                >
                    {metrics.map((metric, idx) => (
                        <div key={idx} style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '10px', color: '#1E293B', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>
                                {metric.label}
                            </p>
                            <p style={{ fontWeight: 800, fontSize: metric.valueSize || '14px', color: metric.valueColor || '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {metric.value}
                            </p>
                            {metric.subValue && (
                                <p style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                                    {metric.subValue}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer Message */}
            {footerMessage && (
                <div className={`hw-flex hw-gap-8 hw-items-center ${actionButtons ? 'hw-mb-16' : ''}`}>
                    <div style={{ background: footerMessage.color || '#22C55E', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {footerMessage.icon}
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: footerMessage.color || '#22C55E' }}>
                        {footerMessage.text}
                    </p>
                </div>
            )}

            {/* Action Buttons Row */}
            {actionButtons && (
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    {actionButtons}
                </div>
            )}
        </div>
    );
}

export default TaskCard;
