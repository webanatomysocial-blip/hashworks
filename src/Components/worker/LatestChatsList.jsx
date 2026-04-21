"use client";

import React from "react";
import { FiArrowRight } from "react-icons/fi";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function LatestChatsList({ chats = [], onViewAll, onChatClick }) {
  if (!chats.length) return null;

  return (
    <div>
      {/* Section Header */}
      <div className="hw-flex hw-justify-between hw-items-center hw-mb-12">
        <h2 className="text-headline-lg">Latest Chats</h2>
        <button
          className="hw-btn hw-btn-ghost hw-btn-sm"
          onClick={onViewAll}
        >
          View All <FiArrowRight size={13} />
        </button>
      </div>

      {/* Chat Rows */}
      <div className="hw-flex hw-flex-col hw-gap-16">
        {chats.map((chat) => {
          const person = chat.otherPerson;
          const initials = person
            ? `${person.first_name?.[0] || ''}${person.last_name?.[0] || ''}`
            : '?';
          const displayName = person
            ? `${person.first_name || ''} ${person.last_name || ''}`.trim()
            : 'Unknown';

          return (
            <div
              key={chat.id}
              className="hw-chat-row"
              onClick={() => onChatClick(chat.contract?.id)}
            >
              {/* Avatar */}
              <div 
                className="hw-chat-avatar" 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  flexShrink: 0, 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  background: 'var(--hw-surface-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {person?.avatar_url
                  ? <img src={person.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--hw-primary)' }}>{initials}</span>
                }
              </div>

              {/* Info */}
              <div className="hw-flex-1" style={{ minWidth: 0 }}>
                <div className="hw-flex hw-justify-between hw-items-center">
                  <span className="text-title-md" style={{ fontSize: '15px' }}>{displayName}</span>
                  <span className="text-label-sm hw-font-reset" style={{ flexShrink: 0, marginLeft: '8px', color: 'var(--hw-icon-default)' }}>
                    {timeAgo(chat.created_at)}
                  </span>
                </div>
                <p className="text-body-md hw-line-clamp-1 hw-mt-2" style={{ fontSize: '13px' }}>
                  {chat.content}
                </p>
              </div>

              {/* Unread dot */}
              {!chat.is_read && <div className="hw-chat-unread-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
