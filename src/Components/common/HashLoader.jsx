"use client";

import React from "react";
import "@/css/worker.css";

export default function HashLoader({ text = "", inline = false }) {
  const content = (
    <div className={`wh-hash-loader-container ${inline ? 'inline' : ''}`}>
      <div className="wh-hash-loader">
        {/* Horizontal lines */}
        <div className="wh-hash-bar h h-1"></div>
        <div className="wh-hash-bar h h-2"></div>
        {/* Vertical lines */}
        <div className="wh-hash-bar v v-1"></div>
        <div className="wh-hash-bar v v-2"></div>
      </div>
      {text && <div className="wh-loader-text">{text}</div>}
    </div>
  );

  if (inline) return content;

  return (
    <div className="wh-loader-overlay">
      {content}
    </div>
  );
}
