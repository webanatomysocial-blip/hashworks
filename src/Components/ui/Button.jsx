"use client";

import React from "react";

export function Button({ 
  children, 
  variant = "primary", // primary, secondary, ghost
  className = "", 
  disabled = false,
  onClick,
  type = "button",
  ...props 
}) {
  const btnClass = `hw-btn hw-btn-${variant} ${className}`;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={btnClass}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      {...props}
    >
      {children}
    </button>
  );
}
