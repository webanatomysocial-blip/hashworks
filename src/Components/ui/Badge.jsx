"use client";

import React from "react";

export function Badge({ 
  children, 
  variant = "active", 
  className = "",
  showDot = false,
  style: propsStyle = {},
  ...props 
}) {
  const variants = {
    urgent: { bg: "rgba(255, 106, 61, 0.12)", color: "#FF6A3D" },
    active: { bg: "rgba(28, 77, 255, 0.12)", color: "#1C4DFF" },
    success: { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E" },
    completed: { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E" },
    waiting: { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" },
    neutral: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
    closed: { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444" },
    draft: { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8" },
    in_progress: { bg: "rgba(28, 77, 255, 0.12)", color: "#1C4DFF" },
  };

  const v = variants[variant] || variants.neutral;

  const baseStyle = {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "none", // Forced removal of uppercase
    letterSpacing: "0.02em",
    lineHeight: "1.2",
    backgroundColor: propsStyle.backgroundColor || v.bg,
    color: propsStyle.color || v.color,
    width: "fit-content",
    height: "fit-content",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    ...propsStyle,
    borderRadius: "20px", 
    padding: "5px 12px",
  };

  // Helper to format text
  const formatText = (text) => {
    if (typeof text !== 'string') return text;
    if (text === text.toUpperCase() && text.includes('_')) {
        return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }
    return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span className={`hw-badge-core ${className}`} style={baseStyle} {...props}>
      {showDot && (
        <span style={{
          display: "inline-block",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: baseStyle.color,
          marginRight: "6px",
          verticalAlign: "middle"
        }} />
      )}
      {formatText(children)}
    </span>
  );
}
