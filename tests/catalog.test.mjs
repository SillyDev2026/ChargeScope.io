import test from 'node:test';
import assert from 'node:assert/strict';
import {DEVICES} from '../devices.mjs';
import {DIRECTORY,VERIFIED_2026} from '../catalog-directory.mjs';
import {CATALOG_PAGE_SIZE,catalogStatistics,queryCatalog,hasChargeSpecs} from '../catalog-utils.mjs';

test('2024, 2025 and 2026 device catalog is broad and uniquely keyed',()=>{
  const stats=catalogStatistics(DEVICES);
  assert.ok(stats.total>=145,'catalog should contain at least 145 phone models');
  assert.ok(stats.brands>=17,'cover at least 17 distinct brands');
  for(const y of [2024,2025,2026])assert.ok(stats.years[y]>=12,'release year '+y+' needs entries');
  assert.equal(new Set(DEVICES.map(d=>d.id)).size,DEVICES.length,'IDs must remain unique');
  assert.equal(new Set(DEVICES.map(d=>(d.brand+'|'+d.model).toLowerCase())).size,DEVICES.length,'avoid duplicate model cards');
  assert.ok(CATALOG_PAGE_SIZE>=12&&CATALOG_PAGE_SIZE<=36);
});
test('no directory-only entry invents charge wattages',()=>{
  for(const d of DIRECTORY) {
    assert.equal(d.wiredW,null);
    assert.equal(d.wirelessW,null);
    assert.equal(d.specStatus,'needs-specs');
    assert.ok([2024,2025,2026].includes(d.year));
    assert.ok(!hasChargeSpecs(d));
  }
});
test('manufacturer specs have an attributable source',()=>{
  for(const d of VERIFIED_2026){
    assert.equal(d.specStatus,'manufacturer');
    assert.match(d.sourceUrl,/^https:\/\//);
    assert.ok(hasChargeSpecs({...d,batteryV:3.85}));
  }
  const ultra=DEVICES.find(d=>d.id==='moto-razr-ultra-2026');
  assert.equal(ultra.year,2026);
  assert.equal(ultra.specStatus,'manufacturer');
  assert.equal(ultra.wiredW,68);
  assert.equal(ultra.wirelessW,30);
});
test('search filters by year, brand, status and favorites',()=>{
  const recent=queryCatalog(DEVICES,{year:'2026'});
  assert.ok(recent.length>=12);
  assert.ok(recent.every(x=>x.year===2026));
  const brand=queryCatalog(DEVICES,{year:'2026',brand:'Apple'});
  assert.ok(brand.length>=2);
  assert.ok(brand.every(x=>x.brand==='Apple'&&x.year===2026));
  const filtered=queryCatalog(DEVICES,{query:'pixel 11',status:'partial'});
  assert.ok(filtered.some(x=>x.model==='Pixel 11 Pro'));
  assert.ok(filtered.every(x=>x.specStatus==='partial'));
  const starred=queryCatalog(DEVICES,{favoritesOnly:true,favorites:['moto-razr-ultra-2026']});
  assert.equal(starred.length,1);
});
test('ordering is deterministic and wattage sorting puts missing specs at end',()=>{
  const a=queryCatalog(DEVICES,{sort:'wattage'});
  assert.ok((a[0].wiredW||0)>0);
  const missingIndex=a.findIndex(d=>d.wiredW===null);
  assert.ok(missingIndex>0);
  assert.equal(queryCatalog(DEVICES,{sort:'newest'})[0].year,2026);
});
