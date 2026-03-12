'use client';

import { FiX } from 'react-icons/fi';
import ChatView from './ChatView';

export default function ChatModal({ isOpen, onClose, contractId, currentUserId, otherUserName }) {
    if (!isOpen) return null;

    return (
        <div className="chat-overlay" onClick={onClose}>
            <div className="chat-container" onClick={(e) => e.stopPropagation()}>
                <header className="chat-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            {otherUserName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className="chat-user-name">{otherUserName || 'Chat'}</h3>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </header>

                <div className="chat-modal-content">
                    <ChatView 
                        contractId={contractId}
                        currentUserId={currentUserId}
                        otherUserName={otherUserName}
                        showHeader={false}
                    />
                </div>
            </div>

            <style jsx>{`
                .chat-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }
                .chat-container {
                    width: 100%;
                    max-width: 500px;
                    height: 80vh;
                    background: #fff;
                    border-radius: 24px 24px 0 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 -10px 25px rgba(0,0,0,0.1);
                }
                @media (min-width: 768px) {
                    .chat-overlay {
                        align-items: center;
                    }
                    .chat-container {
                        border-radius: 24px;
                        height: 600px;
                    }
                }
                .chat-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .chat-user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .chat-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }
                .chat-user-name {
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }
                .chat-status {
                    font-size: 11px;
                    color: #10b981;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .chat-status::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: currentColor;
                    border-radius: 50%;
                }
                .chat-close-btn {
                    background: #f8fafc;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .chat-close-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                .chat-modal-content {
                    flex: 1;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
