// =========================
// SERVICE WORKER — sw.js
// =========================
// يوفر هذا الملف:
// 1. تخزين مؤقت للملفات الأساسية (Offline Support).
// 2. استراتيجية Cache First للملفات الثابتة (CSS, JS, JSON).
// 3. Network First للصفحات (HTML).
// 4. Stale While Revalidate للصور (بما فيها صور المعرض).
//
// ⚠️ عند تحديث الموقع، قم بتغيير CACHE_VERSION
// لكي يرى المتصفح الملفات الجديدة.
//
// ⚠️ ملاحظة: هذا الملف مكتوب ليعمل من subfolder
// (مثل /marwan-portfolio/) بدون مشاكل — كل المسارات نسبية.

const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// =========================
// الملفات التي تُخزَّن مسبقاً (Pre-cache)
// =========================
// ⚠️ نستخدم './' بدل '/' عشان الموقع في subfolder.
// ⚠️ لا نضع صور المعرض هنا — بتُجلب ديناميكياً من GitHub API.
const PRECACHE_URLS = [
    './',
    './index.html',
    './ar.html',
    './404.html',
    './style.css',
    './script.js',
    './renderer.js',
    './manifest.json',
    './data-en.json',
    './data-ar.json',
    './robots.txt',
    './sitemap.xml',
    './images/favicon.png',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/marwan-gomaa.jpg'
];

// =========================
// INSTALL EVENT
// =========================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                // نستخدم addAll لكن مع تجاوز الأخطاء الفردية
                // (لو صورة مش موجودة، مايوقفش التثبيت كله)
                return Promise.allSettled(
                    PRECACHE_URLS.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[SW] Failed to precache:', url, err);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// =========================
// ACTIVATE EVENT
// =========================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(name =>
                            name !== STATIC_CACHE &&
                            name !== IMAGE_CACHE &&
                            name !== RUNTIME_CACHE
                        )
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// =========================
// FETCH EVENT
// =========================
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // تجاهل الطلبات غير GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // تجاهل الطلبات الخارجية (Google Fonts, GA, إلخ)
    // لكن اسمح بـ GitHub API وصور المعرض من githubusercontent
    const isGitHubAPI = url.hostname === 'api.github.com';
    const isGitHubImages = url.hostname === 'raw.githubusercontent.com' ||
                           url.hostname.includes('githubusercontent.com');

    if (url.origin !== self.location.origin && !isGitHubImages) {
        // تجاهل GitHub API — نسيبه يجيب من الشبكة مباشرة
        if (isGitHubAPI) return;
        // تجاهل أي origin تاني (Fonts, Analytics, Web3Forms)
        return;
    }

    // تجاهل طلبات Web3Forms API
    if (url.hostname.includes('web3forms')) return;

    // استراتيجية خاصة للصور (بما فيها صور المعرض من githubusercontent)
    if (request.destination === 'image' || isGitHubImages) {
        event.respondWith(handleImageRequest(request));
        return;
    }

    // استراتيجية خاصة لملفات CSS/JS/JSON
    if (request.destination === 'style' ||
        request.destination === 'script' ||
        url.pathname.endsWith('.json') ||
        url.pathname.endsWith('.xml') ||
        url.pathname.endsWith('.txt')) {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // استراتيجية لصفحات HTML
    if (request.destination === 'document' || request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // الباقي: stale-while-revalidate
    event.respondWith(handleGeneralRequest(request));
});

// =========================
// استراتيجية الصور: Cache First + تحديث في الخلفية
// =========================
async function handleImageRequest(request) {
    // استخدم كاش منفصل للصور
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);

    if (cached) {
        // تحديث في الخلفية (بدون انتظار)
        fetch(request).then(response => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
        }).catch(() => { /* أوفلاين — تجاهل */ });
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // صورة بديلة فاضية في حالة الفشل
        return new Response('', {
            status: 404,
            statusText: 'Image not available offline'
        });
    }
}

// =========================
// استراتيجية الملفات الثابتة: Cache First
// =========================
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // fallback لصفحة 404 لو الصفحة مش متخزنة
        const fallback = await caches.match('./404.html');
        if (fallback) return fallback;
        return new Response('Offline', { status: 503 });
    }
}

// =========================
// استراتيجية التنقل (HTML): Network First
// =========================
async function handleNavigationRequest(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // في حالة عدم الاتصال: حاول من الكاش
        const cached = await caches.match(request);
        if (cached) return cached;

        // فشل كل شيء: صفحة 404
        const offlinePage = await caches.match('./404.html');
        if (offlinePage) return offlinePage;

        return new Response(
            '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
        );
    }
}

// =========================
// الاستراتيجية العامة: Stale While Revalidate
// =========================
async function handleGeneralRequest(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// =========================
// MESSAGE EVENT — للتحكم من الصفحة
// =========================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(names => {
            Promise.all(names.map(name => caches.delete(name)))
                .then(() => {
                    event.ports[0]?.postMessage({ success: true });
                });
        });
    }
});

console.log(`[SW] Service Worker loaded. Version: ${CACHE_VERSION}`);