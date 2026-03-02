"use client";

export default function WorkingOnIt() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ marginBottom: "16px" }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#1e293b",
          marginBottom: "8px",
        }}
      >
        Working on it
      </h1>
      <p style={{ color: "#64748b", fontSize: "15px" }}>
        This page is currently under construction.{" "}
      </p>
      <button
        onClick={() => window.history.back()}
        style={{
          marginTop: "24px",
          color: "#3b82f6",
          textDecoration: "none",
          fontWeight: "600",
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  );
}
