'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/lib/chat';

export default function ChatView({ contractId, currentUserId, otherUserName, showHeader = false, onClose = null }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!contractId || !currentUserId) return;

        async function initChat() {
            setLoading(true);
            try {
                const history = await getMessages(contractId);
                setMessages(history);
                await markMessagesAsRead(contractId, currentUserId);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoading(false);
            }
        }

        initChat();

        const subscription = subscribeToMessages(contractId, (msg) => {
            setMessages((prev) => {
                // Prevent duplicate messages if already present
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            if (msg.sender_id !== currentUserId) {
                markMessagesAsRead(contractId, currentUserId);
            }
        });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [contractId, currentUserId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !contractId || !currentUserId) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            const sentMsg = await sendMessage(contractId, currentUserId, content);
            // Optimistically add to list if subscription is slow, 
            // but the subscription check in useEffect handles duplicates
            setMessages(prev => {
                if (prev.some(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message.');
        }
    };

    if (!contractId) {
        return (
            <div className="chat-empty-state">
                <FiMessageSquare size={48} />
                <h3>Select a conversation to start chatting</h3>
            </div>
        );
    }

    return (
        <div className="chat-view-container">
            {showHeader && (
                <header className="chat-view-header">
                    <div className="chat-user-info">
                        <div className="chat-avatar">
                            {otherUserName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h3 className="chat-user-name">{otherUserName || 'Chat'}</h3>
                        </div>
                    </div>
                </header>
            )}

            <div className="chat-messages" ref={scrollRef}>
                {loading ? (
                    <div className="chat-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="chat-empty">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-bubble-wrap ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                        >
                            <div className="chat-bubble">
                                {msg.content}
                                <span className="chat-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    autoFocus
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    <FiSend size={18} />
                </button>
            </form>

            <style jsx>{`
                .chat-view-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #fff;
                    position: relative;
                }
                .chat-view-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .chat-user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .chat-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                }
                .chat-user-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }
                .chat-status {
                    font-size: 10px;
                    color: #10b981;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .chat-status::before {
                    content: '';
                    width: 5px;
                    height: 5px;
                    background: currentColor;
                    border-radius: 50%;
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #f8fafc;
                }
                .chat-bubble-wrap {
                    display: flex;
                    width: 100%;
                }
                .chat-bubble-wrap.sent {
                    justify-content: flex-end;
                }
                .chat-bubble-wrap.received {
                    justify-content: flex-start;
                }
                .chat-bubble {
                    max-width: 85%;
                    padding: 10px 14px;
                    border-radius: 16px;
                    font-size: 14px;
                    line-height: 1.5;
                    position: relative;
                }
                .sent .chat-bubble {
                    background: #0f172a;
                    color: #fff;
                    border-bottom-right-radius: 4px;
                }
                .received .chat-bubble {
                    background: #fff;
                    color: #0f172a;
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .chat-time {
                    display: block;
                    font-size: 9px;
                    margin-top: 4px;
                    opacity: 0.7;
                    text-align: right;
                }
                .chat-input-area {
                    padding: 16px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    gap: 10px;
                }
                .chat-input-area input {
                    flex: 1;
                    padding: 10px 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    font-size: 14px;
                }
                .chat-input-area button {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: #0f172a;
                    color: #fff;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .chat-empty-state {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    gap: 16px;
                }
                .chat-loading, .chat-empty {
                    text-align: center;
                    padding: 40px;
                    color: #94a3b8;
                    font-size: 13px;
                }
            `}</style>
        </div>
    );
}
