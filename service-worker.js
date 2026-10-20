/* ChargeScope v3.2: scope-limited caching with correct offline behavior. */
const CACHE='chargescope-v3.2.0';
const ASSETS=['./','./index.html','./styles.css','./core.mjs','./planner.mjs','./lab.mjs','./lab-ui.mjs','./devices.mjs','./official-specs.mjs','./spec-view.mjs','./catalog-directory.mjs','./catalog-utils.mjs','./app.js','./icon.svg','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('chargescope-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // Cache only this app's own files, not arbitrary same-origin resources.
  if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>response.ok?response:Promise.reject(new Error('Navigation offline')))
      .catch(async()=>await caches.match('./index.html')||Response.error()));
    return;
  }
  const path=url.pathname.split('/').pop();
  if(!ASSETS.some(asset=>asset.split('/').pop()===path))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));
    }
    return response;
  }).catch(async()=>await caches.match(request)||Response.error()));
});
