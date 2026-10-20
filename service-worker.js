const CACHE='chargescope-v2.0.0';
const ASSETS=['./','./index.html','./styles.css','./core.mjs','./devices.mjs','./app.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('chargescope-')&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok && response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});