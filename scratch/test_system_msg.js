
import { supabase } from '../src/lib/supabase.js';

async function testSystemMessage() {
    try {
        // Need a valid contract ID to test
        const { data: contracts } = await supabase.from('contracts').select('id').limit(1);
        if (!contracts?.length) {
            console.log("No contracts found to test with.");
            return;
        }
        
        const contractId = contracts[0].id;
        console.log(`Testing with contract: ${contractId}`);

        const { data, error } = await supabase.from('messages').insert({
            contract_id: contractId,
            sender_id: null,
            content: "System: Test system message"
        }).select();

        if (error) {
            console.error("Error inserting system message:", error);
        } else {
            console.log("Success! System message inserted:", data[0]);
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testSystemMessage();
