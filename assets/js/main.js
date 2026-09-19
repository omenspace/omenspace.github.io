document.addEventListener('DOMContentLoaded', () => {
    // i18n Logic
    const langDropdown = document.getElementById('lang-dropdown');
    const langToggle = document.getElementById('lang-toggle');
    const currentLangText = document.getElementById('current-lang');
    const langOptions = document.querySelectorAll('.dropdown-menu a');
    
    function setLanguage(lang) {
        if (!translations[lang]) lang = 'en'; // fallback
        localStorage.setItem('omenspace-lang', lang);
        document.documentElement.lang = lang;
        
        // Update UI
        if (currentLangText) currentLangText.textContent = lang.toUpperCase();
        
        langOptions.forEach(opt => {
            if (opt.getAttribute('data-lang') === lang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });
        
        if (translations[lang] && translations[lang]["title"]) {
            document.title = translations[lang]["title"];
        }
    }

    // Initialize Language
    let currentLang = localStorage.getItem('omenspace-lang');
    if (!currentLang) {
        currentLang = (navigator.language || navigator.userLanguage).substring(0, 2);
    }
    setLanguage(currentLang);

    // Dropdown events
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });
        
        langOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                setLanguage(opt.getAttribute('data-lang'));
                langDropdown.classList.remove('active');
            });
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!langDropdown.contains(e.target)) {
                langDropdown.classList.remove('active');
            }
        });
    }

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('omenspace-theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            let newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            
            localStorage.setItem('omenspace-theme', newTheme);
        });
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const headerMenu = document.getElementById('header-menu');
    
    if (mobileMenuBtn && headerMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            headerMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (headerMenu.classList.contains('active') && !headerMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                headerMenu.classList.remove('active');
            }
        });

        // Close menu when clicking a link
        const navLinksAnchor = headerMenu.querySelectorAll('.nav-links a');
        navLinksAnchor.forEach(link => {
            link.addEventListener('click', () => {
                headerMenu.classList.remove('active');
            });
        });
    }

    // Sticky Navbar Logic
    const navbar = document.querySelector('.header');
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        // Top Navbar Style
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScrollY = window.scrollY;
    });

    // Intersection Observer for Scroll Animations (Reveal)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(reveal => {
        observer.observe(reveal);
    });

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Approximate navbar height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');

    // Select all images that should be clickable
    const images = document.querySelectorAll('.feature-img img, .alt-card-img, .hero-3d-composition img');

    images.forEach(img => {
        img.addEventListener('click', function() {
            lightbox.classList.add('active');
            lightboxImg.src = this.src;
            
            // Get caption from alt text
            let captionText = this.alt;
            
            // If it's a feature card, try to get the detailed paragraph text for a better description
            if (this.closest('.feature-card')) {
                const p = this.closest('.feature-card').querySelector('p');
                if (p) captionText = p.textContent;
            } else if (this.closest('.alt-card')) {
                const p = this.closest('.alt-card').querySelector('p');
                if (p) captionText = p.textContent;
            }
            
            lightboxCaption.textContent = captionText || '';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        // Wait for transition before hiding image source
        setTimeout(() => {
            if (!lightbox.classList.contains('active')) {
                lightboxImg.src = '';
            }
        }, 300);
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    closeBtn.addEventListener('click', closeLightbox);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === document.querySelector('.lightbox-content-wrapper')) {
            closeLightbox();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });




});
