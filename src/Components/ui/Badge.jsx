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
    urgent: { bg: "rgba(255, 106, 61, 0.12)", color: "#FF6A3D" }, // Using --hw-urgent
    active: { bg: "rgba(28, 77, 255, 0.12)", color: "#1C4DFF" }, // Using --hw-primary
    success: { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E" }, // Using --hw-success
    completed: { bg: "rgba(34, 197, 94, 0.12)", color: "#22C55E" },
    waiting: { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" }, // Using --hw-warning
    neutral: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
    closed: { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444" }, // Using --hw-error
    draft: { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8" },
    in_progress: { bg: "rgba(28, 77, 255, 0.12)", color: "#1C4DFF" },
  };

  const v = variants[variant] || variants.neutral;

  const baseStyle = {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "10.5px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    lineHeight: "1.2",
    backgroundColor: propsStyle.backgroundColor || v.bg,
    color: propsStyle.color || v.color,
    width: "fit-content",
    height: "fit-content",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    ...propsStyle,
    // Final overrides to ensure its rounded and padded
    borderRadius: "20px", 
    padding: "5px 12px",
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
      {children}
    </span>
  );
}
