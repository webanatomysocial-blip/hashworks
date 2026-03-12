'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FiMessageSquare, FiChevronRight, FiSearch, FiArrowLeft } from 'react-icons/fi';
import ChatView from '@/Components/ChatView';
import '@/css/dashboard.css';

export default function MessagesPage() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat Modal State
    const [chatConfig, setChatConfig] = useState({ isOpen: false, contractId: null, otherUserName: '' });

    useEffect(() => {
        async function fetchChats() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                // Fetch contracts where user is hirer or worker
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
                    .or(`hirer_id.eq.${user.id},worker_id.eq.${user.id}`)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Format chat objects
                const formattedChats = (contracts || []).map(contract => {
                    const isHirer = contract.hirer.id === user.id;
                    const otherParty = isHirer ? contract.worker : contract.hirer;
                    const name = otherParty ? `${otherParty.first_name} ${otherParty.last_name || ''}` : 'Unknown';
                    
                    return {
                        id: contract.id,
                        otherPartyName: name,
                        otherPartyAvatar: otherParty?.avatar_url,
                        jobTitle: contract.jobs?.title || 'Gig',
                        otherPartyId: otherParty?.id
                    };
                });

                setChats(formattedChats);
            } catch (err) {
                console.error('Error fetching chats:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchChats();
    }, []);

    const filteredChats = chats.filter(chat => 
        chat.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openChat = (chat) => {
        setChatConfig({
            isOpen: true,
            contractId: chat.id,
            otherUserName: chat.otherPartyName
        });
    };

    if (loading) return <div className="loading-state">Loading conversations...</div>;

    const activeChat = chats.find(c => c.id === chatConfig.contractId);

    if (loading) return <div className="loading-state">Loading conversations...</div>;

    return (
        <div className="messages-layout-new">
            {/* Sidebar / List Pane */}
            <div className={`messages-list-pane ${chatConfig.isOpen ? 'hidden-mobile' : ''}`}>
                <div className="messages-header-new">
                    <h1 className="messages-title-new">Messages</h1>
                    <div className="search-bar-wrap-new">
                        <FiSearch className="search-icon-new" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chats-scroll-new">
                    {filteredChats.length === 0 ? (
                        <div className="empty-chats-new">
                            <FiMessageSquare size={32} />
                            <p>No conversations</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`chat-item-new ${chatConfig.contractId === chat.id ? 'active' : ''}`}
                                onClick={() => setChatConfig({ isOpen: true, contractId: chat.id, otherUserName: chat.otherPartyName })}
                            >
                                <div className="chat-avatar-new">
                                    {chat.otherPartyAvatar ? <img src={chat.otherPartyAvatar} alt="" /> : chat.otherPartyName[0]}
                                </div>
                                <div className="chat-info-new">
                                    <h3>{chat.otherPartyName}</h3>
                                    <p>{chat.jobTitle}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Pane */}
            <div className={`messages-chat-pane ${!chatConfig.isOpen ? 'hidden-mobile' : ''}`}>
                {chatConfig.isOpen ? (
                    <div className="chat-pane-inner">
                        <div className="chat-pane-header">
                            <button className="back-btn-mobile" onClick={() => setChatConfig({ ...chatConfig, isOpen: false })}>
                                <FiArrowLeft size={20} />
                            </button>
                            <div className="chat-pane-user">
                                <div className="user-avatar-small">
                                    {activeChat?.otherPartyAvatar ? <img src={activeChat.otherPartyAvatar} alt="" /> : chatConfig.otherUserName?.[0]}
                                </div>
                                <div>
                                    <h4>{chatConfig.otherUserName}</h4>
                                </div>
                            </div>
                        </div>
                        <div className="chat-view-wrapper">
                            <ChatView 
                                contractId={chatConfig.contractId}
                                currentUserId={currentUser?.id}
                                otherUserName={chatConfig.otherUserName}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="chat-pane-placeholder">
                        <div className="placeholder-content">
                            <div className="placeholder-icon">
                                <FiMessageSquare size={40} />
                            </div>
                            <h2>Your Messages</h2>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .messages-layout-new {
                    display: flex;
                    height: calc(100vh - 70px);
                    background: #fff;
                    overflow: hidden;
                }
                .messages-list-pane {
                    width: 350px;
                    border-right: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    background: #fff;
                }
                .messages-header-new {
                    padding: 24px 20px;
                    border-bottom: 1px solid #f8fafc;
                }
                .messages-title-new {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 16px 0;
                }
                .search-bar-wrap-new {
                    position: relative;
                }
                .search-icon-new {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }
                .search-bar-wrap-new input {
                    width: 100%;
                    padding: 10px 12px 10px 36px;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: 10px;
                    font-size: 14px;
                    outline: none;
                }
                .chats-scroll-new {
                    flex: 1;
                    overflow-y: auto;
                }
                .chat-item-new {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }
                .chat-item-new:hover {
                    background: #f8fafc;
                }
                .chat-item-new.active {
                    background: #eff6ff;
                    border-left-color: #2563eb;
                }
                .chat-avatar-new {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    flex-shrink: 0;
                    overflow: hidden;
                }
                .chat-avatar-new img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .chat-info-new h3 {
                    font-size: 14px;
                    font-weight: 700;
                    margin: 0 0 2px 0;
                    color: #0f172a;
                }
                .chat-info-new p {
                    font-size: 12px;
                    color: #64748b;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .messages-chat-pane {
                    flex: 1;
                    background: #fcfdfe;
                    display: flex;
                    flex-direction: column;
                }
                .chat-pane-inner {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .chat-pane-header {
                    padding: 12px 20px;
                    border-bottom: 1px solid #f1f5f9;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .chat-pane-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .user-avatar-small {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #0f172a;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 12px;
                    overflow: hidden;
                }
                .chat-pane-user h4 {
                    font-size: 14px;
                    font-weight: 700;
                    margin: 0;
                }
                .chat-pane-user span {
                    font-size: 10px;
                    color: #10b981;
                    font-weight: 600;
                }
                .chat-view-wrapper {
                    flex: 1;
                }
                .chat-pane-placeholder {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .placeholder-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 2px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #cbd5e1;
                }
                .chat-pane-placeholder h2 {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 8px 0;
                }
                .chat-pane-placeholder p {
                    color: #64748b;
                    font-size: 14px;
                }
                .back-btn-mobile {
                    display: none;
                    background: none;
                    border: none;
                    color: #64748b;
                    padding: 4px;
                }
                .empty-chats-new {
                    padding: 40px 20px;
                    text-align: center;
                    color: #94a3b8;
                }
                @media (max-width: 768px) {
                    .messages-list-pane {
                        width: 100%;
                    }
                    .messages-list-pane.hidden-mobile {
                        display: none;
                    }
                    .messages-chat-pane.hidden-mobile {
                        display: none;
                    }
                    .back-btn-mobile {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
}
