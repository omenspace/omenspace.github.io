/* OMEN Space — clean site interactions (i18n, theme, mobile nav, showcase tabs, copy, lightbox) */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- i18n ---------- */
  const langDropdown = $('#lang-dropdown');
  const langToggle = $('#lang-toggle');
  const currentLangText = $('#current-lang');
  const langOptions = $$('.dd-m a');

  function detectDeviceLanguage() {
    const supported = (typeof translations !== 'undefined')
      ? Object.keys(translations)
      : ['tr', 'en', 'zh', 'hi', 'es', 'fr', 'ar'];

    const candidates = [];
    if (navigator.languages && navigator.languages.length) {
      for (const l of navigator.languages) {
        if (l && typeof l === 'string') candidates.push(l);
      }
    }
    if (navigator.language) candidates.push(navigator.language);

    for (const raw of candidates) {
      const code = raw.toLowerCase().split(/[-_]/)[0];
      if (supported.includes(code)) return code;
    }
    return 'en';
  }

  function setLanguage(lang, persist = false) {
    if (typeof translations === 'undefined' || !translations[lang]) lang = 'en';
    if (persist) localStorage.setItem('omenspace-user-lang', lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    if (currentLangText) currentLangText.textContent = lang.toUpperCase();

    langOptions.forEach(opt => opt.classList.toggle('on', opt.getAttribute('data-lang') === lang));
    $$('.pills button').forEach(b => b.classList.toggle('on', b.getAttribute('data-lang') === lang));

    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    if (translations[lang] && translations[lang].title && !document.body.dataset.keepTitle) {
      document.title = translations[lang].title;
    }
  }

  window.setLanguage = (lang) => setLanguage(lang, true);

  $$('.pills button').forEach(b => {
    b.addEventListener('click', () => setLanguage(b.getAttribute('data-lang'), true));
  });

  const savedLang = localStorage.getItem('omenspace-user-lang');
  const initialLang = (savedLang && typeof translations !== 'undefined' && translations[savedLang])
    ? savedLang
    : detectDeviceLanguage();
  setLanguage(initialLang, false);

  if (langToggle && langDropdown) {
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });
    langOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.preventDefault();
        setLanguage(opt.getAttribute('data-lang'), true);
        langDropdown.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!langDropdown.contains(e.target)) langDropdown.classList.remove('open');
    });
  }

  /* ---------- Theme Toggle ---------- */
  const themeBtns = $$('.tg');
  const themeMeta = $('meta[name="theme-color"]');
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('omenspace-theme', t);
    themeBtns.forEach(b => b.textContent = (t === 'dark' ? '☀' : '☾'));
    if (themeMeta) themeMeta.content = (t === 'dark' ? '#0b0c0e' : '#f6f7f8');
  }
  setTheme(localStorage.getItem('omenspace-theme') || 'dark');
  themeBtns.forEach(b => b.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }));

  /* ---------- Mobile Menu ---------- */
  const burger = $('#burger');
  const menu = $('#menu');
  function toggleMenu(force) {
    if (!burger || !menu) return;
    const open = (force === undefined) ? !menu.classList.contains('open') : force;
    menu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && menu) {
    burger.addEventListener('click', () => toggleMenu());
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---------- Tabbed Screenshot Showcase ---------- */
  const scImg = $('#showcaseImg');
  const scMeta = $('#showcaseMeta');
  const scTabs = $$('.sc-tab');
  if (scImg && scTabs.length) {
    scTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        scTabs.forEach(t => t.classList.toggle('on', t === tab));
        scImg.src = tab.dataset.src;
        scImg.alt = tab.textContent.trim();
        if (scMeta && tab.dataset.meta) scMeta.textContent = tab.dataset.meta;
      });
    });
  }

  /* ---------- Copy Command ---------- */
  $$('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy || btn.closest('.cmd-box')?.querySelector('code')?.textContent?.replace(/^\$\s*/, '') || '';
      if (!text) return;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox-modal');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  const lightboxClose = $('.lb-close');

  if (lightbox && lightboxImg) {
    $$('[data-zoom]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const img = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxCaption.textContent = img.alt || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLb = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLb);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lb-wrap')) closeLb();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLb();
    });
  }
});
