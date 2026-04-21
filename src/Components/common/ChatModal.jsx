'use client';

import { FiX } from 'react-icons/fi';
import ChatView from './ChatView';

export default function ChatModal({ isOpen, onClose, contractId, currentUserId, otherUserName }) {
    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay" onClick={onClose}>
            <div className="chat-modal-container" onClick={(e) => e.stopPropagation()}>
                <header className="chat-modal-header">
                    <div className="chat-modal-user-info">
                        <div className="chat-modal-avatar">
                            {otherUserName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className="chat-modal-user-name">{otherUserName || 'Chat'}</h3>
                            <div className="chat-modal-status">Active Project</div>
                        </div>
                    </div>
                    <button className="chat-modal-close-btn" onClick={onClose} title="Close chat">
                        <FiX size={20} />
                    </button>
                </header>

                <div className="chat-modal-body">
                    <ChatView 
                        contractId={contractId}
                        currentUserId={currentUserId}
                        otherUserName={otherUserName}
                        showHeader={false}
                    />
                </div>
            </div>
        </div>
    );
}
