import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nmffiiixdgdrklpqardv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZmZpaWl4ZGdkcmtscHFhcmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MzE0NjUsImV4cCI6MjA4NzQwNzQ2NX0.8W5OZj1o8ETR1hnpc2roeIg38YKH0gLJsU1H8rbwwdc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function signInRandomWorker() {
    // We can't sign in without password, but we can just use the anon key 
    // Wait, the anon key without a session cannot insert/delete anything because of RLS!
    // That's why I need the user's session.
}
