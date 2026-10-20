import test from 'node:test';
import assert from 'node:assert/strict';
import {DEVICES} from '../devices.mjs';
import {recordRecent,normalizeRecents,normalizeWorkspace,searchPhones,MAX_RECENTS} from '../workspace.mjs';
import {estimateCharge} from '../core.mjs';
import {explainPowerLimit,rangeSummary} from '../charge-advice.mjs';

const ids=DEVICES.map(d=>d.id);
const moto=DEVICES.find(d=>d.id==='moto-razr-ultra-2026');
const opts={start:20,end:80,chargerW:30,cableW:60,method:'wired',compatibility:'matched',temperature:'normal',activity:'idle'};

test('phone finder matches tokens across brands, sorts exact name and respects limits',()=>{
  const list=searchPhones(DEVICES,'galaxy s26 ultra');
  assert.ok(list.length===1&&list[0].model==='Galaxy S26 Ultra');
  const pixel=searchPhones(DEVICES,'11 pro',{limit:15});
  assert.ok(pixel.every(d=>(d.brand+' '+d.model).toLowerCase().includes('11')&&d.model.toLowerCase().includes('pro')));
  assert.ok(searchPhones(DEVICES,'').length<=36);
  assert.deepEqual(searchPhones(DEVICES,'not-a-robot-phone'),[]);
});
test('favorites and recent devices rank above unselected general matches',()=>{
  const samsung=DEVICES.find(d=>d.model==='Galaxy S26 Ultra');
  const list=searchPhones(DEVICES,'',{favorites:[samsung.id],limit:10});
  assert.equal(list[0].id,samsung.id);
  const recent=searchPhones(DEVICES,'',{recent:[samsung.id],limit:10});
  assert.equal(recent[0].id,samsung.id);
});
test('recent phones are capped, deduplicated and validated against model IDs',()=>{
  let saved=[];
  for(const id of ids.slice(0,MAX_RECENTS+3))saved=recordRecent(saved,id,ids);
  assert.equal(saved.length,MAX_RECENTS);
  assert.equal(saved[0],ids[MAX_RECENTS+2]);
  assert.deepEqual(recordRecent(saved,'invalid-id',ids),saved);
  assert.equal(normalizeRecents(['invalid',ids[0],ids[0]],ids).length,1);
});
test('workspace restores valid preferences and rejects stale or malicious records',()=>{
  const restored=normalizeWorkspace({deviceId:moto.id,settings:{
    start:40,end:90,chargerW:45,cableW:'100',method:'wireless',compatibility:'unknown',temperature:'warm',activity:'gaming'
  }},ids);
  assert.equal(restored.deviceId,moto.id);
  assert.equal(restored.settings.chargerW,45);
  assert.equal(restored.settings.start,40);
  assert.equal(restored.settings.end,90);
  assert.equal(restored.settings.activity,'gaming');
  const invalid=normalizeWorkspace({deviceId:'deleted-model',settings:{
    start:99,end:-1,chargerW:'oops',cableW:'999',method:'rocket'
  }},ids);
  assert.equal(invalid.deviceId,null);
  assert.equal(invalid.settings.start,99);
  assert.equal(invalid.settings.end,100);
  assert.equal(invalid.settings.chargerW,30);
  assert.equal(invalid.settings.cableW,'60');
  assert.equal(invalid.settings.method,'wired');
});
test('charging power explanation identifies adapter, cable and phone caps',()=>{
  const base=estimateCharge(moto,opts);
  assert.match(explainPowerLimit(base).title,/charger/i);
  const cable=estimateCharge(moto,{...opts,chargerW:100,cableW:60});
  assert.match(explainPowerLimit(cable).title,/cable/i);
  const phone=estimateCharge(moto,{...opts,chargerW:100,cableW:100});
  assert.match(explainPowerLimit(phone).title,/phone/i);
  assert.match(explainPowerLimit(phone).detail,/not sustained/i);
  assert.match(rangeSummary(phone),/Razr Ultra 2026/);
});
test('wireless mode and unknown protocol produce honest limitations',()=>{
  const r=estimateCharge(moto,{...opts,method:'wireless',chargerW:50,compatibility:'unknown'});
  const explanation=explainPowerLimit(r);
  assert.match(explanation.title,/phone/i);
  assert.match(explanation.detail,/compatibility is unknown/i);
  assert.match(explainPowerLimit(null).title,/explanation/);
});
