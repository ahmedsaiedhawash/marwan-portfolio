// =========================
// RENDERER.JS — Dynamic Content Loader + Auto Gallery
// =========================
// يقرأ هذا السكربت ملف JSON منفصل حسب لغة الصفحة:
//   - اللغة الإنجليزية (lang="en") → data-en.json
//   - اللغة العربية (lang="ar")     → data-ar.json
//
// كما يجلب صور المعرض تلقائياً من GitHub Contents API:
//   https://api.github.com/repos/{USER}/{REPO}/contents/gallery
//
// العناصر في HTML التي تُملأ تلقائياً:
// - data-i18n="path.to.key"           → لملء النص (textContent)
// - data-i18n-attr="attr:key|attr:key" → لملء سمات مثل href أو alt
// - data-career-items                  → حاوية تُبنى ديناميكياً لعناصر الخبرات
// - data-skills-grid                   → حاوية تُبنى ديناميكياً لشبكة المهارات
// - data-contact-items                 → حاوية تُبنى ديناميكياً لبطاقات التواصل
// - data-about-paragraphs              → حاوية فقرات "نبذة عني"
// - data-about-info                    → حاوية بطاقة المعلومات
// - data-education                     → حاوية قسم التعليم
// - data-hero-name                     → اسم البطل (يحتوي على <br><span>)
// - data-gallery-grid                  → حاوية معرض الصور (تلقائي)
// - data-gallery-status                → نص حالة التحميل
// - data-footer-copyright              → نص حقوق النشر
// - data-footer-tagline                → السطر التعريفي في الفوتر
// - data-whatsapp-title / -desc / -btn / -link / -tooltip → عناصر بانر الواتساب

(function () {
    'use strict';

    // =========================
    // إعدادات GitHub (لتحديد مستودع المعرض)
    // =========================
    const GITHUB_USER = 'ahmedsaiedhawash';
    const GITHUB_REPO = 'marwan-portfolio';
    const GITHUB_BRANCH = 'main';
    const GALLERY_FOLDER = 'gallery';

    const GALLERY_API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GALLERY_FOLDER}?ref=${GITHUB_BRANCH}`;

    // امتدادات الصور المسموح بها في المعرض
    const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

    // =========================
    // تحديد اللغة والملف المناسب
    // =========================
    const LANG = (document.documentElement.lang || 'en').split('-')[0];

    const DATA_FILES = {
        en: 'data-en.json',
        ar: 'data-ar.json'
    };

    const DATA_FILE = DATA_FILES[LANG] || DATA_FILES.en;

    // =========================
    // أيقونات التواصل (SVG)
    // =========================
    const CONTACT_ICONS = {
        instagram: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        email: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        phone: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
    };

    // =========================
    // دوال مساعدة
    // =========================
    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => {
            return (acc && acc[key] !== undefined) ? acc[key] : undefined;
        }, obj);
    }

    function escapeHtml(str) {
        if (str === undefined || str === null) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    function getExtension(filename) {
        const parts = String(filename).toLowerCase().split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    // =========================
    // الدالة الرئيسية
    // =========================
    async function render() {
        let dict;

        try {
            const res = await fetch(DATA_FILE);
            if (!res.ok) throw new Error(`Failed to load ${DATA_FILE}`);
            dict = await res.json();
        } catch (err) {
            console.error(`[Renderer] Error loading ${DATA_FILE}:`, err);
            return;
        }

        if (!dict) return;

        try {
            applyMeta(dict);
            populateStatic(dict);
            populateHero(dict);
            populateAbout(dict);
            populateCareer(dict);
            populateEducation(dict);
            populateSkills(dict);
            populateContact(dict);
            populateFooter(dict);

            // ⚠️ المعرض يحتاج dict (للترجمات)
            loadGallery(dict);

            // إعادة تهيئة المكونات التفاعلية
            reinitLightbox();
            reinitReveal();

            // السنة الحالية
            const yearEl = document.getElementById('currentYear');
            if (yearEl) yearEl.textContent = new Date().getFullYear();

            document.dispatchEvent(new CustomEvent('dataRendered', { detail: { lang: LANG, file: DATA_FILE } }));
        } catch (err) {
            console.error('[Renderer] Error rendering data:', err);
        }
    }

    // =========================
    // Meta
    // =========================
    function applyMeta(dict) {
        if (!dict.meta) return;
        if (dict.meta.title) document.title = dict.meta.title;

        const desc = document.querySelector('meta[name="description"]');
        if (desc && dict.meta.description) desc.setAttribute('content', dict.meta.description);

        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor && dict.meta.theme_color) themeColor.setAttribute('content', dict.meta.theme_color);

        const keywords = document.querySelector('meta[name="keywords"]');
        if (keywords && dict.meta.keywords) keywords.setAttribute('content', dict.meta.keywords);
    }

    // =========================
    // data-i18n و data-i18n-attr
    // =========================
    function populateStatic(dict) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = getNestedValue(dict, key);
            if (value !== undefined) el.textContent = value;
        });

        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attrs = el.getAttribute('data-i18n-attr').split('|');
            attrs.forEach(pair => {
                const parts = pair.split(':');
                if (parts.length !== 2) return;
                const attr = parts[0].trim();
                const key = parts[1].trim();
                const value = getNestedValue(dict, key);
                if (value !== undefined) el.setAttribute(attr, value);
            });
        });
    }

    // =========================
    // Hero
    // =========================
    function populateHero(dict) {
        const h = dict.hero;
        if (!h) return;

        const nameEl = document.querySelector('[data-hero-name]');
        if (nameEl && h.name_line1 && h.name_line2) {
            nameEl.innerHTML = `${escapeHtml(h.name_line1)}<br><span>${escapeHtml(h.name_line2)}</span>`;
        }
    }

    // =========================
    // About
    // =========================
    function populateAbout(dict) {
        const a = dict.about;
        if (!a) return;

        const parasContainer = document.querySelector('[data-about-paragraphs]');
        if (parasContainer && Array.isArray(a.paragraphs)) {
            parasContainer.innerHTML = a.paragraphs
                .map(p => `<p>${escapeHtml(p)}</p>`)
                .join('');
        }

        const infoContainer = document.querySelector('[data-about-info]');
        if (infoContainer && Array.isArray(a.info)) {
            infoContainer.innerHTML = a.info.map(item => `
                <div class="info-item">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                </div>
            `).join('');
        }
    }

    // =========================
    // Career (بدون خلفيات صور)
    // =========================
    function populateCareer(dict) {
        const c = dict.career;
        if (!c) return;

        const container = document.querySelector('[data-career-items]');
        if (!container || !Array.isArray(c.items)) return;

        container.innerHTML = c.items.map(item => {
            const tagsHtml = (Array.isArray(item.tags) && item.tags.length)
                ? `<div class="tags">${item.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
                : '';

            return `
                <article class="timeline-item reveal">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">${escapeHtml(item.date)}</div>
                        <h3>${escapeHtml(item.job_title)}</h3>
                        <h4>${escapeHtml(item.company)}</h4>
                        <p>${escapeHtml(item.description)}</p>
                        ${tagsHtml}
                    </div>
                </article>
            `;
        }).join('');
    }

    // =========================
    // Education
    // =========================
    function populateEducation(dict) {
        const e = dict.education;
        if (!e) return;

        const container = document.querySelector('[data-education]');
        if (!container) return;

        container.innerHTML = `
            <div class="education-year">${escapeHtml(e.year)}</div>
            <div>
                <h3>${escapeHtml(e.degree)}</h3>
                <h4>${escapeHtml(e.field)}</h4>
                <p>${escapeHtml(e.school)}</p>
                <div class="education-stats">
                    ${(e.stats || []).map(s => `<span>${escapeHtml(s)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // =========================
    // Skills
    // =========================
    function populateSkills(dict) {
        const s = dict.skills;
        if (!s) return;

        const container = document.querySelector('[data-skills-grid]');
        if (!container || !Array.isArray(s.groups)) return;

        container.innerHTML = s.groups.map(g => `
            <div class="skill-group reveal">
                <h3>${escapeHtml(g.title)}</h3>
                <div class="skill-list">
                    ${(g.items || []).map(item => `<span>${escapeHtml(item)}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    // =========================
    // Contact
    // =========================
    function populateContact(dict) {
        const c = dict.contact;
        if (!c) return;

        const container = document.querySelector('[data-contact-items]');
        if (container && Array.isArray(c.items)) {
            container.innerHTML = c.items.map(item => `
                <a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer"
                   class="contact-card contact-${escapeHtml(item.platform)} reveal"
                   aria-label="${escapeHtml(item.title)}">
                    <span class="contact-icon" aria-hidden="true">${CONTACT_ICONS[item.platform] || ''}</span>
                    <div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.value)}</p>
                    </div>
                </a>
            `).join('');
        }

        if (c.whatsapp) {
            const t = document.querySelector('[data-whatsapp-title]');
            const d = document.querySelector('[data-whatsapp-desc]');
            const b = document.querySelector('[data-whatsapp-btn]');
            const link = document.querySelector('[data-whatsapp-link]');
            const tooltip = document.querySelector('[data-whatsapp-tooltip]');
            const floatLink = document.querySelector('.floating-whatsapp');

            if (t) t.textContent = c.whatsapp.title;
            if (d) d.textContent = c.whatsapp.description;
            if (b) b.textContent = c.whatsapp.button;
            if (link) link.setAttribute('href', c.whatsapp.href);
            if (floatLink) floatLink.setAttribute('href', c.whatsapp.href);
            if (tooltip) tooltip.textContent = c.whatsapp.tooltip;
        }
    }

    // =========================
    // Footer
    // =========================
    function populateFooter(dict) {
        const f = dict.footer;
        if (!f) return;

        const copyright = document.querySelector('[data-footer-copyright]');
        const tagline = document.querySelector('[data-footer-tagline]');
        if (copyright) copyright.textContent = f.copyright;
        if (tagline) tagline.textContent = f.tagline;
    }

    // =========================
    // 📸 GALLERY — Auto Load from GitHub Contents API
    // =========================
    async function loadGallery(dict) {
        const container = document.querySelector('[data-gallery-grid]');
        const status = document.querySelector('[data-gallery-status]');

        if (!container) return;

        const galleryText = (dict && dict.gallery) || {};
        const loadingText = galleryText.loading || 'Loading images...';
        const emptyText = galleryText.empty || 'No images in the gallery yet.';
        const errorText = galleryText.error || 'Failed to load images.';
        const viewFullText = galleryText.view_full || 'View Full';

        if (status) {
            status.textContent = loadingText;
            status.classList.remove('error');
        }

        try {
            const res = await fetch(GALLERY_API, {
                headers: { 'Accept': 'application/vnd.github+json' }
            });

            if (!res.ok) {
                throw new Error(`GitHub API returned ${res.status}`);
            }

            const files = await res.json();

            // فلترة الصور فقط
            const images = Array.isArray(files)
                ? files.filter(file => {
                    if (!file || file.type !== 'file') return false;
                    const ext = getExtension(file.name);
                    return ALLOWED_EXTS.includes(ext);
                })
                : [];

            // ترتيب أبجدي (يقدر يتحكم فيه مروان بتسمية الصور 01-, 02-, إلخ)
            images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            // إزالة رسالة الحالة
            if (status) status.remove();

            if (images.length === 0) {
                container.innerHTML = `<p class="gallery-status">${escapeHtml(emptyText)}</p>`;
                return;
            }

            container.innerHTML = images.map((file, idx) => {
                // نستخدم download_url المباشر من الـ API (أسرع من raw.githubusercontent)
                const imgUrl = file.download_url;
                const alt = `Gallery image ${idx + 1}`;

                return `
                    <div class="gallery-item reveal" role="button" tabindex="0" aria-label="${escapeHtml(alt)}">
                        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(alt)}" loading="lazy">
                    </div>
                `;
            }).join('');

            // إعادة تهيئة الـ lightbox ليشمل الصور الجديدة
            reinitLightbox();
            reinitReveal();

        } catch (err) {
            console.error('[Gallery] Error loading images:', err);

            if (status) {
                status.textContent = errorText;
                status.classList.add('error');
            } else {
                container.innerHTML = `<p class="gallery-status error">${escapeHtml(errorText)}</p>`;
            }
        }
    }

    // =========================
    // إعادة تهيئة معرض الصور (Lightbox)
    // =========================
    function reinitLightbox() {
        if (typeof window.reinitGalleryLightbox === 'function') {
            window.reinitGalleryLightbox();
        }
    }

    // =========================
    // إعادة تهيئة ظهور العناصر (Reveal)
    // =========================
    function reinitReveal() {
        const els = document.querySelectorAll('.reveal');
        if (!els.length) return;

        if (!('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        els.forEach(el => {
            if (!el.classList.contains('revealed')) observer.observe(el);
        });
    }

    // =========================
    // الإقلاع
    // =========================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }

    // للاستخدام الخارجي (Debugging)
    window.__renderer = {
        render,
        getNestedValue,
        DATA_FILE,
        LANG,
        GALLERY_API
    };
})();