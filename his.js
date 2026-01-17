// 1. Встав свої дані сюди
const projectUrl = 'https://agkjchoskicbsfuuoboq.supabase.co'; // (https://...supabase.co)
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFna2pjaG9za2ljYnNmdXVvYm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODg3NDQsImV4cCI6MjA4NDE2NDc0NH0.Iz8nj08vvEi5oRkaWQEfcucjhFSn59BogmrtQ82_0Tw';      // (eyJ...)

// 2. Створюємо підключення з УНІКАЛЬНОЮ назвою "historyDb"
// Це вирішить проблему "Identifier has already been declared"
const historyDb = window.supabase.createClient(projectUrl, anonKey);

const timelineContainer = document.getElementById('timeline');

async function loadHistory() {
    console.log("🔄 Починаю завантаження історії...");

    // 3. Робим запит до бази (використовуємо historyDb)
    const { data: events, error } = await historyDb
        .from('history')
        .select('*')
        .order('year', { ascending: true })
        .order('id', { ascending: true });

    // 4. Діагностика помилок
    if (error) {
        console.error('❌ Помилка Supabase:', error.message);
        return;
    }

    if (!events || events.length === 0) {
        console.warn('⚠️ База даних пуста або доступ заблоковано (RLS)!');
        timelineContainer.innerHTML = '<p style="text-align:center;">Історія поки що пуста...</p>';
        return;
    }

    console.log(`✅ Отримано подій: ${events.length}`);

    // 5. Групування та малювання (код той самий)
    const groupedByYear = {};
    
    events.forEach(event => {
        if (!groupedByYear[event.year]) {
            groupedByYear[event.year] = [];
        }
        groupedByYear[event.year].push(event);
    });

    timelineContainer.innerHTML = '';

    Object.keys(groupedByYear).sort((a, b) => a - b).forEach(year => {
        const yearEvents = groupedByYear[year];

        // Головний блок
        const item = document.createElement('div');
        item.classList.add('timeline-item');

        // Рік
        const yearBlock = document.createElement('div');
        yearBlock.classList.add('timeline-date');
        yearBlock.textContent = year;

        // Контент
        const contentBlock = document.createElement('div');
        contentBlock.classList.add('timeline-content');

        yearEvents.forEach((event, index) => {
            if (index > 0) {
                const hr = document.createElement('hr');
                // Стилі для лінії, щоб було гарно
                hr.style.border = "0";
                hr.style.height = "1px";
                hr.style.background = "#ddd"; 
                hr.style.margin = "15px 0";
                contentBlock.appendChild(hr);
            }

            const h3 = document.createElement('h3');
            h3.textContent = event.title;
            contentBlock.appendChild(h3);

            const p = document.createElement('p');
            p.innerHTML = event.description.replace(/\n/g, '<br>');
            
            contentBlock.appendChild(p);
        });

        item.appendChild(yearBlock);
        item.appendChild(contentBlock);
        timelineContainer.appendChild(item);
    });
}

// Запуск
loadHistory();