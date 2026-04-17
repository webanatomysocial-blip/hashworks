"use client";

import React from "react";

export function Input({ 
  label, 
  error, 
  className = "", 
  type = "text",
  ...props 
}) {
  return (
    <div className={`wh-ui-input-wrapper ${className}`} style={{ marginBottom: "var(--space-md)", width: "100%" }}>
      {label && (
        <label style={{ 
          display: "block", 
          marginBottom: "var(--space-xs)", 
          fontSize: "13px", 
          fontWeight: "600",
          color: "var(--color-text-sub)"
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        style={{
          width: "100%",
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-md)",
          border: error ? "1.5px solid var(--color-error)" : "1.5px solid var(--color-border)",
          backgroundColor: "var(--color-border-light)",
          color: "var(--color-text-main)",
          fontSize: "14px",
          transition: "all 0.2s ease",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.border = "1.5px solid var(--color-primary)";
          e.target.style.backgroundColor = "var(--color-surface)";
          e.target.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.border = error ? "1.5px solid var(--color-error)" : "1.5px solid var(--color-border)";
          e.target.style.backgroundColor = "var(--color-border-light)";
          e.target.style.boxShadow = "none";
        }}
        {...props}
      />
      {error && (
        <p style={{ marginTop: "var(--space-xs)", fontSize: "12px", color: "var(--color-error)", fontWeight: "500" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, error, className = "", ...props }) {
    return (
      <div className={`wh-ui-input-wrapper ${className}`} style={{ marginBottom: "var(--space-md)", width: "100%" }}>
        {label && (
          <label style={{ display: "block", marginBottom: "var(--space-xs)", fontSize: "13px", fontWeight: "600", color: "var(--color-text-sub)" }}>
            {label}
          </label>
        )}
        <textarea
          style={{
            width: "100%",
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-md)",
            border: error ? "1.5px solid var(--color-error)" : "1.5px solid var(--color-border)",
            backgroundColor: "var(--color-border-light)",
            color: "var(--color-text-main)",
            fontSize: "14px",
            minHeight: "100px",
            transition: "all 0.2s ease",
            outline: "none",
            resize: "vertical"
          }}
          onFocus={(e) => {
            e.target.style.border = "1.5px solid var(--color-primary)";
            e.target.style.backgroundColor = "var(--color-surface)";
            e.target.style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.border = error ? "1.5px solid var(--color-error)" : "1.5px solid var(--color-border)";
            e.target.style.backgroundColor = "var(--color-border-light)";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        />
        {error && <p style={{ marginTop: "var(--space-xs)", fontSize: "12px", color: "var(--color-error)", fontWeight: "500" }}>{error}</p>}
      </div>
    );
  }
