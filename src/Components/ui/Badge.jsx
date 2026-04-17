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
    urgent: { bg: "rgba(244, 63, 94, 0.12)", color: "#f43f5e" },
    active: { bg: "rgba(28, 77, 255, 0.12)", color: "#1c4dff" },
    success: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    completed: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    waiting: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
    neutral: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" },
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
