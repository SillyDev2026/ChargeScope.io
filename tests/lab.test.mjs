import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateCharge} from '../core.mjs';
import {normalizeSession,sessionForResult,parseSessions,calibrationFor,summarizeSessions,SESSION_LIMIT} from '../lab.mjs';

const d={id:'test-device',brand:'Motorola',model:'Razr Ultra 2026',batteryMah:5000,batteryV:3.85,wiredW:68,wirelessW:30};
const options={start:20,end:80,method:'wired',chargerW:30,cableW:60,temperature:'normal',activity:'idle',compatibility:'matched'};
const result=estimateCharge(d,options);
const observed=(minutes,id='session-'+Math.random().toString(36).slice(2),overrides={})=>({
  ...sessionForResult(result,minutes),id,...overrides
});

test('valid measured sessions retain device and calculation context',()=>{
  const s=sessionForResult(result,47);
  assert.equal(s.brand,'Motorola');assert.equal(s.chargerW,30);assert.equal(s.start,20);
  assert.equal(s.end,80);assert.equal(s.observedMinutes,47);
  assert.ok(s.modelMinutes>0);assert.ok(s.ratio>0);
});
test('invalid entries and corrupted imports are safely filtered',()=>{
  assert.throws(()=>sessionForResult(result,0),RangeError);
  assert.throws(()=>sessionForResult(result,'not a number'),RangeError);
  const valid=observed(40);
  const records=parseSessions([valid,{...valid,id:'bad',observedMinutes:-4},{hello:'world'},valid]);
  assert.equal(records.length,1);
  assert.equal(records[0].observedMinutes,40);
});
test('one test never generates personal calibration',()=>{
  assert.equal(calibrationFor(result,[observed(result.minutes*1.1)]),null);
});
test('two matching sessions generate bounded personal estimates',()=>{
  const s=[observed(result.minutes*1.1,'one'),observed(result.minutes*1.2,'two')];
  const c=calibrationFor(result,s);
  assert.ok(c);assert.equal(c.count,2);assert.ok(c.minutes>result.minutes);
  assert.ok(c.factor>=.65 && c.factor<=1.6);
});
test('device, wattage, charging mode and condition changes do not cross-calibrate',()=>{
  const s=[observed(result.minutes*1.15,'one'),observed(result.minutes*1.2,'two')];
  assert.equal(calibrationFor(estimateCharge({...d,model:'Other Phone'},options),s),null);
  assert.equal(calibrationFor(estimateCharge(d,{...options,chargerW:45}),s),null);
  assert.equal(calibrationFor(estimateCharge(d,{...options,temperature:'warm'}),s),null);
  assert.equal(calibrationFor(estimateCharge(d,{...options,activity:'gaming'}),s),null);
});
test('outliers and large imports do not destabilize calibration',()=>{
  const rows=[observed(result.minutes*9,'bad'),observed(result.minutes*1.14,'good1'),observed(result.minutes*1.1,'good2')];
  const c=calibrationFor(result,rows);
  assert.ok(c);assert.equal(c.count,2);
  const large=Array.from({length:SESSION_LIMIT+30},(_,i)=>observed(48,'unique-'+i));
  assert.equal(parseSessions(large).length,SESSION_LIMIT);
});
test('error metric is based on actual session observations',()=>{
  const summary=summarizeSessions([observed(40,'one'),observed(50,'two')]);
  assert.equal(summary.count,2);assert.equal(summary.averageObserved,45);
  assert.ok(Number.isFinite(summary.meanAbsPercentError));
});
