import { supabase } from '../src/lib/supabase';

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .limit(1);
    
    if (error) {
        console.log("Error checking email in profiles:", error.message);
    } else {
        console.log("Profiles table has email column.");
    }
}

check();
