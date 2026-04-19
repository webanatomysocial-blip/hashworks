'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FiMessageSquare, FiSearch, FiArrowLeft, FiClock, FiBell, FiChevronLeft } from 'react-icons/fi';
import ChatView from '@/Components/common/ChatView';
import HashLoader from '@/Components/common/HashLoader';
import { getLastMessage, getUnreadCount } from '@/lib/chat';
import '@/css/dashboard.css';

import { Input } from "@/Components/ui/Input";
import { Button } from "@/Components/ui/Button";

function MessagesContent() {
    const searchParams = useSearchParams();
    const initialContractId = searchParams.get('contract');

    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Chat Selection & Filter State
    const [selectedChat, setSelectedChat] = useState({ id: null, otherUserName: '', jobTitle: '', status: '', budget: 0 });
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
                    status: contract.status
                };
            }));

            const finalChats = chatsWithDetails.filter(Boolean);
            finalChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            setChats(finalChats);

            // Handle Deep Linking from Dashboard
            if (initialContractId) {
                const targetChat = finalChats.find(c => c.id === initialContractId);
                if (targetChat) {
                    setSelectedChat({
                        id: targetChat.id,
                        otherUserName: targetChat.otherPartyName,
                        jobTitle: targetChat.jobTitle,
                        status: targetChat.status,
                        budget: targetChat.budget
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
                return updatedChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
            });
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    const filteredChats = chats.filter(chat => {
        const matchesSearch = chat.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'Active') return chat.status === 'active';
        if (activeTab === 'Awaiting Reply') return chat.unreadCount > 0 || (chat.lastSenderId && chat.lastSenderId !== currentUser?.id);

        return true;
    });

    const handleSelectChat = (chat) => {
        setSelectedChat({
            id: chat.id,
            otherUserName: chat.otherPartyName,
            jobTitle: chat.jobTitle,
            status: chat.status,
            budget: chat.budget
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
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>
            {/* ── Sidebar ── */}
            <aside
                className={`messages-sidebar ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    borderRight: '1.5px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    flexShrink: 0,
                    zIndex: 10
                }}
            >
                <header style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '16px 20px', 
                    background: '#fff', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 100, 
                    borderBottom: '1.5px solid #f1f5f9'
                }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                        <FiChevronLeft size={24} color="#64748B" />
                    </button>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Inbox</h2>
                    <div style={{ width: 40 }} />
                </header>

                <div className="filter-chips-container" style={{ display: 'flex', gap: '8px', padding: '16px 20px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid #f8fafc' }}>
                    {['All', 'Active', 'Awaiting Reply'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveTab(filter)}
                            style={{
                                padding: '10px 18px', borderRadius: '30px', border: 'none',
                                whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 700,
                                backgroundColor: activeTab === filter ? '#4f74ff' : '#f1f5f9',
                                color: activeTab === filter ? '#FFF' : '#64748b',
                                cursor: 'pointer',
                                transition: '0.2s transform active',
                                boxShadow: activeTab === filter ? '0 4px 12px rgba(79, 116, 255, 0.2)' : 'none'
                            }}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-sm)' }}>
                    {filteredChats.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <FiMessageSquare size={32} style={{ marginBottom: '12px' }} />
                            <p className="text-label-sm">No conversations found</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                style={{
                                    padding: '20px 16px', borderRadius: '24px',
                                    cursor: 'pointer', transition: 'all 0.2s', margin: '8px 4px',
                                    display: 'flex', gap: '14px', alignItems: 'flex-start',
                                    backgroundColor: selectedChat.id === chat.id ? '#F8FAFC' : '#FFF',
                                    border: selectedChat.id === chat.id ? '1px solid #E2E8F0' : '1px solid transparent',
                                    position: 'relative',
                                    boxShadow: selectedChat.id === chat.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {/* Active Indicator Dot */}
                                {selectedChat.id === chat.id && (
                                    <div style={{ position: 'absolute', left: '-2px', top: '24px', bottom: '24px', width: '4px', backgroundColor: '#4f74ff', borderRadius: '0 4px 4px 0' }} />
                                )}

                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{
                                        width: '52px', height: '52px', borderRadius: '50%',
                                        backgroundColor: '#E2E8F0', overflow: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '18px', fontWeight: '800', color: '#4f74ff',
                                        border: '2px solid #FFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                    }}>
                                        {chat.otherPartyAvatar ? <img src={chat.otherPartyAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : chat.otherPartyName?.[0]}
                                    </div>
                                    {chat.status === 'active' && (
                                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', border: '2px solid #FFF' }} />
                                    )}
                                </div>

                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.jobTitle}</h4>
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', whiteSpace: 'nowrap', marginLeft: '8px' }}>{formatTimestamp(chat.lastMessageTime)}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px',
                                            backgroundColor: chat.status === 'pending' ? '#DCFCE7' : (chat.status === 'active' ? '#EEF2FF' : '#F1F5F9'),
                                            color: chat.status === 'pending' ? '#166534' : (chat.status === 'active' ? '#4f74ff' : '#475569'),
                                            textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {chat.status === 'pending' ? 'Interested' : (chat.status === 'active' ? 'Assigned' : chat.status?.toUpperCase())}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                                            <span>{chat.otherPartyName}</span>
                                            {chat.otherPartyRating && (
                                                <>
                                                    <span style={{ color: '#F59E0B', fontSize: '10px' }}>★</span>
                                                    <span>{chat.otherPartyRating.toFixed(1)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                                        <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: '12px', opacity: chat.unreadCount > 0 ? 1 : 0.8 }}>
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
                                contractId={selectedChat.id}
                                currentUserId={currentUser?.id}
                                otherUserName={selectedChat.otherUserName}
                                jobTitle={selectedChat.jobTitle}
                                status={selectedChat.status}
                                budget={selectedChat.budget}
                                otherPartyAvatar={chats.find(c => c.id === selectedChat.id)?.otherPartyAvatar}
                                onBack={() => setMobileView('list')}
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
                            <FiMessageSquare size={32} color="#4f74ff" />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Select a conversation</h3>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', maxWidth: '300px' }}>
                            Choose a chat from the sidebar to view messages and task details.
                        </p>
                    </div>
                )}
            </main>

            <style jsx global>{`
                @media (max-width: 900px) {
                    .messages-sidebar.mobile-hidden {
                        display: none !important;
                    }
                    .chat-pane-container.mobile-hidden {
                        display: none !important;
                    }
                    .messages-sidebar {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>
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
