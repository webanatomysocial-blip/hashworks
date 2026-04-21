
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStats() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error("No user found");
        return;
    }
    console.log("Checking stats for user:", user.id);

    // Call RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_dashboard_stats", {
        p_user_id: user.id,
    });
    console.log("RPC Data:", JSON.stringify(rpcData, null, 2));

    // Manual check for applications
    const { count: appCount, error: appError } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', user.id);
    console.log("Manual Application Count:", appCount);

    // Manual check for jobs by user
    const { count: jobCount, error: jobError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('hirer_id', user.id);
    console.log("Manual Job Count:", jobCount);
}

checkStats();
