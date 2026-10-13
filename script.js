// =========================
// SCRIPT.JS — Core Interactions + Gallery Lightbox
// =========================
// يعمل هذا الملف مع index.html و ar.html و renderer.js
// يوفّر: تبديل الثيم، القائمة، شريط التقدم، معرض الصور (Lightbox)،
//         حفظ اللغة، Service Worker، Smooth Scroll.
//
// ⚠️ ملاحظة: تم إزالة كود نموذج التواصل (Web3Forms) بناءً على طلب التعديل.

(function () {
    'use strict';

    // =========================
    // THEME TOGGLE (DARK MODE)
    // =========================
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    (function initTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                htmlElement.setAttribute('data-theme', 'dark');
            }
        } catch (e) { /* localStorage may be disabled */ }
    })();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                htmlElement.removeAttribute('data-theme');
                try { localStorage.setItem('theme', 'light'); } catch (e) { }
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                try { localStorage.setItem('theme', 'dark'); } catch (e) { }
            }
        });
    }

    // =========================
    // LANGUAGE PREFERENCE
    // =========================
    (function saveLangPreference() {
        try {
            const currentLang = (document.documentElement.lang || 'en').split('-')[0];
            localStorage.setItem('preferred-lang', currentLang);
        } catch (e) { }
    })();

    // =========================
    // MOBILE NAVIGATION
    // =========================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('active') ? 'true' : 'false');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (
                navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !menuToggle.contains(e.target)
            ) {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // =========================
    // CURRENT YEAR
    // =========================
    const currentYear = document.getElementById('currentYear');
    if (currentYear) currentYear.textContent = new Date().getFullYear();

    // =========================
    // READING PROGRESS BAR
    // =========================
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    progressBar.style.width = progress + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // =========================
    // ACTIVE NAVIGATION ON SCROLL
    // =========================
    const sections = document.querySelectorAll('section[id]');
    const navigationLinks = document.querySelectorAll('.nav-links a');

    if (sections.length && navigationLinks.length) {
        let navTicking = false;
        window.addEventListener('scroll', () => {
            if (!navTicking) {
                window.requestAnimationFrame(() => {
                    let currentSection = '';
                    sections.forEach(section => {
                        const sectionTop = section.offsetTop - 120;
                        const sectionHeight = section.offsetHeight;
                        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                            currentSection = section.getAttribute('id');
                        }
                    });
                    navigationLinks.forEach(link => {
                        const isActive = link.getAttribute('href') === `#${currentSection}`;
                        link.classList.toggle('active', isActive);
                        if (isActive) link.setAttribute('aria-current', 'page');
                        else link.removeAttribute('aria-current');
                    });
                    navTicking = false;
                });
                navTicking = true;
            }
        }, { passive: true });
    }

    // =========================
    // BACK TO TOP BUTTON
    // =========================
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        let bttTicking = false;
        window.addEventListener('scroll', () => {
            if (!bttTicking) {
                window.requestAnimationFrame(() => {
                    backToTop.classList.toggle('visible', window.scrollY > 600);
                    bttTicking = false;
                });
                bttTicking = true;
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================
    // SCROLL REVEAL (Fallback)
    // =========================
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('revealed'));
    }

    // =========================
    // GALLERY LIGHTBOX
    // =========================
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');

    let galleryItems = [];
    let currentIndex = 0;

    function refreshGalleryItems() {
        galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    }

    function getImageFromItem(item) {
        return item ? item.querySelector('img') : null;
    }

    function updateLightbox(index) {
        if (!galleryItems.length || !lightboxImage) return;
        currentIndex = (index + galleryItems.length) % galleryItems.length;
        const img = getImageFromItem(galleryItems[currentIndex]);
        if (!img) return;

        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt || 'Gallery image';

        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
        }

        const many = galleryItems.length > 1;
        if (lightboxPrev) lightboxPrev.style.display = many ? 'grid' : 'none';
        if (lightboxNext) lightboxNext.style.display = many ? 'grid' : 'none';
    }

    function openLightbox(index) {
        if (!lightbox || !lightboxImage) return;
        updateLightbox(index);
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function showNext() { updateLightbox(currentIndex + 1); }
    function showPrev() { updateLightbox(currentIndex - 1); }

    function bindGalleryEvents() {
        galleryItems.forEach((item, index) => {
            if (item.dataset.bound === 'true') return;
            item.dataset.bound = 'true';

            item.addEventListener('click', () => openLightbox(index));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(index);
                }
            });
        });
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', showNext);
    if (lightboxPrev) lightboxPrev.addEventListener('click', showPrev);

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    // =========================
    // EXPOSE REINIT FOR renderer.js
    // =========================
    window.reinitGalleryLightbox = function () {
        refreshGalleryItems();
        bindGalleryEvents();
    };

    // التشغيل الأولي
    refreshGalleryItems();
    bindGalleryEvents();

    // =========================
    // FLOATING WHATSAPP — DELAYED APPEARANCE
    // =========================
    const floatingWhatsapp = document.querySelector('.floating-whatsapp');
    if (floatingWhatsapp) {
        floatingWhatsapp.style.opacity = '0';
        floatingWhatsapp.style.transform = 'scale(0.5)';
        floatingWhatsapp.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        setTimeout(() => {
            floatingWhatsapp.style.opacity = '1';
            floatingWhatsapp.style.transform = 'scale(1)';
        }, 1200);
    }

    // =========================
    // SERVICE WORKER (PWA Offline Support)
    // =========================
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('[SW] Registered:', reg.scope))
                .catch(err => console.warn('[SW] Registration failed:', err));
        });
    }

    // =========================
    // SIMPLE ERROR TRACKING (via GA4 if available)
    // =========================
    window.addEventListener('error', (e) => {
        if (typeof gtag === 'function') {
            gtag('event', 'exception', {
                description: e.message + ' @ ' + e.filename + ':' + e.lineno,
                fatal: false
            });
        }
    });

    // =========================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // =========================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const header = document.querySelector('.header');
            const offset = header ? header.offsetHeight + 10 : 80;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        });
    });

})();