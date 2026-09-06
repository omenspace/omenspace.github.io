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
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const themeIconSun = document.getElementById('theme-icon-sun');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('omenspace-theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIconMoon.style.display = 'none';
        themeIconSun.style.display = 'block';
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = 'dark';
            
            if (!currentTheme || currentTheme === 'dark') {
                newTheme = 'light';
                themeIconMoon.style.display = 'none';
                themeIconSun.style.display = 'block';
            } else {
                themeIconSun.style.display = 'none';
                themeIconMoon.style.display = 'block';
            }
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('omenspace-theme', newTheme);
        });
    }

    // Sticky Navbar & Mobile Menu Logic
    const navbar = document.getElementById('navbar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

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
    const images = document.querySelectorAll('.card-image-container img, .showcase-image img, .hero-image');

    images.forEach(img => {
        img.addEventListener('click', function() {
            lightbox.classList.add('active');
            lightboxImg.src = this.src;
            
            // Get caption from alt text
            let captionText = this.alt;
            
            // If it's a card, try to get the detailed paragraph text for a better description
            if (this.closest('.card')) {
                const p = this.closest('.card').querySelector('p');
                if (p) captionText = p.textContent;
            } else if (this.closest('.showcase-image')) {
                // For showcase, grab the main text
                const p = document.querySelector('.showcase-text p');
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

    // Install Modal Logic
    const installModal = document.getElementById('install-modal');
    const openInstallBtns = document.querySelectorAll('.open-install');
    const closeInstallBtn = document.querySelector('.install-close');

    if (installModal) {
        openInstallBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                installModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        const closeInstallModal = () => {
            installModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        if (closeInstallBtn) {
            closeInstallBtn.addEventListener('click', closeInstallModal);
        }

        installModal.addEventListener('click', (e) => {
            if (e.target === installModal || e.target === installModal.querySelector('.lightbox-content-wrapper')) {
                closeInstallModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && installModal.classList.contains('active')) {
                closeInstallModal();
            }
        });
    }
});
