/* Service worker de "Nuestras Finanzas": guarda el "cascarón" de la app
   (el HTML/manifest/iconos) para que abra al instante y funcione sin
   conexión. Los datos (Firestore) NUNCA pasan por esta caché: cualquier
   petición que no sea del propio sitio va directa a la red. */
const CACHE_NAME = 'nuestras-finanzas-v2';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // Firebase/Firestore: siempre a la red

  // El HTML de la app (la página en sí): red primero. Así, en cuanto subas una
  // versión nueva a GitHub, se ve al recargar -- la copia guardada solo se usa
  // si de verdad no hay conexión. Antes esto iba caché-primero y una versión
  // vieja se podía quedar "pegada" indefinidamente aunque subieras un archivo
  // nuevo; así ya no puede volver a pasar.
  if(req.mode === 'navigate' || req.destination === 'document'){
    event.respondWith(
      fetch(req).then((res) => {
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // El resto del cascarón (manifest, iconos): caché primero (cambian poquísimo)
  // con refresco en segundo plano.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
