const CACHE_NAME = 'teletrabajo-capitulaciones-v5';

// Obtener la ruta base de la app
const getBaseUrl = () => {
  const url = new URL(self.location.href);
  const path = url.pathname;
  // Si termina en sw.js, obtener el directorio padre
  return path.substring(0, path.lastIndexOf('/') + 1);
};

const baseUrl = getBaseUrl();

const urlsToCache = [
  baseUrl,
  baseUrl + 'index.html',
  baseUrl + 'manifest.json',
  baseUrl + 'icon-192.png',
  baseUrl + 'icon-512.png',
  baseUrl + 'icon-180.png'
];

// Instalar service worker y cachear archivos
self.addEventListener('install', event => {
  console.log('Service Worker v5: Installing...');
  console.log('Base URL:', baseUrl);
  console.log('URLs to cache:', urlsToCache);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker v5: Caching files');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Error caching files:', err);
          // Intentar cachear uno por uno
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url).catch(err => {
                console.error('Failed to cache:', url, err);
              });
            })
          );
        });
      })
      .then(() => {
        console.log('Service Worker v5: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activar service worker y limpiar cachés antiguas
self.addEventListener('activate', event => {
  console.log('Service Worker v5: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker v5: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker v5: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones y servir desde caché
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});
