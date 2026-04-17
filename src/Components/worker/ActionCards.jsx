"use client";

import React from "react";
import { FiSearch, FiCheckCircle, FiBriefcase, FiEdit3 } from "react-icons/fi";
import { Badge } from "../ui/Badge";

export default function ActionCards({ onFindWork, onPostTask, nearbyCount }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
      <div className="wh-action-card" onClick={onFindWork}>
        <FiBriefcase className="wh-ac-bg-icon" />
        <div className="wh-ac-content">
          <div className="wh-ac-header">
            <div className="wh-ac-icon-wrap blue">
              <FiSearch size={24} />
            </div>
            <Badge variant="active">Available Now</Badge>
          </div>
          <h3 className="wh-ac-title">Find Work</h3>
          <p className="wh-ac-sub">Browse {nearbyCount || 120} nearby gigs</p>
        </div>
      </div>

      <div className="wh-action-card" onClick={onPostTask}>
        <FiEdit3 className="wh-ac-bg-icon" />
        <div className="wh-ac-content">
          <div className="wh-ac-header">
            <div className="wh-ac-icon-wrap green">
              <FiCheckCircle size={24} />
            </div>
            <Badge variant="success">Instant Post</Badge>
          </div>
          <h3 className="wh-ac-title">Post a Task</h3>
          <p className="wh-ac-sub">Get help in minutes</p>
        </div>
      </div>
    </div>
  );
}
