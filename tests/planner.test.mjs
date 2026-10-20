import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateCharge} from '../core.mjs';
import {CHARGER_PRESETS, chargerScenarios, chargerSweetSpot, chargingMilestones, electricityCost} from '../planner.mjs';

const d={brand:'Motorola',model:'Example',id:'example',batteryMah:5000,batteryV:3.85,wiredW:68,wirelessW:30};
const opts={start:20,end:80,chargerW:30,cableW:100,method:'wired',temperature:'normal',activity:'idle',compatibility:'matched'};

test('comparison is sorted and respects the phone charging limit',()=>{
  const rows=chargerScenarios(d,opts,[140,30,15,65,15,NaN,-10]);
  assert.deepEqual(rows.map(x=>x.watts),[15,30,65,140]);
  assert.equal(rows.at(-1).adapterLimitW,68);
  assert.ok(rows[0].minutes>rows[1].minutes);
  assert.ok(rows[2].minutes>=rows[3].minutes);
});

test('sweet spot picks smallest charger within tolerance of modeled fastest',()=>{
  const rows=chargerScenarios(d,opts);
  const spot=chargerSweetSpot(rows);
  assert.ok(spot);
  const fastest=Math.min(...rows.filter(x=>x.supported).map(x=>x.minutes));
  assert.ok(spot.minutes<=fastest*1.10);
  assert.equal(chargerSweetSpot([]),null);
});

test("milestones respect the user's selected charge range",()=>{
  const rows=chargingMilestones(d,opts);
  assert.deepEqual(rows.map(x=>x.percent),[25,50,75,80]);
  assert.ok(rows.every((x,i)=>i===0||x.minutes>rows[i-1].minutes));
  assert.deepEqual(chargingMilestones(d,{...opts,start:79,end:80}).map(x=>x.percent),[80]);
  assert.deepEqual(chargingMilestones(d,{...opts,start:100,end:20}),[]);
});

test('estimates of electricity cost increase with tariff and sessions',()=>{
  const result=estimateCharge(d,opts);
  const low=electricityCost(result,.20,7);
  const high=electricityCost(result,.40,7);
  assert.ok(low.wallKwh>0);
  assert.ok(low.yearly>low.each);
  assert.ok(high.yearly>low.yearly);
  assert.ok(electricityCost({...result,options:{...opts,method:'wireless'}},.2,7).wallKwh>low.wallKwh);
});

test('cost calculator rejects bad values',()=>{
  const result=estimateCharge(d,opts);
  assert.throws(()=>electricityCost(result,-1,7),RangeError);
  assert.throws(()=>electricityCost(result,NaN,7),RangeError);
  assert.throws(()=>electricityCost(result,.2,101),RangeError);
  assert.throws(()=>electricityCost(null,.2,7),RangeError);
});
