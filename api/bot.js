import { createClient } from '@supabase/supabase-js';

// Тут використовуємо service_role ключ (з налаштувань Vercel), бо це адмінка
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('Bot is active');
    
    const body = req.body;
    if (!body.message || !body.message.text) return res.status(200).send('OK');

    const chatId = body.message.chat.id;
    const text = body.message.text;
    const myId = process.env.ADMIN_CHAT_ID;

    // 🛡️ Перевірка: чи це ти?
    if (String(chatId) !== String(myId)) {
        await sendMessage(chatId, "⛔ Тобі сюди не можна.");
        return res.status(200).send('OK');
    }

    // --- КОМАНДА 1: ДОДАТИ ПОДІЮ ---
    if (text.startsWith('/history ')) {
        const rawContent = text.replace('/history ', '');
        const parts = rawContent.split('|');

        if (parts.length < 3) {
            await sendMessage(chatId, "⚠️ Треба так:\n/history Рік | Назва | Опис");
            return res.status(200).send('OK');
        }

        const year = parts[0].trim();
        const title = parts[1].trim();
        const description = parts[2].trim();

        const { error } = await supabase
            .from('history')
            .insert([{ year: parseInt(year), title: title, description: description }]);

        if (error) {
            await sendMessage(chatId, "❌ Помилка: " + error.message);
        } else {
            await sendMessage(chatId, `✅ Додано: ${title} (${year})`);
        }
    } 
    
    // --- КОМАНДА 2: ПЕРЕГЛЯНУТИ СПИСОК (/list) ---
    else if (text === '/list') {
        const { data, error } = await supabase
            .from('history')
            .select('id, year, title') // Беремо тільки головне
            .order('year', { ascending: false }); // Спочатку нові

        if (error) {
            await sendMessage(chatId, "❌ Помилка: " + error.message);
        } else if (data.length === 0) {
            await sendMessage(chatId, "📭 Історія пуста.");
        } else {
            // Формуємо красивий список
            let msg = "📜 **Список подій:**\n\n";
            data.forEach(item => {
                // Виводимо: ID - РІК - НАЗВА
                msg += `🆔 <b>${item.id}</b> | ${item.year} | ${item.title}\n`;
            });
            msg += "\nЩоб видалити: /delete ID";
            await sendMessage(chatId, msg);
        }
    }

    // --- КОМАНДА 3: ВИДАЛИТИ (/delete ID) ---
    else if (text.startsWith('/delete ')) {
        const idToDelete = text.replace('/delete ', '').trim();

        // Видаляємо з бази
        const { error } = await supabase
            .from('history')
            .delete()
            .eq('id', idToDelete);

        if (error) {
            await sendMessage(chatId, "❌ Не вдалося видалити: " + error.message);
        } else {
            await sendMessage(chatId, `🗑️ Запис ID ${idToDelete} видалено назавжди.`);
        }
    }

    // Інше
    else {
        await sendMessage(chatId, "Команди:\n➕ /history 2024 | Тема | Текст\n📜 /list - показати всі\n🗑️ /delete ID - видалити");
    }

    return res.status(200).send('OK');
}

// Функція відправки (з підтримкою HTML тегів для жирного тексту)
async function sendMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            chat_id: chatId, 
            text: text, 
            parse_mode: 'HTML' // Це дозволяє використовувати <b></b> в телеграмі
        })
    });
}