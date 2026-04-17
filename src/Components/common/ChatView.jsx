'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare, FiClock, FiPlus, FiChevronLeft, FiBell, FiMoreVertical } from 'react-icons/fi';
import { HiOutlineWrench } from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import { getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/lib/chat';
import HashLoader from './HashLoader';

export default function ChatView({ contractId, currentUserId, otherUserName, showHeader = true, onClose = null, jobTitle = '', status = '', budget = 0, otherPartyAvatar = null, onBack = null }) {
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
            setMessages(prev => {
                if (prev.some(m => m.id === sentMsg.id)) return prev;
                return [...prev, sentMsg];
            });
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isDifferentDay = (idx) => {
        if (idx === 0) return true;
        const prevMsg = messages[idx - 1];
        const currMsg = messages[idx];
        const d1 = new Date(prevMsg.created_at).toDateString();
        const d2 = new Date(currMsg.created_at).toDateString();
        return d1 !== d2;
    };

    const getDateLabel = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    if (!contractId) {
        return (
            <div className="chat-empty-state">
                <div className="empty-icon-pulse">
                    <FiMessageSquare size={54} />
                </div>
                <h3>Start a Conversation</h3>
                <p>Choose an active contract to begin chatting.</p>
            </div>
        );
    }

    return (
        <div className="chat-view-container">
            {showHeader && (
                <nav className="wh-detail-header" style={{ marginBottom: 0, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={onBack} className="wh-nav-icon-btn" style={{ padding: '4px', marginLeft: '-8px' }}>
                            <FiChevronLeft size={28} />
                        </button>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                            border: '1px solid #eef2ff'
                        }}>
                             {otherPartyAvatar ? <img src={otherPartyAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 800, color: '#4f74ff' }}>{otherUserName?.[0]}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '4px' }}>
                            <h1 className="wh-header-title" style={{ fontSize: '15.5px', margin: 0, color: '#4f74ff', lineHeight: 1 }}>{otherUserName || 'Chat'}</h1>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#10B981', letterSpacing: '0.8px', textTransform: 'uppercase' }}>ONLINE</span>
                        </div>
                    </div>
                    <button className="wh-nav-icon-btn">
                        <FiBell size={22} style={{ color: '#94a3b8' }} />
                    </button>
                </nav>
            )}

            {/* Task Context Card */}
            {jobTitle && (
                <div style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#fff', 
                    borderBottom: '1px solid #F1F5F9'
                }}>
                    <div style={{
                        background: '#EEF2FF',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: '#1C4DFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#FFF'
                            }}>
                                <HiOutlineWrench size={22} />
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0' }}>{jobTitle}</p>
                                <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: 0 }}>Task Budget: ₹{budget}</p>
                            </div>
                        </div>
                        <span style={{
                            fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: '#CBD5E1',
                            color: '#475569',
                            textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap'
                        }}>
                            {status === 'active' ? 'NEGOTIATING' : status?.toUpperCase() || 'CHAT'}
                        </span>
                    </div>
                </div>
            )}

            <div className="chat-messages" ref={scrollRef}>
                {loading ? (
                    <HashLoader text="" />
                ) : messages.length === 0 ? (
                    <div className="chat-empty-convo">
                        <div className="convo-start-msg">
                            <FiClock size={24} />
                            <p>No messages yet. Send a message to start the project!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={msg.id}>
                            {isDifferentDay(idx) && (
                                <div className="date-separator">
                                    <span>{getDateLabel(msg.created_at)}</span>
                                </div>
                            )}
                            <div className={`chat-bubble-wrap ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                                <div className="chat-bubble">
                                    <p>{msg.content}</p>
                                    <span className="chat-time">{formatTime(msg.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="chat-bottom-bar">
                <form className="chat-input-area" onSubmit={handleSend}>
                    <button type="button" className="chat-plus-btn">
                        <FiPlus size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={!newMessage.trim()} title="Send message" className="chat-send-btn">
                        <FiSend size={18} />
                    </button>
                </form>
            </div>

            <style jsx>{`
                .chat-view-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #fff;
                    position: relative;
                }
                .chat-view-header {
                    padding: 16px 24px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                    z-index: 10;
                }
                .chat-user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .chat-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 16px;
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
                }
                .chat-user-name {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }
                .chat-online-dot {
                    font-size: 11px;
                    color: #10b981;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-weight: 600;
                }
                .chat-online-dot::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    background: #f8fafc;
                    scroll-behavior: smooth;
                }
                .chat-messages::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .date-separator {
                    display: flex;
                    justify-content: center;
                    margin: 20px 0;
                    position: relative;
                }
                .date-separator::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: #e2e8f0;
                    z-index: 1;
                }
                .date-separator span {
                    background: #f8fafc;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    position: relative;
                    z-index: 2;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border: 1px solid #f1f5f9;
                }
                .chat-bubble-wrap {
                    display: flex;
                    width: 100%;
                    margin-bottom: 12px;
                    animation: slideUp 0.3s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .chat-bubble-wrap.sent {
                    justify-content: flex-end;
                }
                .chat-bubble-wrap.received {
                    justify-content: flex-start;
                }
                .chat-bubble {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.5;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .sent .chat-bubble {
                    background: linear-gradient(135deg, #1C4DFF 0%, #3366FF 100%);
                    color: #fff;
                    border-bottom-right-radius: 4px;
                }
                .received .chat-bubble {
                    background: #EEF2FF;
                    color: #1e293b;
                    border-bottom-left-radius: 4px;
                    border: none;
                }
                .chat-bubble p {
                    margin: 0;
                    word-wrap: break-word;
                }
                .chat-time {
                    display: block;
                    font-size: 10px;
                    margin-top: 5px;
                    opacity: 0.6;
                    text-align: right;
                }
                .sent .chat-time {
                    color: rgba(255,255,255,0.8);
                }
                .received .chat-time {
                    color: #94a3b8;
                }
                .chat-bottom-bar {
                    padding: 12px 16px 20px;
                    background: #fff;
                    border-top: 1px solid #f1f5f9;
                }
                .chat-input-area {
                    display: flex;
                    background: #F8FAFC;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 999px;
                    padding: 4px 4px 4px 6px;
                    align-items: center;
                    transition: all 0.2s;
                    gap: 4px;
                }
                .chat-input-area:focus-within {
                    border-color: #1C4DFF;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(28, 77, 255, 0.08);
                }
                .chat-input-area input {
                    flex: 1;
                    padding: 8px 8px;
                    border: none;
                    background: transparent;
                    font-size: 14px;
                    color: #0f172a;
                    outline: none;
                }
                .chat-plus-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: #E2E8F0;
                    color: #475569;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }
                .chat-plus-btn:hover {
                    background: #CBD5E1;
                }
                .chat-send-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #1C4DFF;
                    color: #fff;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.2s;
                }
                .chat-send-btn:hover {
                    background: #1540D9;
                    transform: scale(1.05);
                }
                .chat-send-btn:disabled {
                    background: #CBD5E1;
                    cursor: not-allowed;
                    transform: none;
                }
                .chat-empty-state {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    color: #64748b;
                    padding: 40px;
                    text-align: center;
                }
                .empty-icon-pulse {
                    width: 100px;
                    height: 100px;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    color: #e2e8f0;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                    50% { transform: scale(1.05); box-shadow: 0 10px 35px rgba(0,0,0,0.08); }
                    100% { transform: scale(1); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                }
                .chat-empty-state h3 {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 10px 0;
                }
                .chat-empty-state p {
                    font-size: 14px;
                    max-width: 250px;
                    margin: 0;
                }
                .chat-empty-convo {
                    padding: 40px;
                    display: flex;
                    justify-content: center;
                }
                .convo-start-msg {
                    background: #fff;
                    padding: 24px;
                    border-radius: 20px;
                    border: 1px dashed #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: #94a3b8;
                    text-align: center;
                }
                .convo-start-msg p {
                    font-size: 13px;
                    margin: 0;
                    font-weight: 500;
                }
                .chat-loading-skeleton {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .skeleton-bubble {
                    height: 50px;
                    border-radius: 18px;
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                .skeleton-bubble.left { width: 60%; align-self: flex-start; }
                .skeleton-bubble.right { width: 70%; align-self: flex-end; }
                @keyframes shimmer {
                    from { background-position: 200% 0; }
                    to { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
