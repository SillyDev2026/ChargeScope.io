import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('static site has all required assets',()=>{
  for(const file of ['index.html','styles.css','app.js','core.mjs','devices.mjs','icon.svg','manifest.webmanifest','service-worker.js'])
    assert.ok(fs.statSync(new URL('../'+file,import.meta.url)).size>0,file);
});
test('calculator and comparison controls exist',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['calcForm','brandSelect','deviceSelect','batteryMah','wiredW','wirelessW','chargeMethod','chargerW','fromNumber','toNumber','temperature','activity','curve','compareResults','catalogGrid','shareLink','exportCSV']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/name="viewport"/);
  assert.match(html,/type="module" src="\.\/app\.js"/);
});
test('responsive and reduced-motion rules exist',()=>{
  const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/@media\(max-width:800px\)/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/prefers-reduced-motion/);
});
test('device presets are labelled examples',async()=>{
  const {DEVICES}=await import('../devices.mjs');
  assert.ok(DEVICES.length>=30);
  for(const d of DEVICES)assert.match(d.source,/example/i);
});
