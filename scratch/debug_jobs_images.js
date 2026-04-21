import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugJobs() {
    console.log('Fetching latest jobs to check reference_image_url...');
    const { data, error } = await supabase
        .from('jobs')
        .select('id, title, reference_image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    console.table(data);
}

debugJobs();
