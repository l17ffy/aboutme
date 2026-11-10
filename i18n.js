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
            'about.text': 'Майбутній соціальний працівник і гуманіст, хочу робити світ хоч трішки кращим. Люблю вінтажну й ретро-техніку, граю на бас-гітарі, збираю фізичні носії — CD і касети, та обожнюю фотографію. У мене СДУГ.',
            'exp.h': 'ДОСВІД І ВОЛОНТЕРСТВО',
            'exp.caritas': 'Волонтерю в Карітасі',
            'exp.egidio': "Волонтерю в Сант'Еджідіо",
            'int.h': 'ІНТЕРЕСИ Й ХОБІ',
            'int.music': '<strong>Музика:</strong> альтернативний рок, інді, пост-панк, нойз-рок, шугейз, емо, емо-рівайвл, Midwest emo і скримо; розбираю бас-табулатури та експериментую зі звуком.',
            'int.gaming': '<strong>Ігри:</strong> ретро-ігри та ритм-ігри. Улюблене: osu!, Guitar Hero, Hatsune Miku: Project DIVA, Taiko no Tatsujin, World of Warcraft (WoW) і Team Fortress 2 (TF2).',
            'lang.label': 'Мова'
        },
        en: {
            'page.title': 'PORTFOLIO.EXE',
            'bg.title': 'Background',
            'bg.frame': 'Background animation',
            'about.tagline': 'FUTURE SOCIAL WORKER | HUMANIST | VOLUNTEER | BASS PLAYER',
            'about.h': 'ABOUT ME',
            'about.text': 'Future social worker and humanist, passionate about making a positive impact. I love vintage and retro gear, play the bass guitar, collect physical music media like CDs and cassettes, and love photography. I have ADHD.',
            'exp.h': 'EXPERIENCE & VOLUNTEERING',
            'exp.caritas': 'Volunteering at Caritas',
            'exp.egidio': "Volunteering at Sant'Egidio",
            'int.h': 'INTERESTS & HOBBIES',
            'int.music': '<strong>Music:</strong> Alternative rock, indie, post-punk, noise rock, shoegaze, emo, emo revival, Midwest emo, and screamo; working with bass tabs and sound experimentation.',
            'int.gaming': '<strong>Gaming:</strong> Retro gaming and rhythm games. Favorite titles: osu!, Guitar Hero, Hatsune Miku: Project DIVA, Taiko no Tatsujin, World of Warcraft (WoW), and Team Fortress 2 (TF2).',
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
