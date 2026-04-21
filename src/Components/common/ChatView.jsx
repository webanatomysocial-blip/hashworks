'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiMessageSquare, FiClock, FiPlus, FiChevronLeft, FiBell, FiMoreVertical, FiInfo } from 'react-icons/fi';
import { HiOutlineWrench } from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import { getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '@/lib/chat';
import HashLoader from './HashLoader';

export default function ChatView({ contractId, currentUserId, otherUserName, showHeader = true, onClose = null, jobTitle = '', status = '', budget = 0, otherPartyAvatar = null, onBack = null, userRole = 'worker' }) {
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
                             {otherPartyAvatar ? <img src={otherPartyAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 500, color: '#4f74ff' }}>{otherUserName?.[0]}</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '4px' }}>
                            <h1 className="wh-header-title" style={{ fontSize: '15.5px', margin: 0, color: '#4f74ff', lineHeight: 1.2 }}>{otherUserName || 'Chat'}</h1>
                        </div>
                    </div>

                </nav>
            )}

            {/* Task Context Card */}
           

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
                            
                            {/* System Message - Aligned Style */}
                            {msg.content.startsWith('System:') ? (
                                <div className={`chat-bubble-wrap system ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                                    <div className="chat-bubble system-bubble">
                                        <p>{msg.content.replace('System:', '').trim()}</p>
                                        <div className="system-btn-wrap">
                                            <a 
                                                href={`${userRole === 'worker' ? '/worker/workercontract' : '/hirer/hirercontract'}?id=${contractId}`}
                                                className="system-btn"
                                            >
                                                View Details →
                                            </a>
                                        </div>
                                        <span className="chat-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className={`chat-bubble-wrap ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}>
                                    <div className="chat-bubble">
                                        <p>{msg.content}</p>
                                        <span className="chat-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="chat-bottom-bar">
                <form className="chat-input-area" onSubmit={handleSend}>
                    
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

        </div>
    );
}
