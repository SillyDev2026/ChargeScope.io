import test from 'node:test';
import assert from 'node:assert/strict';
import {OFFICIAL_SPECS,OFFICIAL_BY_KEY} from '../official-specs.mjs';
import {DEVICES} from '../devices.mjs';
import {normalizeDevice,estimateCharge} from '../core.mjs';
import {hasChargeSpecs,supportedModes,specCompleteness,catalogStatistics,queryCatalog} from '../catalog-utils.mjs';
import {evidenceSummary,isProfileEdited} from '../spec-view.mjs';

const find=(brand,model)=>{
  const d=DEVICES.find(x=>x.brand===brand&&x.model===model);
  assert.ok(d,brand+' '+model+' missing');
  return d;
};

test('manufacturer directory is sourced, dated, unique and has no invented zeros for missing fields',()=>{
  assert.ok(OFFICIAL_SPECS.length>=35);
  assert.equal(OFFICIAL_BY_KEY.size,OFFICIAL_SPECS.length,'no repeated manufacturer+model source entries');
  for(const d of OFFICIAL_SPECS){
    assert.match(d.sourceUrl,/^https:\/\//,'must link a manufacturer page');
    assert.equal(d.sourceType,'manufacturer');
    assert.equal(d.asOf,'2026-10-20');
    for(const n of ['batteryMah','wiredW','wirelessW'])
      assert.ok(d[n]===null||(Number.isFinite(d[n])&&d[n]>=0),d.model+' '+n);
    if(d.chargerRecommendationW!==null){
      assert.ok(d.chargerRecommendationW>0);
    }
  }
});

test('special charger requirements are NOT misreported as maximum phone input',()=>{
  for(const name of ['Pixel 11','Pixel 11 Pro','Pixel 11 Pro XL','Pixel 10 Pro XL']){
    const d=find('Google',name);
    assert.equal(d.wiredW,null,name+' unknown peak wattage must remain blank');
    assert.equal(d.specStatus,'partial');
    assert.ok(d.chargerRecommendationW>0);
    assert.match(evidenceSummary(d),/adapter used in charging claim/);
  }
  const apple=find('Apple','iPhone 18 Pro');
  assert.equal(apple.wiredW,null);
  assert.equal(apple.batteryMah,null);
  assert.equal(apple.chargerRecommendationW,60);
});

test('corrected manufacturer values are preserved rather than legacy guessed numbers',()=>{
  const op=find('OnePlus','OnePlus 13');
  assert.equal(op.batteryMah,6000);
  assert.equal(op.wiredW,80,'US OnePlus 13 advertised 80W standard');
  assert.equal(op.wirelessW,50);
  assert.equal(op.batteryWh,22.92);
  assert.equal(find('Samsung','Galaxy S26 Ultra').wiredW,60);
  assert.equal(find('Samsung','Galaxy S26+').wirelessW,20);
  assert.equal(find('Motorola','Razr Ultra 2026').wiredW,68);
  assert.equal(find('Xiaomi','Xiaomi 15 Ultra').wirelessW,80);
  assert.equal(find('Nothing','Phone (3a)').batteryMah,5000);
});

test('wireless estimate can run with unknown wired limit but not vice versa',()=>{
  const pixel=find('Google','Pixel 11 Pro XL');
  assert.deepEqual(supportedModes(pixel),{wired:false,wireless:true});
  assert.equal(hasChargeSpecs(pixel,'wired'),false);
  assert.equal(hasChargeSpecs(pixel,'wireless'),true);
  assert.equal(specCompleteness(pixel).known,2);
  const r=estimateCharge(pixel,{method:'wireless',start:20,end:80,chargerW:30});
  assert.ok(r.minutes>0);
  assert.equal(r.adapterLimitW,25);
  assert.throws(()=>estimateCharge(pixel,{method:'wired',start:20,end:80,chargerW:45}),/not confirmed/);
});

test('unknown wattages never become zero or fake model power',()=>{
  const unknown=find('Apple','iPhone 18 Pro');
  assert.equal(unknown.wiredW,null);
  assert.equal(unknown.wirelessW,null);
  assert.equal(specCompleteness(unknown).known,0);
  assert.throws(()=>normalizeDevice(unknown),/Battery/);
  const otherwiseValid=find('Google','Pixel 10 Pro');
  assert.throws(()=>estimateCharge(otherwiseValid,{method:'wired'}),/not confirmed/);
});

test('editing official numbers invalidates source confirmation in the UI',()=>{
  const samsung=find('Samsung','Galaxy S26 Ultra');
  assert.equal(isProfileEdited(samsung,{batteryMah:'5000',wiredW:'60',wirelessW:'25'}),false);
  assert.equal(isProfileEdited(samsung,{batteryMah:'5000',wiredW:'65',wirelessW:'25'}),true);
  assert.equal(isProfileEdited(find('Motorola','Razr Ultra 2026'),{batteryMah:'5000',wiredW:'68',wirelessW:''}),true);
});

test('source coverage statistics and source-first sorting work',()=>{
  const stats=catalogStatistics(DEVICES);
  assert.ok(stats.sourced>=OFFICIAL_SPECS.length);
  assert.ok(stats.official>=10);
  assert.ok(stats.partial>=10);
  const sourced=queryCatalog(DEVICES,{sort:'sourced'});
  assert.equal(sourced[0].specStatus,'manufacturer');
  const partial=queryCatalog(DEVICES,{status:'partial',brand:'Google'});
  assert.ok(partial.length>=5);
});
