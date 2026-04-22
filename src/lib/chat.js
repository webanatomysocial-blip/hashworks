import { supabase } from './supabase'

/**
 * Sends a message to a specific contract.
 */
export async function sendMessage(contractId, senderId, content) {
    const { data, error } = await supabase
        .from('messages')
        .insert([{
            contract_id: contractId,
            sender_id: senderId,
            content: content
        }])
        .select()
    
    if (error) throw error
    return data[0]
}

/**
 * Fetches message history for a contract.
 */
export async function getMessages(contractId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
}

/**
 * Subscribes to new messages for a contract.
 */
export function subscribeToMessages(contractId, onNewMessage) {
    return supabase
        .channel(`messages:${contractId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `contract_id=eq.${contractId}`
            },
            (payload) => {
                onNewMessage(payload.new)
            }
        )
        .subscribe()
}

/**
 * Marks all messages in a contract as read for the current user (if they are the recipient).
 */
export async function markMessagesAsRead(contractId, currentUserId) {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('contract_id', contractId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false)
    
    if (error) {
        console.error('Error marking messages as read:', error)
    }
}

/**
 * Fetches the last message for a specific contract.
 */
export async function getLastMessage(contractId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    
    if (error) throw error
    return data
}

/**
 * Gets the number of unread messages for a specific user in a contract.
 */
export async function getUnreadCount(contractId, userId) {
    const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contractId)
        .neq('sender_id', userId)
        .eq('is_read', false)
    
    if (error) throw error
    return count || 0
}

/**
 * Fetches message history for multiple contracts.
 */
export async function getMessagesForContracts(contractIds) {
    if (!contractIds || contractIds.length === 0) return []
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('contract_id', contractIds)
        .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
}

/**
 * Marks all messages in multiple contracts as read for the current user.
 */
export async function markMessagesAsReadForContracts(contractIds, currentUserId) {
    if (!contractIds || contractIds.length === 0) return
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('contract_id', contractIds)
        .neq('sender_id', currentUserId)
        .eq('is_read', false)
    
    if (error) {
        console.error('Error marking messages as read:', error)
    }
}
