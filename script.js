import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

// Знаходимо елементи
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const captionText = document.getElementById('caption');
const closeBtn = document.querySelector('.close-btn');

// Знаходимо всі картинки в галереї
const galleryImages = document.querySelectorAll('img.gallery-item');

// Додаємо подію кліку для кожної картинки
galleryImages.forEach(image => {
    image.addEventListener('click', () => {
        // 1. Перевірка: чи взагалі працює клік?
        console.log("✅ Клік відбувся по картинці!");

        // 2. Пробуємо взяти посилання
        const fullSizeSrc = image.getAttribute('data-full');
        console.log("🔍 Що в атрибуті data-full:", fullSizeSrc);

        // 3. Відкриваємо лайтбокс
        lightbox.style.display = "block";
        
        // 4. Ставимо картинку і перевіряємо, чи ми це зробили
        if (fullSizeSrc) {
            lightboxImg.src = fullSizeSrc;
            console.log("🚀 Пробуємо завантажити:", fullSizeSrc);
        } else {
            console.error("❌ Увага! Атрибут data-full пустий або відсутній!");
        }
        
        captionText.innerHTML = image.alt;
    });
});

// Закриття при кліку на хрестик
closeBtn.addEventListener('click', () => {
    lightbox.style.display = "none";
});

// Закриття при кліку будь-де поза картинкою (по темному фону)
lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) {
        lightbox.style.display = "none";
    }
});