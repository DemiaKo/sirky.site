import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    const { data, error } = await supabase.from('history').select('id').limit(1);
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ status: 'Supabase is alive!', time: new Date() });
}