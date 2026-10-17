var C='cropweather-v8-illustrated',F=['./','index.html','style.css','app.js','calc.js','sim.js','scene.js','data/weather.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(F.map(function(u){return new Request(u,{cache:'reload'})}))}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
// Network first, bypassing the browser HTTP cache (GitHub Pages sends max-age=600), with the offline cache as fallback.
self.addEventListener('fetch',function(e){if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(function(r){if(r.ok){var c=r.clone();caches.open(C).then(function(x){x.put(e.request,c)})}return r}).catch(function(){return caches.match(e.request,{ignoreSearch:true})}))});
