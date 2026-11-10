// Двомовність uk/en. Розмітка: data-i18n="ключ" (textContent) або data-i18n-html="ключ" (з <strong>).
// Мова: localStorage → мова браузера → uk.
(function () {
    var STORAGE_KEY = 'lang';
    var SUPPORTED = ['uk', 'en'];

    var DICT = {
        uk: {
            'page.title': 'PORTFOLIO.EXE',
            'bg.title': 'Фон',
            'bg.frame': 'Фонова анімація',
            'about.tagline': 'МАЙБУТНІЙ СОЦПРАЦІВНИК | ГУМАНІСТ | ВОЛОНТЕР | БАСИСТ',
            'about.h': 'ПРО МЕНЕ',
            'about.text': 'Я вчуся на соціального працівника, і моя мета проста: робити світ трохи кращим, по одній людині. У мене СДУГ, мабуть, тому я ніколи не обмежуюся одним хобі. Люблю вінтажні речі й ретро-техніку, граю на басі, шукаю CD і касети та фотографую, коли тільки можу.',
            'exp.h': 'ВОЛОНТЕРСТВО',
            'exp.text': 'Волонтерю в Карітасі та у Спільноті Сант\'Еджідіо.',
            'music.h': 'МУЗИКА',
            'music.text': 'Мій смак — від альтернативного року й інді до пост-панку, нойз-року, шугейзу та цілої емо-родини: емо-рівайвлу, Midwest emo і скримо. Розбираю бас-табулатури й люблю експериментувати зі звуком.',
            'games.h': 'ІГРИ',
            'games.text': 'Люблю ретро- та ритм-ігри й колекціоную ретро-приставки. Улюблені: osu!, Guitar Hero, Project DIVA, Rhythm Heaven, Taiko no Tatsujin, WarioWare, World of Warcraft і Team Fortress 2.',
            'lang.label': 'Мова'
        },
        en: {
            'page.title': 'PORTFOLIO.EXE',
            'bg.title': 'Background',
            'bg.frame': 'Background animation',
            'about.tagline': 'FUTURE SOCIAL WORKER | HUMANIST | VOLUNTEER | BASSIST',
            'about.h': 'ABOUT ME',
            'about.text': 'I’m training to become a social worker, and my goal is simple: to make the world a little bit better, one person at a time. I have ADHD, which is probably why I never stick to just one hobby. I love vintage things and retro tech, play bass, hunt for CDs and cassettes, and take photos whenever I can.',
            'exp.h': 'VOLUNTEERING',
            'exp.text': 'I volunteer with Caritas and the Community of Sant’Egidio.',
            'music.h': 'MUSIC',
            'music.text': 'My taste runs from alternative rock and indie to post-punk, noise rock, shoegaze and the whole emo family: emo revival, Midwest emo and screamo. I learn bass tabs and love experimenting with sound.',
            'games.h': 'GAMES',
            'games.text': 'I’m into retro and rhythm games and collect retro consoles. Favorites: osu!, Guitar Hero, Project DIVA, Rhythm Heaven, Taiko no Tatsujin, WarioWare, World of Warcraft and Team Fortress 2.',
            'lang.label': 'Language'
        }
    };

    function detect() {
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (SUPPORTED.indexOf(saved) !== -1) return saved;
        var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
        for (var i = 0; i < list.length; i++) {
            var code = String(list[i]).toLowerCase().slice(0, 2);
            if (SUPPORTED.indexOf(code) !== -1) return code;
        }
        return 'uk';
    }

    function apply(lang) {
        var d = DICT[lang];
        document.documentElement.lang = lang;
        document.title = d[document.querySelector('iframe.background-frame') ? 'page.title' : 'bg.title'];
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var k = el.getAttribute('data-i18n');
            if (d[k] !== undefined) el.textContent = d[k];
        });
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-html');
            if (d[k] !== undefined) el.innerHTML = d[k];
        });
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            var k = el.getAttribute('data-i18n-title');
            if (d[k] !== undefined) el.setAttribute('title', d[k]);
        });
        document.querySelectorAll('[data-lang]').forEach(function (b) {
            var on = b.getAttribute('data-lang') === lang;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function setLang(lang) {
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        apply(lang);
    }

    apply(detect());

    document.querySelectorAll('[data-lang]').forEach(function (b) {
        b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    // iframe (lavalamp.html) підхоплює зміну мови з головної сторінки
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) apply(detect());
    });
})();
