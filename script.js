// Универсальная логика для ЛЮБОГО количества окон .window
const taskbarButtonByWindow = new Map();

// Єдине джерело правди для "стекової" розкладки (вікна в потоці, без драгу).
// ПОРІГ МАЄ ЗБІГАТИСЬ із `@media (max-width: 1150px)` у style.css.
const STACKED_QUERY = '(max-width: 1150px)';
const stackedMql = window.matchMedia ? window.matchMedia(STACKED_QUERY) : null;
function isStackedLayout() {
    // фолбек для браузерів без matchMedia — рахуємо по ширині вікна
    return stackedMql ? stackedMql.matches : window.innerWidth <= 1150;
}

// Єдиний лічильник z-index для коректного "принести нагору" — важливо, коли
// розгорнуто (maximized) одразу кілька вікон: без цього останнє в HTML
// завжди перекривало б інші, незалежно від того, яке з них клікнули останнім.
let zCounter = 1;
function bringToFront(win) {
    zCounter = (zCounter % 15) + 1; // тримаємо в межах 1..15, нижче таскбару (z-index:20)
    win.style.zIndex = zCounter;
}

document.querySelectorAll('.window').forEach((win) => {
    const titleBar = win.querySelector('.title-bar');
    const windowBody = win.querySelector('.window-body');
    const btnMin = win.querySelector('.btn-min');
    const btnMax = win.querySelector('.btn-max');
    const btnClose = win.querySelector('.btn-close');

    let isMaximized = false;
    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let animationFrameId = null;

    // При клике на окно — поднимаем его наверх (z-index)
    win.addEventListener('mousedown', () => bringToFront(win));

    titleBar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || isMaximized) return;
        if (isStackedLayout()) return; // у стековій розкладці вікна статичні, драг не потрібен

        isDragging = true;
        document.body.classList.add('is-dragging');

        startX = e.clientX;
        startY = e.clientY;

        // ВАЖЛИВО: беремо позицію відносно offsetParent (.desktop-stage),
        // а не відносно вьюпорта (getBoundingClientRect) — інакше після
        // центрування стейджу вікно стрибає вбік при першому ж перетягуванні
        startLeft = win.offsetLeft;
        startTop = win.offsetTop;

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(() => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            win.style.left = `${startLeft + deltaX}px`;
            win.style.top = `${startTop + deltaY}px`;
        });
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.classList.remove('is-dragging');

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });

    btnMin.addEventListener('click', () => windowBody.classList.toggle('hidden'));

    btnMax.addEventListener('click', () => {
        isMaximized = !isMaximized;
        win.classList.toggle('maximized');
        bringToFront(win); // розгорнуте вікно завжди має бути видимим над іншими

        // якщо (роз)згорнули LINKS.EXE — перерахувати позицію MUSIC.EXE під ним
        stackMusicBelowLinks();
    });

    // ЗАКРИТТЯ: вікно ховаємо, але кнопка на таскбарі ЗАЛИШАЄТЬСЯ — просто тьмяніє
    btnClose.addEventListener('click', () => {
        win.style.display = 'none';
        const taskbarBtn = taskbarButtonByWindow.get(win);
        if (taskbarBtn) taskbarBtn.classList.add('is-closed');
    });
});

// ==== Таскбар: кнопки вікон (створюються один раз і ніколи не видаляються) ====
const taskbarWindows = document.getElementById('taskbar-windows');

function focusWindow(win) {
    win.style.display = 'flex';
    win.querySelector('.window-body').classList.remove('hidden');
    bringToFront(win);

    const taskbarBtn = taskbarButtonByWindow.get(win);
    if (taskbarBtn) taskbarBtn.classList.remove('is-closed');
}

function buildTaskbarButtons() {
    taskbarWindows.innerHTML = '';
    document.querySelectorAll('.window').forEach((win) => {
        const label = win.querySelector('.title-text').textContent;
        const btn = document.createElement('button');
        btn.className = 'taskbar-item';
        btn.textContent = label;
        btn.addEventListener('click', () => {
            const isOpen = win.style.display !== 'none';
            if (isOpen) {
                // клік по відкритому вікну — повністю закрити (не згортати до заголовка)
                win.style.display = 'none';
                btn.classList.add('is-closed');
            } else {
                focusWindow(win); // закрите — відкрити й підняти нагору
            }
        });
        taskbarWindows.appendChild(btn);
        taskbarButtonByWindow.set(win, btn);
    });
}
buildTaskbarButtons();

// ==== Таскбар: годинник ====
const clockEl = document.getElementById('taskbar-clock');
function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 1000);

// ==== Таскбар: кнопка START — відкрити й розгорнути всі вікна ====
document.getElementById('start-btn').addEventListener('click', () => {
    document.querySelectorAll('.window').forEach((win) => {
        win.style.display = 'flex';
        win.querySelector('.window-body').classList.remove('hidden');
        bringToFront(win);

        const taskbarBtn = taskbarButtonByWindow.get(win);
        if (taskbarBtn) taskbarBtn.classList.remove('is-closed');
    });
    stackMusicBelowLinks(); // якщо LINKS.EXE щойно з'явилось знову — перерахувати позицію MUSIC.EXE
});

// ==== MUSIC.EXE: рандомний плейлист ====
// Сам список треків (SONG_POOL) винесено в окремий файл songs.js,
// підключений в index.html ПЕРЕД цим скриптом.
function renderRandomPlaylist(count = 5) {
    const list = document.getElementById('playlist');
    if (!list) return;

    // перемішуємо копію пулу й беремо перші N
    const shuffled = [...SONG_POOL].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));

    list.innerHTML = picked.map((song, i) => {
        const num = String(i + 1).padStart(2, '0');
        const playingClass = i === 0 ? ' playing' : '';
        return `<li class="${playingClass.trim()}"><span class="track-num">${num}</span> ${song.artist} — ${song.title}</li>`;
    }).join('');

    // клік по треку — "вмикає" саме його (візуально)
    list.querySelectorAll('li').forEach((li) => {
        li.addEventListener('click', () => {
            list.querySelectorAll('li').forEach(other => other.classList.remove('playing'));
            li.classList.add('playing');
        });
    });
}
renderRandomPlaylist();
const isTouchDevice = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
document.querySelectorAll('.desktop-icon').forEach((icon) => {
    const openTarget = () => {
        const win = document.getElementById(icon.dataset.target);
        if (win) focusWindow(win);
    };
    // на десктопі — подвійний клік (як у справжній ОС), на тачі — одинарний
    icon.addEventListener(isTouchDevice ? 'click' : 'dblclick', openTarget);

    // гібриди (ноутбук-трансформер: основний вказівник — миша, але є й тачскрін):
    // дотик пальцем відкриває одним тапом, миша лишається на подвійному кліку
    if (!isTouchDevice && 'PointerEvent' in window) {
        icon.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'touch') openTarget();
        });
    }

    // клавіатура: іконки фокусуються через Tab, Enter/Space відкривають
    icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            openTarget();
        }
    });
});

// ==== Автоматичне позиціювання MUSIC.EXE одразу під LINKS.EXE ====
// Фіксований "top" у CSS ненадійний: реальна висота LINKS.EXE залежить від
// того, як саме браузер відрендерив шрифт VT323, і може відрізнятись —
// тому вікна або злипались, або перекривались. Тут рахуємо позицію
// по факту вже готового вікна LINKS.EXE, з фіксованим відступом між ними.
function stackMusicBelowLinks() {
    const linksWin = document.getElementById('links-window');
    const musicWin = document.getElementById('music-window');
    if (!linksWin || !musicWin) return;
    if (isStackedLayout()) return; // у стековій розкладці вікна й так у стеку по потоку документа
    if (linksWin.style.display === 'none') return; // LINKS.EXE закрите — нема від чого рахувати
    if (linksWin.classList.contains('maximized')) return; // LINKS.EXE на весь екран — його offsetHeight це 100vh, а не реальний розмір

    const gap = 20; // відступ між LINKS.EXE і MUSIC.EXE, px
    musicWin.style.top = `${linksWin.offsetTop + linksWin.offsetHeight + gap}px`;
}

// рахуємо одразу, і ще раз коли шрифт VT323 повністю завантажиться
// (до цього моменту висота тексту може бути іншою — з фолбек-шрифтом)
stackMusicBelowLinks();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(stackMusicBelowLinks);
}
window.addEventListener('load', stackMusicBelowLinks);
window.addEventListener('resize', stackMusicBelowLinks);

// перехід між стековою й десктопною розкладкою (поворот екрана, зум, масштаб ОС):
// перерахувати позицію MUSIC.EXE, бо в стековому режимі функція виходила раніше
if (stackedMql) {
    if (stackedMql.addEventListener) stackedMql.addEventListener('change', stackMusicBelowLinks);
    else if (stackedMql.addListener) stackedMql.addListener(stackMusicBelowLinks); // Safari < 14
}
