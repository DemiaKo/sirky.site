import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SUPER_ADMIN_ID = process.env.ADMIN_CHAT_ID; // Твій особистий ID з .env

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('Bot is active');
    const body = req.body;
    if (!body.message || !body.message.text) return res.status(200).send('OK');

    const chatId = body.message.chat.id;
    const text = body.message.text;

    // --- 1. ПЕРЕВІРКА ДОСТУПУ ---
    // Спочатку перевіряємо, чи це ти (Супер-Адмін)
    let isAdmin = String(chatId) === String(SUPER_ADMIN_ID);

    // Якщо це не ти, шукаємо в базі даних інших адмінів
    if (!isAdmin) {
        const { data } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', chatId)
            .single();
        
        if (data) isAdmin = true;
    }

    // Якщо доступу немає - прощаємось
    if (!isAdmin) {
        // Команда, щоб друг міг дізнатися свій ID і скинути тобі
        if (text === '/my_id') {
            await sendMessage(chatId, `Твій ID: <code>${chatId}</code>\nСкинь його головному адміну.`);
        } else {
            await sendMessage(chatId, "⛔ У тебе немає прав доступу.\nНапиши /my_id, щоб дізнатися свій ID.");
        }
        return res.status(200).send('OK');
    }

    // --- 2. ЛОГІКА ДЛЯ АДМІНІВ ---

    // КОМАНДА: Додати нового адміна (Тільки Супер-Адмін може це робити)
    if (text.startsWith('/add_admin ')) {
        if (String(chatId) !== String(SUPER_ADMIN_ID)) {
            await sendMessage(chatId, "👮 Тільки головний адмін може додавати людей.");
            return res.status(200).send('OK');
        }

        // Формат: /add_admin 123456789 Ім'я
        const params = text.replace('/add_admin ', '').split(' ');
        const newAdminId = params[0];
        const newAdminName = params.slice(1).join(' '); // Все, що після ID - це ім'я

        if (!newAdminId || !newAdminName) {
            await sendMessage(chatId, "⚠️ Формат: /add_admin ID Ім'я");
            return res.status(200).send('OK');
        }

        const { error } = await supabase
            .from('admins')
            .insert([{ user_id: parseInt(newAdminId), name: newAdminName }]);

        if (error) {
            await sendMessage(chatId, "Помилка: " + error.message);
        } else {
            await sendMessage(chatId, `✅ Користувача ${newAdminName} додано в адміни!`);
            await sendMessage(newAdminId, "🎉 Тебе призначено адміністратором бота!");
        }
    }
    // --- КОМАНДА: ВИДАЛИТИ АДМІНА ---
    else if (text.startsWith('/delete_admin ')) {
        // 1. Перевірка: чи це Супер-Адмін?
        if (String(chatId) !== String(SUPER_ADMIN_ID)) {
            await sendMessage(chatId, "⛔ Тільки власник може видаляти адмінів.");
            return res.status(200).send('OK');
        }

        // 2. Отримуємо ID, який треба видалити
        const targetId = text.replace('/delete_admin ', '').trim();

        if (!targetId) {
            await sendMessage(chatId, "⚠️ Вкажи ID. Приклад: /delete_admin 123456789");
            return res.status(200).send('OK');
        }

        // 3. Видаляємо з бази
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('user_id', targetId); // Шукаємо саме по Telegram ID

        if (error) {
            await sendMessage(chatId, "❌ Помилка видалення: " + error.message);
        } else {
            await sendMessage(chatId, `🗑️ Користувача ${targetId} позбавлено прав адміна.`);
            
            // (Необов'язково) Спробувати повідомити користувача, що його видалили
            try {
                await sendMessage(targetId, "info: Тебе було видалено зі списку адміністраторів.");
            } catch (e) {
                // Якщо він заблокував бота, тут буде помилка, і ми її ігноруємо
            }
        }
    }

    // КОМАНДА: Історія (доступна всім адмінам)
    else if (text.startsWith('/history ')) {
        // ... ТУТ ТВІЙ СТАРИЙ КОД ДЛЯ ІСТОРІЇ ...
        // Скопіюй сюди логіку додавання в історію з минулого файлу
        // (щоб не роздувати цю відповідь, я скоротив, але ти зрозумів суть)
         const rawContent = text.replace('/history ', '');
         const parts = rawContent.split('|');
         if (parts.length < 3) {
             await sendMessage(chatId, "⚠️ Формат: /history Рік | Назва | Опис");
         } else {
             const { error } = await supabase.from('history').insert([{ year: parseInt(parts[0]), title: parts[1], description: parts[2] }]);
             if(!error) await sendMessage(chatId, "✅ Додано!");
         }
    }
    
    // КОМАНДА: Показати список адмінів
    else if (text === '/admins') {
        const { data } = await supabase.from('admins').select('*');
        let msg = "👥 **Список адмінів:**\n";
        msg += `👑 Супер-Адмін (Дем'ян)\n`;
        data.forEach(adm => {
            msg += `👤 ${adm.name} (ID: ${adm.user_id})\n`;
        });
        await sendMessage(chatId, msg);
    }

    // КОМАНДА: Перегляд списку історії
    else if (text === '/list') {
         // ... Твій код для списку ...
         // Скопіюй з попередньої версії
    }
    
    // КОМАНДА: Видалення
    else if (text.startsWith('/delete ')) {
         // ... Твій код для видалення ...
         // Скопіюй з попередньої версії
         const idToDelete = text.replace('/delete ', '').trim();
         const { error } = await supabase.from('history').delete().eq('id', idToDelete);
         if (!error) await sendMessage(chatId, "🗑️ Видалено.");
    }

    else {
        await sendMessage(chatId, "Вітаю, Адміне! 👋\n\nКоманди:\n/history ...\n/list\n/delete ID\n/add_admin ID Ім'я\n/delete_admin ID\n/admins");
    }

    return res.status(200).send('OK');
}

async function sendMessage(chatId, text) {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
    });
}