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
                            <div className="chat-status-active">Active Project</div>
                        </div>
                    </div>
                    <button className="chat-close-btn" onClick={onClose} title="Close chat">
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
                    background: rgba(15, 23, 42, 0.4);
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    z-index: 2000;
                    backdrop-filter: blur(8px);
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .chat-container {
                    width: 100%;
                    max-width: 550px;
                    height: 85vh;
                    background: #fff;
                    border-radius: 32px 32px 0 0;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 -20px 50px rgba(15, 23, 42, 0.15);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @media (min-width: 768px) {
                    .chat-overlay {
                        align-items: center;
                    }
                    .chat-container {
                        border-radius: 24px;
                        height: 700px;
                        margin: 20px;
                    }
                }
                .chat-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #fff;
                }
                .chat-user-info {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .chat-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 16px;
                }
                .chat-user-name {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }
                .chat-status-active {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .chat-status-active::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                }
                .chat-close-btn {
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .chat-close-btn:hover {
                    background: #ef4444;
                    color: #fff;
                    border-color: #ef4444;
                    transform: rotate(90deg);
                }
                .chat-modal-content {
                    flex: 1;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
