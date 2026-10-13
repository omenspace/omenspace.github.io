/* OMEN Space — Main site interactions (slide observation, theme, i18n, docking logo, lightbox, copy) */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- i18n Logic ---------- */
  const langDropdown = $('#lang-dropdown');
  const langToggle = $('#lang-toggle');
  const currentLangText = $('#current-lang');
  const langOptions = $$('.dd-m a');

  // Automatic Device Language Detection (checks user's preferred OS/browser languages in order)
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
    if (navigator.userLanguage) candidates.push(navigator.userLanguage);
    if (navigator.browserLanguage) candidates.push(navigator.browserLanguage);

    for (const raw of candidates) {
      const code = raw.toLowerCase().split(/[-_]/)[0];
      if (supported.includes(code)) {
        return code;
      }
    }
    return 'en';
  }

  function setLanguage(lang, persistUserChoice = false) {
    if (typeof translations === 'undefined' || !translations[lang]) lang = 'en';

    if (persistUserChoice) {
      localStorage.setItem('omenspace-user-lang', lang);
    }

    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    if (currentLangText) currentLangText.textContent = lang.toUpperCase();

    langOptions.forEach(opt => {
      opt.classList.toggle('on', opt.getAttribute('data-lang') === lang);
    });

    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    $$('.pills button').forEach(b => {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });

    if (translations[lang] && translations[lang]['title']) {
      document.title = translations[lang]['title'];
    }
  }

  window.setLanguage = (lang) => setLanguage(lang, true);

  $$('.pills button').forEach(b => {
    b.addEventListener('click', () => setLanguage(b.getAttribute('data-lang'), true));
  });

  // If the user has explicitly picked a language via switcher in the past, respect it;
  // otherwise, detect device/OS/browser language automatically!
  const explicitlyChosenLang = localStorage.getItem('omenspace-user-lang');
  const activeLang = (explicitlyChosenLang && typeof translations !== 'undefined' && translations[explicitlyChosenLang])
    ? explicitlyChosenLang
    : detectDeviceLanguage();

  setLanguage(activeLang, false);

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
      if (!langDropdown.contains(e.target)) {
        langDropdown.classList.remove('open');
      }
    });
  }

  /* ---------- Theme Toggle ---------- */
  const themeBtns = $$('.tg');
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('omenspace-theme', t);
    themeBtns.forEach(b => b.textContent = (t === 'dark' ? '☀' : '☾'));
  }
  const savedTheme = localStorage.getItem('omenspace-theme') || 'dark';
  setTheme(savedTheme);
  themeBtns.forEach(b => b.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(cur);
  }));

  /* ---------- Mobile Menu Toggle ---------- */
  const burger = $('#burger');
  const menu = $('#menu');
  function toggleMenu(f) {
    const o = (f === undefined) ? !menu.classList.contains('open') : f;
    menu.classList.toggle('open', o);
    burger.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
    if (av) av.style.display = o ? 'none' : 'block';
  }
  if (burger && menu) {
    burger.addEventListener('click', () => toggleMenu());
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---------- Marquee duplication ---------- */
  const mqEl = $('#mq');
  if (mqEl) {
    const words = [
      'RUST & GTK4', 'LIBADWAITA', 'KERNEL DRIVER', 'WMI & ACPI',
      'RYZEN SMU', 'MUX SWITCH', 'RGB STUDIO', 'QUICK HUD OVERLAY', 'ZERO OVERHEAD'
    ];
    const one = words.map(w => '<span>' + w + '</span><span class="d">◆</span>').join('');
    mqEl.innerHTML = one.repeat(2) + one.repeat(2);
  }

  /* ---------- Slides & Dots ---------- */
  const slides = $$('.slide');
  if (slides.length > 0) {
    slides.forEach(s => {
      const rvs = $$('.rv', s);
      rvs.forEach((e, i) => {
        if (!e.style.getPropertyValue('--d')) e.style.setProperty('--d', (i * 0.08) + 's');
      });
    });

    const dots = document.createElement('div');
    dots.id = 'dots';
    slides.forEach((s, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', () => s.scrollIntoView({ behavior: 'smooth' }));
      dots.appendChild(b);
    });
    document.body.appendChild(dots);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('act', entry.isIntersecting);
        if (entry.isIntersecting) {
          const idx = slides.indexOf(entry.target);
          [...dots.children].forEach((b, i) => b.classList.toggle('on', i === idx));
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

    slides.forEach(s => io.observe(s));
  } else {
    // Non-slide pages (like install.html)
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.1 });
    $$('.rv').forEach(el => io.observe(el));
  }

  /* ---------- Scroll Progress Bar & Header State ---------- */
  const bar = $('#bar');
  const hd = $('#hd');
  let scrollTick = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (hd) hd.classList.toggle('s', y > 15);
    scrollTick = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Floating Docking Logo ---------- */
  const av = $('#av');
  const ph = $('#ph');
  const dock = $('#dock');
  const lw = $('#lw');

  if (av && ph && dock) {
    let M = {};
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function measureDock() {
      av.style.transform = 'none';
      const r = ph.getBoundingClientRect();
      const d = dock.getBoundingClientRect();
      M = {
        x0: r.left,
        y0: r.top + window.scrollY,
        x1: d.left,
        y1: d.top,
        s: d.width / Math.max(1, r.width)
      };
      av.style.width = r.width + 'px';
      av.style.height = r.width + 'px';
      M.D = Math.max(200, Math.min(window.innerHeight * 0.65, M.y0));
      placeDock();
    }

    function placeDock() {
      const y = window.scrollY;
      const p = Math.min(1, Math.max(0, y / M.D));
      const e = ease(p);
      const nat = M.y0 - y;
      const x = M.x0 + (M.x1 - M.x0) * e;
      const yy = nat + (M.y1 - nat) * e;
      const s = 1 + (M.s - 1) * e;
      av.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      if (lw) {
        lw.style.opacity = Math.max(0, (p - 0.5) / 0.5);
        lw.style.transform = 'translate3d(' + (-10 * (1 - p)).toFixed(1) + 'px,0,0)';
      }
    }

    window.addEventListener('scroll', () => requestAnimationFrame(placeDock), { passive: true });
    window.addEventListener('resize', measureDock);
    window.addEventListener('load', measureDock);
    if (document.fonts) document.fonts.ready.then(measureDock);
    measureDock();
  }

  /* ---------- Copy Command to Clipboard ---------- */
  $$('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy || btn.parentElement.querySelector('code')?.textContent || '';
      if (!text) return;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Kopyalandı! ✓';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove('copied');
        }, 2200);
      });
    });
  });

  /* ---------- Hero 3D Card Stack (Interactive Slide Deck) ---------- */
  const heroStack = $('.hero-stack');
  if (heroStack) {
    const cards = $$('.hs-card', heroStack);
    const dots = $$('.hs-dot', heroStack);
    let curIdx = 0;
    let autoTimer = null;
    let canHover = true;
    let hoverCooldown = null;

    function setSlot(idx) {
      if (!cards.length) return;
      curIdx = (idx + cards.length) % cards.length;

      // Temporarily throttle hover triggers during transition to prevent accidental cascade
      canHover = false;
      if (hoverCooldown) clearTimeout(hoverCooldown);
      hoverCooldown = setTimeout(() => { canHover = true; }, 320);

      cards.forEach((card, i) => {
        card.classList.remove('slot-front', 'slot-left', 'slot-right');
        const diff = (i - curIdx + cards.length) % cards.length;
        if (diff === 0) {
          card.classList.add('slot-front');
        } else if (diff === 1) {
          card.classList.add('slot-left');
        } else {
          card.classList.add('slot-right');
        }
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('on', i === curIdx);
      });
    }

    cards.forEach((card, i) => {
      // Hovering over any card slides it to the front
      card.addEventListener('mouseenter', () => {
        stopAuto();
        if (canHover && curIdx !== i) {
          setSlot(i);
        }
      });

      // Clicking a background card slides it to the front instead of opening lightbox
      card.addEventListener('click', (e) => {
        if (!card.classList.contains('slot-front')) {
          e.stopPropagation();
          e.preventDefault();
          stopAuto();
          setSlot(i);
        }
      }, true);
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        stopAuto();
        setSlot(i);
      });
      dot.addEventListener('mouseenter', () => {
        stopAuto();
        setSlot(i);
      });
    });

    // Touch swipe support (left / right)
    let touchStartX = 0;
    let touchStartY = 0;
    heroStack.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    heroStack.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          stopAuto();
          if (dx < 0) {
            setSlot(curIdx + 1);
          } else {
            setSlot(curIdx - 1);
          }
        }
      }
    }, { passive: true });

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => {
        if (!document.hidden) {
          setSlot(curIdx + 1);
        }
      }, 5000);
    }

    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    heroStack.addEventListener('mouseenter', stopAuto);
    heroStack.addEventListener('mouseleave', startAuto);

    setSlot(0);
    startAuto();
  }

  /* ---------- Lightbox Modal ---------- */
  const lightbox = $('#lightbox-modal');
  const lightboxImg = $('#lightbox-img');
  const lightboxCaption = $('#lightbox-caption');
  const lightboxClose = $('.lb-close') || $('.lightbox-close');

  if (lightbox && lightboxImg) {
    $$('.zoom-trigger, .pimg img, .pimg').forEach(el => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      if (!img) return;
      el.addEventListener('click', (e) => {
        // If clicking a background card in hero-stack, ignore lightbox
        if (el.classList.contains('hs-card') && !el.classList.contains('slot-front')) {
          return;
        }
        e.stopPropagation();
        lightbox.classList.add('active');
        lightboxImg.src = img.src;
        lightboxCaption.textContent = img.alt || el.closest('.pcard')?.querySelector('h4')?.textContent || '';
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lb-wrap')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
  }
});
