"use client";

import React from "react";

export function Card({ 
  children, 
  variant = "elevated", // elevated, flat, border, glass
  className = "",
  padding = "lg", // sm, md, lg, xl
  ...props 
}) {
  const paddings = {
    sm: "var(--hw-space-8)",
    md: "var(--hw-space-16)",
    lg: "var(--hw-space-24)",
    xl: "var(--hw-space-32)"
  };

  const getVariantStyles = () => {
    switch(variant) {
      case 'glass': return 'hw-card-glass';
      default: return 'hw-card'; 
    }
  };

  return (
    <div
      className={`${getVariantStyles()} ${className}`}
      style={{
        padding: paddings[padding] || paddings.lg,
        boxShadow: variant === 'flat' ? 'none' : undefined,
        border: variant === 'border' ? '1.5px solid var(--hw-surface-high)' : 'none',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, subtext, icon, variant = "primary" }) {
    const accentColor = variant === "primary" ? "var(--hw-primary)" : "var(--hw-secondary)";
    
    return (
        <Card variant="elevated" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hw-space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="text-label-sm">{label}</span>
                {icon && <div style={{ color: accentColor }}>{icon}</div>}
            </div>
            <div className="text-display-xl">{value}</div>
            {subtext && <div className="text-body-md">{subtext}</div>}
        </Card>
    );
}
