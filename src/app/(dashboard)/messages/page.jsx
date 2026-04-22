'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiMessageSquare, FiSearch, FiArrowLeft, FiClock, FiBell, FiChevronLeft, FiStar } from 'react-icons/fi';
import ChatView from '@/Components/common/ChatView';
import HashLoader from '@/Components/common/HashLoader';
import { getLastMessage, getUnreadCount } from '@/lib/chat';
import '@/css/dashboard.css';

import { Input } from "@/Components/ui/Input";
import { Button } from "@/Components/ui/Button";
import { Badge } from "@/Components/ui/Badge";

function MessagesContent() {
    const searchParams = useSearchParams();
    const initialContractId = searchParams.get('contract');

    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat Selection & Filter State
    const [selectedChat, setSelectedChat] = useState({ id: null, otherUserName: '', contractIds: [], activeContractId: null });
    const [activeTab, setActiveTab] = useState('All');
    const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'

    const fetchChats = useCallback(async (userId) => {
        try {
            // Removed .eq('status', 'active') to show all relevant conversations
            const { data: contracts, error } = await supabase
                .from('contracts')
                .select(`
                    id,
                    status,
                    job_id,
                    agreed_amount,
                    hirer:profiles!contracts_hirer_id_fkey(id, first_name, last_name, avatar_url, average_rating),
                    worker:profiles!contracts_worker_id_fkey(id, first_name, last_name, avatar_url, average_rating),
                    jobs(title, budget_max)
                `)
                .or(`hirer_id.eq.${userId},worker_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const chatsWithDetails = await Promise.all((contracts || []).map(async (contract) => {
                const h = Array.isArray(contract.hirer) ? contract.hirer[0] : contract.hirer;
                const w = Array.isArray(contract.worker) ? contract.worker[0] : contract.worker;

                const isHirer = h?.id === userId;
                const otherParty = isHirer ? w : h;
                const name = otherParty ? `${otherParty.first_name} ${otherParty.last_name || ''}`.trim() : 'Unknown';

                const lastMsg = await getLastMessage(contract.id);
                const unreadCount = await getUnreadCount(contract.id, userId);

                // Don't show in sidebar if there's no message AND the contract isn't active/pending
                // Unless it's the one we're trying to open
                if (!lastMsg && contract.status !== 'active' && contract.status !== 'pending' && contract.id !== initialContractId) return null;

                return {
                    id: contract.id,
                    otherPartyName: name,
                    otherPartyAvatar: otherParty?.avatar_url,
                    otherPartyRating: otherParty?.average_rating,
                    jobTitle: contract.jobs?.title || 'Project',
                    budget: contract.agreed_amount || contract.jobs?.budget_max || 0,
                    lastMessage: lastMsg?.content || 'No messages yet',
                    lastMessageTime: lastMsg?.created_at || contract.created_at,
                    unreadCount: unreadCount,
                    otherPartyId: otherParty?.id,
                    lastSenderId: lastMsg?.sender_id,
                    status: contract.status,
                    isHirer: isHirer
                };
            }));

            const validContracts = chatsWithDetails.filter(Boolean);
            
            const userGroups = {};
            for (const chat of validContracts) {
                if (!userGroups[chat.otherPartyId]) {
                    userGroups[chat.otherPartyId] = {
                        id: chat.otherPartyId,
                        otherPartyName: chat.otherPartyName,
                        otherPartyAvatar: chat.otherPartyAvatar,
                        otherPartyRating: chat.otherPartyRating,
                        contractIds: [chat.id],
                        activeContractId: chat.id,
                        unreadCount: chat.unreadCount,
                        lastMessage: chat.lastMessage,
                        lastMessageTime: chat.lastMessageTime,
                        lastSenderId: chat.lastSenderId,
                        isHirer: chat.isHirer,
                        hasActiveStatus: chat.status === 'active'
                    };
                } else {
                    const group = userGroups[chat.otherPartyId];
                    group.contractIds.push(chat.id);
                    group.unreadCount += chat.unreadCount;
                    if (new Date(chat.lastMessageTime) > new Date(group.lastMessageTime)) {
                        group.lastMessageTime = chat.lastMessageTime;
                        group.lastMessage = chat.lastMessage;
                        group.lastSenderId = chat.lastSenderId;
                    }
                    if (chat.status === 'active') {
                        group.activeContractId = chat.id;
                        group.hasActiveStatus = true;
                    }
                }
            }

            const unifiedChats = Object.values(userGroups).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            setChats(unifiedChats);

            // Handle Deep Linking from Dashboard
            if (initialContractId) {
                const targetChat = unifiedChats.find(c => c.contractIds.includes(initialContractId));
                if (targetChat) {
                    setSelectedChat({
                        id: targetChat.id,
                        otherUserName: targetChat.otherPartyName,
                        contractIds: targetChat.contractIds,
                        activeContractId: targetChat.activeContractId
                    });
                    setMobileView('chat');
                }
            }
        } catch (err) {
            console.error('Error fetching chats:', err);
        } finally {
            setLoading(false);
        }
    }, [initialContractId]);

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);
            await fetchChats(user.id);
        }
        init();
    }, [fetchChats]);

    useEffect(() => {
        if (!currentUser) return;
        const channel = supabase.channel('global-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
            const newMsg = payload.new;
            setChats(prevChats => {
                const chatIdx = prevChats.findIndex(c => c.contractIds.includes(newMsg.contract_id));
                if (chatIdx === -1) return prevChats;
                const updatedChats = [...prevChats];
                const chat = updatedChats[chatIdx];
                updatedChats[chatIdx] = {
                    ...chat,
                    lastMessage: newMsg.content,
                    lastMessageTime: newMsg.created_at,
                    unreadCount: newMsg.sender_id !== currentUser.id ? chat.unreadCount + 1 : chat.unreadCount
                };
                return updatedChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            });
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    const filteredChats = chats.filter(chat => {
        const matchesSearch = chat.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'Active') return chat.hasActiveStatus;
        if (activeTab === 'Awaiting Reply') return chat.unreadCount > 0 || (chat.lastSenderId && chat.lastSenderId !== currentUser?.id);

        return true;
    });

    const handleSelectChat = (chat) => {
        setSelectedChat({
            id: chat.id,
            otherUserName: chat.otherPartyName,
            contractIds: chat.contractIds,
            activeContractId: chat.activeContractId
        });
        setMobileView('chat');
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

    const router = useRouter();

    if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}><HashLoader text="" /></div>;

    return (
        <div className="messages-page-wrapper">
            {/* ── Sidebar ── */}
            <aside className={`messages-sidebar ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}>
                <header className="messages-sidebar-header">
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                        <FiChevronLeft size={24} color="#64748B" />
                    </button>
                    <h2 className="sub-head-text">Inbox</h2>
                    <div style={{ width: 40 }} />
                </header>

                <div className="messages-filter-container">
                    {['All', 'Active', 'Awaiting Reply'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveTab(filter)}
                            className={activeTab === filter ? "hw-filter-active" : "hw-filter-ghost"}
                            style={{
                                padding: '10px 18px', borderRadius: '30px', border: 'none',
                                whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 500,
                                backgroundColor: activeTab === filter ? 'var(--hw-primary)' : 'var(--hw-surface-high)',
                                color: activeTab === filter ? '#FFF' : 'var(--hw-text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: activeTab === filter ? '0 4px 12px rgba(28, 77, 255, 0.2)' : 'none'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="messages-list-container">
                    {filteredChats.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <FiMessageSquare size={32} style={{ marginBottom: '12px' }} />
                            <p className="sub-para-text">No conversations found</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={`chat-card ${selectedChat.id === chat.id ? 'active' : ''}`}
                            >
                                {/* Active Indicator Dot */}
                                {selectedChat.id === chat.id && (
                                    <div style={{ position: 'absolute', left: '-2px', top: '24px', bottom: '24px', width: '4px', backgroundColor: '#4f74ff', borderRadius: '0 4px 4px 0' }} />
                                )}

                                <div className="chat-card-avatar-wrap">
                                    <div className="chat-card-avatar">
                                        {chat.otherPartyAvatar ? <img src={chat.otherPartyAvatar} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : chat.otherPartyName?.[0]}
                                    </div>
                                    {chat.hasActiveStatus && (
                                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', border: '2px solid #FFF' }} />
                                    )}
                                </div>

                                <div className="chat-card-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <h4 className="para-text" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '15px' }}>{chat.otherPartyName}</h4>
                                            {chat.otherPartyRating > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#F59E0B' }}>
                                                    <FiStar size={12} fill="#F59E0B" />
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{chat.otherPartyRating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="sub-para-text" style={{ whiteSpace: 'nowrap', marginLeft: '8px', fontSize: '12px' }}>{formatTimestamp(chat.lastMessageTime)}</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                                        <p style={{ color: '#64748B', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: '12px', opacity: chat.unreadCount > 0 ? 1 : 0.8 }}>
                                            {chat.unreadCount > 0 ? <b>{chat.lastMessage}</b> : chat.lastMessage}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <div style={{
                                                minWidth: '22px', height: '22px', borderRadius: '11px',
                                                backgroundColor: '#4f74ff', color: 'white',
                                                fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: '900', padding: '0 6px', boxShadow: '0 4px 10px rgba(79, 116, 255, 0.3)'
                                            }}>
                                                {chat.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* ── Chat Pane ── */}
            <main
                className={`chat-pane-container ${mobileView === 'list' ? 'mobile-hidden' : ''}`}
                style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}
            >
                {selectedChat.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <ChatView
                                contractIds={selectedChat.contractIds}
                                defaultContractId={selectedChat.activeContractId}
                                currentUserId={currentUser?.id}
                                otherUserName={selectedChat.otherUserName}
                                otherPartyAvatar={chats.find(c => c.id === selectedChat.id)?.otherPartyAvatar}
                                onBack={() => setMobileView('list')}
                                userRole={chats.find(c => c.id === selectedChat.id)?.isHirer ? 'hirer' : 'worker'} 
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        textAlign: 'center',
                        color: '#94A3B8'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '30px',
                            backgroundColor: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', marginBottom: '24px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                        }}>
                            <FiMessageSquare size={32} color="var(--hw-primary)" />
                        </div>
                        <h3 className="sub-head-text">Select a conversation</h3>
                        <p className="para-text" style={{ color: 'var(--hw-text-secondary)', maxWidth: '300px' }}>
                            Choose a chat from the sidebar to view messages and task details.
                        </p>
                    </div>
                )}
            </main>


        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center' }}><HashLoader text="Loading chats..." /></div>}>
            <MessagesContent />
        </Suspense>
    );
}
