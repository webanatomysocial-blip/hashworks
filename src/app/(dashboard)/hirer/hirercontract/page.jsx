'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { PageContainer } from "@/Components/layouts/PageContainer";
import SectionHeader from "@/Components/common/SectionHeader";
import HashLoader from '@/Components/common/HashLoader';
import { FiSend, FiArrowLeft, FiClock, FiDollarSign, FiUser, FiInfo, FiFile, FiCheckCircle } from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';

function HirerContractContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const contractId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [contract, setContract] = useState(null);
    const [latestSubmission, setLatestSubmission] = useState(null);
    
    // Chat state
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatRef = useRef(null);

    // Modal state for Revision
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    const [revisionMessage, setRevisionMessage] = useState('');
    
    // Dispute state
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [activeDispute, setActiveDispute] = useState(null);
    
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!contractId) {
            router.push('/hirer/postings');
            return;
        }

        async function fetchContractData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                // Fetch Contract with Job and Worker details
                const { data: contractData, error: contractErr } = await supabase
                    .from('contracts')
                    .select(`
                        *,
                        jobs (*),
                        worker:profiles!contracts_worker_id_fkey (*),
                        hirer:profiles!contracts_hirer_id_fkey (*)
                    `)
                    .eq('id', contractId)
                    .single();

                if (contractErr) throw contractErr;
                setContract(contractData);

                // Fetch latest submission
                const { data: submissionData } = await supabase
                    .from('contract_submissions')
                    .select('*')
                    .eq('contract_id', contractId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (submissionData) {
                    setLatestSubmission(submissionData);
                }

                // Check for active disputes
                const { data: disputeData } = await supabase
                    .from('disputes')
                    .select('*')
                    .eq('contract_id', contractId)
                    .eq('status', 'open')
                    .maybeSingle();
                
                if (disputeData) {
                    setActiveDispute(disputeData);
                }

                // Fetch messages
                const { data: messagesData } = await supabase
                    .from('messages')
                    .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)')
                    .eq('contract_id', contractId)
                    .order('created_at', { ascending: true });
                
                if (messagesData) {
                    setMessages(messagesData);
                }

                // Listen to new messages
                const messageListener = supabase.channel(`hirer_contract_${contractId}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `contract_id=eq.${contractId}` }, payload => {
                        fetchNewMessage(payload.new.id);
                    })
                    .subscribe();

            } catch (err) {
                console.error('Error fetching contract details:', err);
                router.push('/hirer/postings');
            } finally {
                setLoading(false);
            }
        }

        fetchContractData();
    }, [contractId, router]);

    const fetchNewMessage = async (msgId) => {
        const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(first_name, last_name, avatar_url)')
            .eq('id', msgId)
            .single();
        if (data) {
            setMessages(prev => [...prev, data]);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if (chatRef.current) {
                chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const msgText = newMessage.trim();
        setNewMessage('');

        await supabase.from('messages').insert({
            contract_id: contractId,
            sender_id: currentUser.id,
            content: msgText
        });
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this work? The contract will be marked as completed.')) return;
        try {
            setSubmitting(true);
            
            // Update submission status
            await supabase.from('contract_submissions').update({ status: 'approved' }).eq('id', latestSubmission.id);
            
            // Update contract status
            await supabase.from('contracts').update({ status: 'completed' }).eq('id', contractId);

            // Notify in chat
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: currentUser.id,
                content: "System: Work has been approved. Contract completed."
            });

            // Push Notification to Worker
            await supabase.from('notifications').insert({
                user_id: contract.worker_id,
                title: "Work Approved!",
                message: `${contract.hirer?.first_name || 'Hirer'} approved your work for ${contract.jobs?.title}.`,
                link: `/worker/workercontract?id=${contractId}`
            });

            setLatestSubmission(prev => ({ ...prev, status: 'approved' }));
            setContract(prev => ({ ...prev, status: 'completed' }));
            showToast('Work approved successfully!', 'success');

        } catch (err) {
            console.error('Approval Error:', err);
            showToast('Failed to approve: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestRevision = async (e) => {
        e.preventDefault();
        if (!revisionMessage.trim()) return showToast("Message is required for revision", "error");
        
        try {
            setSubmitting(true);
            
            // Update submission status
            await supabase.from('contract_submissions').update({ status: 'revision_requested' }).eq('id', latestSubmission.id);
            
            // Notify in chat
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: currentUser.id,
                content: `System: Revision requested. Reason: ${revisionMessage}`
            });

            // Push Notification to Worker
            await supabase.from('notifications').insert({
                user_id: contract.worker_id,
                title: "Revision Requested",
                message: `${contract.hirer?.first_name || 'Hirer'} requested a revision for ${contract.jobs?.title}.`,
                link: `/worker/workercontract?id=${contractId}`
            });

            setLatestSubmission(prev => ({ ...prev, status: 'revision_requested' }));
            setIsRevisionModalOpen(false);
            setRevisionMessage('');
            showToast('Revision requested.', 'warning');

        } catch (err) {
            console.error('Revision Request Error:', err);
            showToast('Failed to request revision: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRaiseDispute = async (e) => {
        e.preventDefault();
        if (!disputeReason.trim()) return showToast("Please provide a reason for the dispute.", "error");

        try {
            setSubmitting(true);
            const { data: newDispute, error: disputeErr } = await supabase.from('disputes').insert([{
                contract_id: contractId,
                raised_by_id: currentUser.id,
                reason: disputeReason,
                status: 'open'
            }]).select().single();

            if (disputeErr) throw disputeErr;

            // Notify in chat
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: currentUser.id,
                content: `System: A dispute has been raised by the hirer. Reason: ${disputeReason}`
            });

            setActiveDispute(newDispute);
            setIsDisputeModalOpen(false);
            setDisputeReason('');
            showToast("Dispute raised successfully. The contract is now locked.", "warning");

        } catch (err) {
            console.error('Dispute Error:', err);
            showToast('Failed to raise dispute: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <HashLoader text="" />;
    if (!contract) return null;

    const job = contract.jobs;
    const worker = contract.worker;

    let actionState = 'waiting_for_submission'; // 'waiting_for_submission', 'review', 'revision_requested', 'approved'
    if (contract.status === 'completed') actionState = 'approved';
    else if (latestSubmission) {
        if (latestSubmission.status === 'submitted') actionState = 'review';
        else if (latestSubmission.status === 'revision_requested') actionState = 'revision_requested';
        else if (latestSubmission.status === 'approved') actionState = 'approved';
    }

    if (activeDispute) actionState = 'disputed';

    return (
        <div style={{ background: 'var(--hw-surface)', minHeight: '100vh' }}>
            <SectionHeader title="Review Contract" />

            <PageContainer>
                <div className="contract-detail-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'minmax(0, 1fr) 340px', 
                    gap: '24px', 
                    padding: '24px 20px', 
                    alignItems: 'start' 
                }}>
                    
                    {/* Left Column (Main Content) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div className="hw-card">
                            <h2 className="text-title-md hw-mb-16">Job Details</h2>
                            <p className="text-body-md hw-mb-20">
                                {job.description || "No description provided."}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="hw-icon-box-sm" style={{ color: 'var(--hw-primary)' }}><FiClock size={18} /></div>
                                    <div>
                                        <p className="text-label-sm">Budget</p>
                                        <p className="text-title-md" style={{ fontSize: '15px' }}>₹{contract.agreed_amount || job.budget_max || '-'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="hw-icon-box-sm" style={{ color: 'var(--hw-warning)' }}><FiClock size={18} /></div>
                                    <div>
                                        <p className="text-label-sm">Timeline</p>
                                        <p className="text-title-md" style={{ fontSize: '15px' }}>{job.estimated_days ? `${job.estimated_days} Days` : 'Flexible'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div 
                            className="hw-card hw-card-interactive" 
                            onClick={() => router.push(`/profile/view?id=${worker?.id}`)}
                        >
                            <h2 className="text-title-md hw-mb-16">Talent Info</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {worker?.avatar_url ? (
                                    <img src={worker.avatar_url} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="hw-chat-avatar">
                                        <FiUser size={24} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-title-md" style={{ fontSize: '16px' }}>{worker?.first_name} {worker?.last_name}</h3>
                                    <p className="text-body-md" style={{ fontSize: '13px' }}>{worker?.city || 'No location'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Action Panel) */}
                    <div className="action-panel-container" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="hw-card" style={{ boxShadow: 'var(--hw-shadow-medium)' }}>
                            <h3 className="text-title-md hw-mb-12">Submission Review</h3>

                            {actionState === 'waiting_for_submission' && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div className="hw-icon-box" style={{ margin: '0 auto 12px', background: 'var(--hw-surface-low)', color: 'var(--hw-text-secondary)' }}>
                                        <FiClock size={24} />
                                    </div>
                                    <p className="text-body-md" style={{ fontWeight: 600 }}>Waiting for first submission from worker.</p>
                                </div>
                            )}

                            {latestSubmission && actionState !== 'waiting_for_submission' && (
                                <div style={{ background: 'var(--hw-surface-low)', borderRadius: 'var(--hw-radius-md)', padding: '16px', marginBottom: '20px' }}>
                                    <p className="text-label-sm hw-mb-8">Latest Note From Worker</p>
                                    <p className="text-body-md hw-mb-16" style={{ color: 'var(--hw-text-primary)' }}>{latestSubmission.message}</p>
                                    
                                    {latestSubmission.file_url && (
                                        <a href={latestSubmission.file_url} target="_blank" rel="noreferrer" className="hw-btn hw-btn-ghost hw-w-full" style={{ height: '40px', fontSize: '13px', border: '1px solid var(--hw-surface-high)', background: '#fff' }}>
                                            <FiFile /> View Attachment
                                        </a>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button 
                                    onClick={() => router.push(`/messages?contract=${contractId}`)}
                                    className="hw-btn hw-btn-primary hw-w-full"
                                    style={{ borderRadius: '22px', height: '48px' }}
                                >
                                    <FiSend /> Chat with Talent
                                </button>

                                {actionState === 'review' && (
                                    <>
                                        <button 
                                            onClick={handleApprove}
                                            disabled={submitting}
                                            className="hw-btn hw-btn-primary hw-w-full"
                                            style={{ background: 'var(--hw-success)', boxShadow: 'none' }}
                                        >
                                            <FiCheckCircle size={18} /> Approve Work
                                        </button>
                                        <button 
                                            onClick={() => setIsRevisionModalOpen(true)}
                                            disabled={submitting}
                                            className="hw-btn hw-w-full"
                                            style={{ background: 'transparent', border: '1px solid var(--hw-warning)', color: 'var(--hw-warning)' }}
                                        >
                                            Request Revision
                                        </button>
                                    </>
                                )}

                                {actionState === 'revision_requested' && (
                                    <button disabled className="hw-btn hw-w-full" style={{ background: 'var(--hw-surface-high)', color: 'var(--hw-text-secondary)', cursor: 'default' }}>
                                        Waiting for Resubmission
                                    </button>
                                )}
                                
                                {actionState === 'approved' && (
                                    <button disabled className="hw-btn hw-w-full" style={{ background: '#DCFCE7', color: '#16A34A', cursor: 'default' }}>
                                        ✓ Completed & Approved
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </PageContainer>

            {/* Responsive CSS */}
            <style jsx global>{`
                @media (max-width: 900px) {
                    .contract-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .action-panel-container {
                        position: static !important;
                        margin-top: 0;
                    }
                }
            `}</style>

            {/* Revision Modal */}
            {isRevisionModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: 'var(--hw-radius-xl)', width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
                        <h2 className="text-title-md hw-mb-24">Request Revision</h2>
                        
                        <form onSubmit={handleRequestRevision}>
                            <div className="hw-mb-32">
                                <label className="text-label-sm hw-mb-8" style={{ display: 'block' }}>What needs to be changed?</label>
                                <textarea 
                                    required
                                    rows={4}
                                    className="hw-input"
                                    style={{ resize: 'vertical' }}
                                    placeholder="Explain the required revisions clearly..."
                                    value={revisionMessage}
                                    onChange={e => setRevisionMessage(e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsRevisionModalOpen(false)}
                                    className="hw-btn hw-w-full"
                                    style={{ background: 'var(--hw-surface-high)', color: 'var(--hw-text-primary)' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="hw-btn hw-btn-primary hw-w-full"
                                    style={{ background: 'var(--hw-warning)', boxShadow: 'none' }}
                                >
                                    {submitting ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {isDisputeModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: 'var(--hw-radius-xl)', width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
                        <h2 className="text-title-md hw-mb-16" style={{ color: 'var(--hw-error)' }}>Raise Dispute</h2>
                        <p className="text-body-md hw-mb-24" style={{ fontSize: '13px' }}>A dispute should only be raised if the work does not meet the agreed requirements. Both parties will be notified.</p>
                        
                        <form onSubmit={handleRaiseDispute}>
                            <div className="hw-mb-32">
                                <label className="text-label-sm hw-mb-8" style={{ display: 'block' }}>Reason for Dispute</label>
                                <textarea 
                                    required
                                    rows={4}
                                    className="hw-input"
                                    style={{ resize: 'vertical' }}
                                    placeholder="Explain why you are raising a dispute..."
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsDisputeModalOpen(false)}
                                    className="hw-btn hw-w-full"
                                    style={{ background: 'var(--hw-surface-high)', color: 'var(--hw-text-primary)' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="hw-btn hw-w-full"
                                    style={{ background: 'var(--hw-error)', color: '#fff', boxShadow: 'none' }}
                                >
                                    {submitting ? 'Raising Dispute...' : 'Raise Dispute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function HirerContractDetails() {
    return (
        <Suspense fallback={<HashLoader text="Loading contract details..." />}>
            <HirerContractContent />
        </Suspense>
    );
}
