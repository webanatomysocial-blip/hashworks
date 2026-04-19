'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { PageContainer } from "@/Components/layouts/PageContainer";
import SectionHeader from "@/Components/common/SectionHeader";
import HashLoader from '@/Components/common/HashLoader';
import { FiSend, FiPaperclip, FiArrowLeft, FiClock, FiDollarSign, FiUser, FiInfo } from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';

function WorkerContractContent() {
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

    // Modal state
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState('');
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!contractId) {
            router.push('/worker/active-gigs');
            return;
        }

        async function fetchContractData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                // Fetch Contract with Job and Hirer details
                const { data: contractData, error: contractErr } = await supabase
                    .from('contracts')
                    .select(`
                        *,
                        jobs (*),
                        hirer:profiles!contracts_hirer_id_fkey (*)
                    `)
                    .eq('id', contractId)
                    .single();

                if (contractErr) throw contractErr;
                setContract(contractData);

                // Fetch Hirer Company details separately
                if (contractData.hirer_id) {
                    const { data: compData } = await supabase
                        .from('company_details')
                        .select('*')
                        .eq('hirer_id', contractData.hirer_id)
                        .maybeSingle();
                    if (compData) setContract(prev => ({ ...prev, hirer_company: compData }));
                }

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
                const messageListener = supabase.channel('contract_messages')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `contract_id=eq.${contractId}` }, payload => {
                        fetchNewMessage(payload.new.id);
                    })
                    .subscribe();

            } catch (err) {
                console.error('Error fetching contract details:', err);
                router.push('/worker/active-gigs');
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

    const handleSubmission = async (e) => {
        e.preventDefault();
        if (!submissionMessage.trim()) return showToast("Message is required", "error");
        setSubmitting(true);

        try {
            let fileUrl = null;
            if (submissionFile) {
                const fileExt = submissionFile.name.split('.').pop();
                const fileName = `${contractId}-${Date.now()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('submission-files')
                    .upload(fileName, submissionFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('submission-files')
                    .getPublicUrl(fileName);
                fileUrl = publicUrl;
            }

            // Insert submission
            const { error: subErr } = await supabase.from('contract_submissions').insert({
                contract_id: contractId,
                worker_id: currentUser.id,
                message: submissionMessage,
                file_url: fileUrl,
                status: 'submitted'
            });

            if (subErr) throw subErr;

            // Notify in chat
            await supabase.from('messages').insert({
                contract_id: contractId,
                sender_id: currentUser.id,
                content: "System: Work submitted for review."
            });

            // Put a push notification for the hirer
            await supabase.from('notifications').insert({
                user_id: contract.hirer_id,
                title: "Work Submitted",
                message: `${currentUser?.user_metadata?.first_name || 'Worker'} has submitted work for ${contract.jobs?.title}.`,
                link: `/hirer/hirercontract?id=${contractId}`
            });

            // Update local state
            setLatestSubmission({ status: 'submitted', message: submissionMessage, file_url: fileUrl });
            setIsSubmitModalOpen(false);
            setSubmissionMessage('');
            setSubmissionFile(null);
            showToast("Work submitted successfully!", "success");

        } catch (err) {
            console.error('Submission error:', err);
            showToast("Failed to submit work: " + err.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <HashLoader text="" />;
    if (!contract) return null;

    const job = contract.jobs;
    const hirer = contract.hirer;
    const hirerCompany = contract.hirer_company || null;

    // Action Panel State Logic
    let actionState = 'submit';
    if (contract.status === 'completed') actionState = 'approved';
    else if (latestSubmission) {
        if (latestSubmission.status === 'submitted') actionState = 'waiting';
        else if (latestSubmission.status === 'revision_requested') actionState = 'resubmit';
        else if (latestSubmission.status === 'approved') actionState = 'approved';
    }

    return (
        <div style={{ background: 'var(--hw-surface)', minHeight: '100vh' }}>
            <SectionHeader title="Contract Details" />

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

                        {/* Job Details Section */}
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

                            {job.reference_image_url && (
                                <div style={{ marginTop: '24px' }}>
                                    <h4 className="text-label-sm hw-mb-8">Reference Material</h4>
                                    <img src={job.reference_image_url} alt="Reference" style={{ maxWidth: '100%', borderRadius: 'var(--hw-radius-md)', border: '1px solid var(--hw-surface-high)' }} />
                                </div>
                            )}
                        </div>

                        {/* Hirer Details Section */}
                        <div
                            className="hw-card hw-card-interactive"
                            onClick={() => router.push(`/profile/view?id=${hirer?.id}`)}
                        >
                            <h2 className="text-title-md hw-mb-16">Hirer Info</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {hirer?.avatar_url ? (
                                    <img src={hirer.avatar_url} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="hw-chat-avatar">
                                        <FiUser size={24} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-title-md" style={{ fontSize: '16px' }}>{hirer?.first_name} {hirer?.last_name}</h3>
                                    <p className="text-body-md" style={{ fontSize: '13px' }}>{hirer?.city || 'No location'}</p>
                                </div>
                            </div>

                            {hirerCompany && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '20px', background: 'var(--hw-surface-low)', padding: '16px', borderRadius: 'var(--hw-radius-md)' }}>
                                    <BsBuilding size={18} color="var(--hw-text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>
                                        <h4 className="text-title-md" style={{ fontSize: '14px' }}>{hirerCompany.company_name}</h4>
                                        <p className="text-body-md" style={{ fontSize: '12px' }}>{hirerCompany.industry || 'Company'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Action Panel) */}
                    <div className="action-panel-container" style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="hw-card" style={{ boxShadow: 'var(--hw-shadow-medium)' }}>
                            <h3 className="text-title-md hw-mb-8">Action Panel</h3>
                            <p className="text-body-md hw-mb-24" style={{ fontSize: '13px' }}>Manage your work submission and communicate with the hirer.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => router.push(`/messages?contract=${contractId}`)}
                                    className="hw-btn hw-btn-primary hw-w-full"
                                    style={{ borderRadius: '22px', height: '48px' }}
                                >
                                    <FiSend /> Chat with Hirer
                                </button>

                                {actionState === 'waiting' && (
                                    <button disabled className="hw-btn hw-w-full" style={{ background: 'var(--hw-surface-high)', color: 'var(--hw-text-secondary)', cursor: 'default' }}>
                                        Waiting for Approval
                                    </button>
                                )}

                                {(actionState === 'submit' || actionState === 'resubmit') && (
                                    <button
                                        onClick={() => setIsSubmitModalOpen(true)}
                                        className="hw-btn hw-btn-primary hw-w-full"
                                    >
                                        {actionState === 'resubmit' ? 'Resubmit Work' : 'Submit Work'}
                                    </button>
                                )}

                                {actionState === 'approved' && (
                                    <button disabled className="hw-btn hw-w-full" style={{ background: '#DCFCE7', color: '#16A34A', cursor: 'default' }}>
                                        ✓ Work Approved
                                    </button>
                                )}
                            </div>
                        </div>

                        {latestSubmission && actionState === 'resubmit' && (
                            <div className="hw-card" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hw-warning)', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                                    <FiInfo /> Revision Requested
                                </div>
                                <p className="text-body-md" style={{ fontSize: '13px', color: '#92400E' }}>The hirer has requested revisions. Check your messages for feedback.</p>
                            </div>
                        )}
                    </div>

                </div>
            </PageContainer>

            {/* Response CSS for mobile stacking */}
            <style jsx global>{`
                @media (max-width: 900px) {
                    .contract-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .action-panel-container {
                        position: static !important;
                        margin-top: 0;
                    }
                    /* Optional: Fixed bottom mobile style if user wants specific fixed position */
                    /* 
                    .action-card {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        z-index: 100;
                        border-radius: 20px 20px 0 0 !important;
                        box-shadow: 0 -8px 24px rgba(0,0,0,0.1) !important;
                    }
                    */
                }
            `}</style>

            {/* Submission Modal */}
            {isSubmitModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', color: '#0F172A' }}>{actionState === 'resubmit' ? 'Resubmit Work' : 'Submit Work'}</h2>

                        <form onSubmit={handleSubmission}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Submission Message / Details</label>
                                <textarea
                                    required
                                    rows={4}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', resize: 'vertical' }}
                                    placeholder="Briefly describe what you've done..."
                                    value={submissionMessage}
                                    onChange={e => setSubmissionMessage(e.target.value)}
                                ></textarea>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Attachment (Optional)</label>
                                <div style={{ position: 'relative', overflow: 'hidden', border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC' }}>
                                    <input
                                        type="file"
                                        onChange={e => setSubmissionFile(e.target.files[0])}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                    <div style={{ color: '#64748B', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <FiPaperclip size={24} />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{submissionFile ? submissionFile.name : 'Click or drop a file directly'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    style={{ flex: 1, padding: '14px', borderRadius: '100px', border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ flex: 1, padding: '14px', borderRadius: '100px', border: 'none', background: '#1C4DFF', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                                >
                                    {submitting ? 'Submitting...' : 'Confirm Submission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WorkerContractDetails() {
    return (
        <Suspense fallback={<HashLoader text="Loading contract details..." />}>
            <WorkerContractContent />
        </Suspense>
    );
}
