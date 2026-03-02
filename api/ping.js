import { createClient } from '@supabase/supabase-js';

// Використовуємо service_role ключ, щоб мати права на запис
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    // Якщо це GET-запит (від браузера або зовнішнього сервісу)
    const now = new Date().toISOString();

    // 1. ЗАПИСУЄМО новий рядок (це 100% вважається активністю для Supabase)
    const { error } = await supabase
        .from('keep_alive')
        .insert([{ ping_time: now }]);
        
    // 2. Видаляємо старі записи, щоб у таблиці завжди був лише 1 рядок
    await supabase.from('keep_alive').delete().neq('ping_time', now);

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    
    // Щоб Vercel не кешував відповідь, додаємо спеціальні заголовки
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({ status: 'Supabase is awake!', time: now });
}