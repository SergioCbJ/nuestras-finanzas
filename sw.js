/* Service worker de "Nuestras Finanzas": guarda el "cascarón" de la app (el
   HTML, el manifest y los iconos) y el SDK de Firebase, para que abra al instante
   y funcione sin conexión. Los DATOS (Firestore) NUNCA pasan por esta caché: las
   peticiones a la base de datos van siempre a la red (Firestore ya guarda su
   propia copia en el móvil). */
const CACHE_NAME = 'nuestras-finanzas-v3';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
// El SDK va con su versión en la URL: nunca cambia, así que se sirve de la caché.
// Si algún día se cambia la versión en index.html, cambiarla también aquí.
const SDK_PREFIX = 'https://www.gstatic.com/firebasejs/';
const SDK_FILES = ['firebase-app.js', 'firebase-firestore.js', 'firebase-auth.js'].map(f => SDK_PREFIX + '12.17.1/' + f);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES)
        // Sin conexión al instalar, el SDK se guardará la próxima vez que se descargue.
        .then(() => cache.addAll(SDK_FILES).catch(() => {})))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res){
  if(res && (res.status === 200 || res.type === 'opaque')){
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  // SDK de Firebase: caché primero (las versiones no cambian).
  if(url.href.startsWith(SDK_PREFIX)){
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => guardar(req, res))));
    return;
  }

  if(url.origin !== self.location.origin) return; // Firestore y demás: siempre a la red

  // La página en sí: red primero. Así, en cuanto se sube una versión nueva a GitHub,
  // se ve al abrir la app; la copia guardada solo se usa si no hay conexión.
  if(req.mode === 'navigate' || req.destination === 'document'){
    event.respondWith(
      fetch(req).then((res) => guardar(req, res))
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // El resto del cascarón (manifest, iconos): caché primero con refresco en segundo plano.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => guardar(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
