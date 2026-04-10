'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FiMessageSquare, FiSearch, FiArrowLeft, FiClock } from 'react-icons/fi';
import ChatView from '@/Components/ChatView';
import { getLastMessage, getUnreadCount } from '@/lib/chat';
import '@/css/dashboard.css';

export default function MessagesPage() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat Selection State
    const [selectedChat, setSelectedChat] = useState({ id: null, otherUserName: '' });

    const fetchChats = useCallback(async (userId) => {
        try {
            const { data: contracts, error } = await supabase
                .from('contracts')
                .select(`
                    id,
                    status,
                    job_id,
                    hirer:profiles!contracts_hirer_id_fkey(id, first_name, last_name, avatar_url),
                    worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, avatar_url),
                    jobs(title)
                `)
                .or(`hirer_id.eq.${userId},worker_id.eq.${userId}`)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const chatsWithDetails = await Promise.all((contracts || []).map(async (contract) => {
                const isHirer = contract.hirer.id === userId;
                const otherParty = isHirer ? contract.worker : contract.hirer;
                const name = otherParty ? `${otherParty.first_name} ${otherParty.last_name || ''}` : 'Unknown';
                
                const lastMsg = await getLastMessage(contract.id);
                const unreadCount = await getUnreadCount(contract.id, userId);

                return {
                    id: contract.id,
                    otherPartyName: name,
                    otherPartyAvatar: otherParty?.avatar_url,
                    jobTitle: contract.jobs?.title || 'Project',
                    lastMessage: lastMsg?.content || 'No messages yet',
                    lastMessageTime: lastMsg?.created_at || contract.created_at,
                    unreadCount: unreadCount,
                    otherPartyId: otherParty?.id
                };
            }));

            // Sort by last message time
            chatsWithDetails.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            setChats(chatsWithDetails);
        } catch (err) {
            console.error('Error fetching chats:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);
            await fetchChats(user.id);
        }
        init();
    }, [fetchChats]);

    // Real-time subscription for the chat list
    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    const newMsg = payload.new;
                    // Check if this message belongs to one of our active chats
                    setChats(prevChats => {
                        const chatIdx = prevChats.findIndex(c => c.id === newMsg.contract_id);
                        if (chatIdx === -1) return prevChats;

                        const updatedChats = [...prevChats];
                        const chat = updatedChats[chatIdx];
                        
                        updatedChats[chatIdx] = {
                            ...chat,
                            lastMessage: newMsg.content,
                            lastMessageTime: newMsg.created_at,
                            unreadCount: newMsg.sender_id !== currentUser.id ? chat.unreadCount + 1 : chat.unreadCount
                        };

                        // Sort updatedChats again to bring top
                        return updatedChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const filteredChats = chats.filter(chat => 
        chat.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectChat = (chat) => {
        setSelectedChat({ id: chat.id, otherUserName: chat.otherPartyName });
        // Clear unread count for this chat locally
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    };

    const formatSnippet = (text) => {
        if (!text) return '';
        return text.length > 35 ? text.substring(0, 35) + '...' : text;
    };

    const formatTimestamp = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (loading) return (
        <div className="messages-loading">
            <div className="loader"></div>
            <p>Gathering your conversations...</p>
        </div>
    );

    return (
        <div className="messages-layout-v2">
            {/* Sidebar */}
            <aside className={`messages-sidebar ${selectedChat.id ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="sidebar-title">Messages</h1>
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Find a contract..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list">
                    {filteredChats.length === 0 ? (
                        <div className="no-chats-state">
                            <FiMessageSquare size={40} />
                            <p>{searchQuery ? 'No matching conversations' : 'No active projects yet'}</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`chat-card ${selectedChat.id === chat.id ? 'active' : ''}`}
                                onClick={() => handleSelectChat(chat)}
                            >
                                <div className="chat-card-avatar">
                                    {chat.otherPartyAvatar ? (
                                        <img src={chat.otherPartyAvatar} alt="" />
                                    ) : (
                                        <span className="avatar-initials">{chat.otherPartyName[0]}</span>
                                    )}
                                    {chat.unreadCount > 0 && <div className="unread-badge">{chat.unreadCount}</div>}
                                </div>
                                <div className="chat-card-content">
                                    <div className="chat-card-top">
                                        <h3>{chat.otherPartyName}</h3>
                                        <span className="time-label">{formatTimestamp(chat.lastMessageTime)}</span>
                                    </div>
                                    <div className="chat-card-bottom">
                                        <p className="job-title-tag">{chat.jobTitle}</p>
                                        <p className="msg-preview">{formatSnippet(chat.lastMessage)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Chat Pane */}
            <main className={`messages-main ${!selectedChat.id ? 'hidden-mobile' : ''}`}>
                {selectedChat.id ? (
                    <div className="active-chat-container">
                        <header className="main-chat-header">
                            <button className="back-btn" onClick={() => setSelectedChat({ id: null, otherUserName: '' })}>
                                <FiArrowLeft size={22} />
                            </button>
                            <div className="header-info">
                                <div className="header-avatar">
                                    {chats.find(c => c.id === selectedChat.id)?.otherPartyAvatar ? (
                                        <img src={chats.find(c => c.id === selectedChat.id).otherPartyAvatar} alt="" />
                                    ) : (
                                        <span>{selectedChat.otherUserName?.[0]}</span>
                                    )}
                                </div>
                                <div>
                                    <h4>{selectedChat.otherUserName}</h4>
                                    <span className="status-indicator">Connected</span>
                                </div>
                            </div>
                        </header>
                        <div className="main-chat-view">
                            <ChatView 
                                contractId={selectedChat.id}
                                currentUserId={currentUser?.id}
                                otherUserName={selectedChat.otherUserName}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="empty-chat-pane">
                        <div className="empty-pane-visual">
                            <div className="visual-circle">
                                <FiMessageSquare size={48} />
                            </div>
                            <h2>Your Work Hub</h2>
                            <p>Select an ongoing project to communicate with your partner.</p>
                        </div>
                    </div>
                )}
            </main>

            <style jsx>{`
                .messages-layout-v2 {
                    display: flex;
                    height: calc(100vh - 80px);
                    background: #fff;
                    overflow: hidden;
                }
                .messages-sidebar {
                    width: 380px;
                    border-right: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    background: #fff;
                    z-index: 20;
                }
                .sidebar-header {
                    padding: 30px 24px 20px;
                }
                .sidebar-title {
                    font-size: 26px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 20px 0;
                    letter-spacing: -0.5px;
                }
                .search-box {
                    position: relative;
                }
                .search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-box input {
                    width: 100%;
                    padding: 12px 14px 12px 42px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 14px;
                    font-size: 14px;
                    color: #0f172a;
                    outline: none;
                    transition: all 0.2s;
                }
                .search-box input:focus {
                    background: #fff;
                    border-color: #0f172a;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                }
                .chat-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 16px;
                }
                .chat-card {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 16px;
                    border-radius: 18px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    margin-bottom: 8px;
                    border: 1px solid transparent;
                }
                .chat-card:hover {
                    background: #f8fafc;
                }
                .chat-card.active {
                    background: #f1f5f9;
                    border-color: #e2e8f0;
                }
                .chat-card-avatar {
                    position: relative;
                    width: 54px;
                    height: 54px;
                    flex-shrink: 0;
                }
                .chat-card-avatar img, .avatar-initials {
                    width: 100%;
                    height: 100%;
                    border-radius: 16px;
                    object-fit: cover;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0f172a;
                    color: #fff;
                    font-weight: 700;
                    font-size: 18px;
                }
                .unread-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ef4444;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 10px;
                    border: 3px solid #fff;
                }
                .chat-card-content {
                    flex: 1;
                    min-width: 0;
                }
                .chat-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 4px;
                }
                .chat-card-top h3 {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .time-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #94a3b8;
                }
                .chat-card-bottom {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .job-title-tag {
                    font-size: 11px;
                    font-weight: 700;
                    color: #3b82f6;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .msg-preview {
                    font-size: 13px;
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .messages-main {
                    flex: 1;
                    background: #fcfdfe;
                    display: flex;
                    flex-direction: column;
                }
                .active-chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .main-chat-header {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .back-btn {
                    display: none;
                    background: none;
                    border: none;
                    color: #64748b;
                    padding: 8px;
                    margin-left: -8px;
                    cursor: pointer;
                }
                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .header-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }
                .header-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .header-info h4 {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }
                .status-indicator {
                    font-size: 11px;
                    color: #10b981;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .status-indicator::before {
                    content: '';
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                }
                .main-chat-view {
                    flex: 1;
                    overflow: hidden;
                }
                .empty-chat-pane {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 40px;
                }
                .visual-circle {
                    width: 120px;
                    height: 120px;
                    background: #fff;
                    border-radius: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 30px;
                    color: #e2e8f0;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.03);
                    transform: rotate(-5deg);
                }
                .empty-pane-visual h2 {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 12px 0;
                }
                .empty-pane-visual p {
                    color: #64748b;
                    font-size: 15px;
                    max-width: 320px;
                    line-height: 1.6;
                }
                .messages-loading {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    color: #64748b;
                }
                .loader {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f1f5f9;
                    border-top: 4px solid #0f172a;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .no-chats-state {
                    padding: 60px 20px;
                    text-align: center;
                    color: #cbd5e1;
                }
                .no-chats-state p { margin-top: 16px; font-weight: 500; }

                @media (max-width: 900px) {
                    .messages-sidebar { width: 320px; }
                }
                @media (max-width: 768px) {
                    .messages-sidebar { width: 100%; border-right: none; }
                    .messages-sidebar.hidden-mobile { display: none; }
                    .messages-main.hidden-mobile { display: none; }
                    .back-btn { display: block; }
                }
            `}</style>
        </div>
    );
}
