const CACHE_NAME = 'teletrabajo-capitulaciones-v24';

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
  console.log('Service Worker v24: Installing...');
  console.log('Base URL:', baseUrl);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker v24: Caching files');
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
        console.log('Service Worker v24: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activar service worker y limpiar cachés antiguas
self.addEventListener('activate', event => {
  console.log('Service Worker v24: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker v24: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker v24: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Permite que la página fuerce la actualización inmediata
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ¿La petición es del propio index.html?
function esDocumentoApp(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return url.pathname === baseUrl || url.pathname === baseUrl + 'index.html';
}

// Interceptar peticiones
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // EL HTML VA SIEMPRE A LA RED PRIMERO.
  // Así, en cuanto se sube una versión nueva a GitHub Pages, el claustro la recibe
  // sin tener que borrar la caché. Si no hay conexión, tira de la copia guardada.
  if (esDocumentoApp(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copia));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(r => r || caches.match(baseUrl + 'index.html'))
        )
    );
    return;
  }

  // El resto (iconos, manifest, librerías): caché primero, más rápido
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(
          response => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
