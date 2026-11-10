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

// ==== Вікна не виходять за межі екрана (десктопна розкладка) ====
// Доступна область = viewport мінус таскбар. Вікно або зсувається в її межі
// (перетягування), або обмежується по висоті (max-height) з внутрішнім скролом.
const EDGE_GAP = 8;       // мінімальний відступ від країв, px
const MIN_VISIBLE_H = 140; // менше цього вікно не стискаємо — краще підняти вище

function getBounds() {
    const de = document.documentElement;
    const taskbar = document.querySelector('.taskbar');
    const taskbarH = taskbar ? taskbar.offsetHeight : 0;
    return {
        left: EDGE_GAP,
        top: EDGE_GAP,
        right: de.clientWidth - EDGE_GAP,
        bottom: de.clientHeight - taskbarH - EDGE_GAP
    };
}

// left/top — у координатах стейджа (offsetParent), w/h — розмір, який має поміститись
function clampToViewport(win, left, top, w, h) {
    const stage = win.offsetParent;
    const sr = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
    const b = getBounds();
    const minL = b.left - sr.left;
    const minT = b.top - sr.top;
    const maxL = Math.max(minL, b.right - sr.left - w);
    const maxT = Math.max(minT, b.bottom - sr.top - h);
    return {
        left: Math.min(Math.max(left, minL), maxL),
        top: Math.min(Math.max(top, minT), maxT)
    };
}

function fitWindow(win) {
    if (isStackedLayout() || win.classList.contains('maximized') || win.style.display === 'none') {
        win.style.maxHeight = ''; // у стеку/розгорнутому вигляді висотою керує CSS
        return;
    }

    win.style.maxHeight = ''; // міряємо природну висоту
    // не зсуваємо вікно вгору заради повної висоти — його стискає max-height;
    // піднімаємо лише якщо під ним лишається менше MIN_VISIBLE_H
    const h = Math.min(win.offsetHeight, MIN_VISIBLE_H);
    const pos = clampToViewport(win, win.offsetLeft, win.offsetTop, win.offsetWidth, h);
    win.style.left = `${pos.left}px`;
    win.style.top = `${pos.top}px`;

    const stage = win.offsetParent;
    const sr = stage ? stage.getBoundingClientRect() : { top: 0 };
    const room = getBounds().bottom - (sr.top + pos.top);
    win.style.maxHeight = `${Math.max(MIN_VISIBLE_H, Math.floor(room))}px`;
}

// Композиція: верхні краї OS-вікна й колонки LINKS+MUSIC на одній лінії, а вся група
// по вертикалі по центру доступної області. Не чіпаємо, якщо користувач уже щось перетягнув.
const STACK_GAP = 12; // відступ між LINKS.EXE і MUSIC.EXE, px
let userMovedWindows = false;
function composeDesktop() {
    if (userMovedWindows) return;
    const os = document.getElementById('os-window');
    const links = document.getElementById('links-window');
    const music = document.getElementById('music-window');
    if (!os || !links || !music) return;
    const all = [os, links, music];
    if (all.some((w) => w.classList.contains('maximized'))) return;

    all.forEach((w) => { w.style.maxHeight = ''; }); // міряємо природну висоту
    const h = (w) => (w.style.display === 'none' ? 0 : w.offsetHeight);
    const linksH = h(links), musicH = h(music);
    const colH = linksH + (linksH && musicH ? STACK_GAP : 0) + musicH;
    const groupH = Math.max(h(os), colH);

    const stage = os.offsetParent;
    const sr = stage ? stage.getBoundingClientRect() : { top: 0 };
    const b = getBounds();
    const availH = b.bottom - b.top;
    const top = b.top - sr.top + Math.max(0, Math.round((availH - groupH) / 2));
    os.style.top = `${top}px`;
    links.style.top = `${top}px`;
}

// Повна розкладка: підігнати всі вікна, а MUSIC.EXE поставити під LINKS.EXE вже після підгонки LINKS
function layoutDesktop() {
    const wins = Array.from(document.querySelectorAll('.window'));
    if (isStackedLayout()) {
        wins.forEach((w) => { w.style.maxHeight = ''; });
        return;
    }
    composeDesktop();
    wins.filter((w) => w.id !== 'music-window').forEach(fitWindow);
    stackMusicBelowLinks();
    const musicWin = document.getElementById('music-window');
    if (musicWin) fitWindow(musicWin);
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
        userMovedWindows = true; // далі не перекомпоновуємо вікна автоматично
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

            // обмежуємо координати так, щоб вікно цілком лишалось у видимій області
            const pos = clampToViewport(win, startLeft + deltaX, startTop + deltaY, win.offsetWidth, win.offsetHeight);
            win.style.left = `${pos.left}px`;
            win.style.top = `${pos.top}px`;
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

            fitWindow(win); // перерахувати max-height під нову позицію (вікно може знову розтягнутись)
        }
    });

    btnMin.addEventListener('click', () => windowBody.classList.toggle('hidden'));

    btnMax.addEventListener('click', () => {
        isMaximized = !isMaximized;
        win.classList.toggle('maximized');
        bringToFront(win); // розгорнуте вікно завжди має бути видимим над іншими

        // після (роз)горнання: підігнати вікна під екран і перерахувати позицію MUSIC.EXE під LINKS.EXE
        layoutDesktop();
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

    layoutDesktop(); // щойно показане вікно має вміститись в екран
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
    layoutDesktop(); // підігнати вікна й, якщо LINKS.EXE щойно з'явилось знову, перерахувати позицію MUSIC.EXE
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
// того, як саме браузер відрендерив шрифт Tiny5 Mono, і може відрізнятись —
// тому вікна або злипались, або перекривались. Тут рахуємо позицію
// по факту вже готового вікна LINKS.EXE, з фіксованим відступом між ними.
function stackMusicBelowLinks() {
    const linksWin = document.getElementById('links-window');
    const musicWin = document.getElementById('music-window');
    if (!linksWin || !musicWin) return;
    if (isStackedLayout()) return; // у стековій розкладці вікна й так у стеку по потоку документа
    if (linksWin.style.display === 'none') return; // LINKS.EXE закрите — нема від чого рахувати
    if (linksWin.classList.contains('maximized')) return; // LINKS.EXE на весь екран — його offsetHeight це 100vh, а не реальний розмір

    const gap = STACK_GAP;
    musicWin.style.top = `${linksWin.offsetTop + linksWin.offsetHeight + gap}px`;
}

// рахуємо одразу, і ще раз коли шрифт Tiny5 Mono повністю завантажиться
// (до цього моменту висота тексту може бути іншою — з фолбек-шрифтом)
layoutDesktop();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutDesktop);
}
window.addEventListener('load', layoutDesktop);
window.addEventListener('resize', layoutDesktop); // зум, масштаб ОС, зміна розміру вікна браузера
window.addEventListener('orientationchange', layoutDesktop);

// перехід між стековою й десктопною розкладкою (поворот екрана, зум, масштаб ОС):
// перерахувати позицію MUSIC.EXE, бо в стековому режимі функція виходила раніше
if (stackedMql) {
    if (stackedMql.addEventListener) stackedMql.addEventListener('change', layoutDesktop);
    else if (stackedMql.addListener) stackedMql.addListener(layoutDesktop); // Safari < 14
}
