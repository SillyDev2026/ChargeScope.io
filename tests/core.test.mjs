import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateCharge, taperAt, normalizeDevice, formatMinutes} from '../core.mjs';

const phone={id:'test',brand:'Test',model:'Phone',batteryMah:5000,batteryV:3.85,wiredW:68,wirelessW:15};
const base={start:20,end:80,chargerW:30,cableW:60,method:'wired',temperature:'normal',activity:'idle',compatibility:'matched'};
const go=(changes={},device=phone)=>estimateCharge(device,{...base,...changes});

test('estimates are positive, bounded and monotonic',()=>{
  const r=go();
  assert.ok(r.minutes>0 && r.minMinutes>0 && r.maxMinutes>r.minMinutes);
  assert.equal(r.points[0].percent,20);
  assert.equal(r.points.at(-1).percent,80);
  for(let i=1;i<r.points.length;i++){assert.ok(r.points[i].percent>r.points[i-1].percent);assert.ok(r.points[i].minutes>r.points[i-1].minutes);}
});
test('larger charge interval takes longer',()=>{
  assert.ok(go({start:0,end:100}).minutes>go({start:20,end:80}).minutes);
  assert.ok(go({start:80,end:100}).minutes>go({start:20,end:40}).minutes/2);
});
test('oversized charger cannot exceed phone limit',()=>{
  const low=go({chargerW:68});
  const high=go({chargerW:240,cableW:240});
  assert.equal(low.minutes,high.minutes);
  assert.equal(high.adapterLimitW,68);
});
test('cable limits wired charging',()=>{
  assert.ok(go({chargerW:100,cableW:18}).minutes>go({chargerW:100,cableW:100}).minutes);
});
test('wireless respects wireless limit',()=>{
  const r=go({method:'wireless',chargerW:30});
  assert.equal(r.adapterLimitW,15);
  assert.ok(r.minutes>0);
});
test('wireless without supported value fails',()=>{
  assert.throws(()=>go({method:'wireless'}, {...phone,wirelessW:0}),/wireless/i);
});
test('unknown charger protocol is slower than matched',()=>{
  assert.ok(go({compatibility:'unknown'}).minutes>go({compatibility:'matched'}).minutes);
});
test('hot phones and gaming charge slower',()=>{
  assert.ok(go({temperature:'hot'}).minutes>go({temperature:'cool'}).minutes);
  assert.ok(go({activity:'gaming'}).minutes>go({activity:'idle'}).minutes);
});
test('invalid inputs reject clearly',()=>{
  assert.throws(()=>go({start:90,end:50}),RangeError);
  assert.throws(()=>go({chargerW:0}),RangeError);
  assert.throws(()=>go({start:0,end:101}),RangeError);
  assert.throws(()=>go({}, {...phone,batteryMah:0}),RangeError);
});
test('no accidental NaN output at extremes',()=>{
  for(const o of [{start:0,end:100,chargerW:5},{start:99,end:100,chargerW:300,cableW:240},{start:0,end:1,temperature:'hot',activity:'gaming'}]){
    const r=go(o);assert.ok(Number.isFinite(r.minutes));assert.ok(r.maxMinutes<10000);
  }
});
test('formatter and taper helper',()=>{
  assert.equal(formatMinutes(90),'1h 30m');
  assert.equal(formatMinutes(20),'20 min');
  assert.ok(taperAt(95)<taperAt(35));
});
test('voltage influences energy input',()=>{
  const a=normalizeDevice({...phone,batteryV:3.6});
  const b=normalizeDevice({...phone,batteryV:4.0});
  assert.ok(go({},b).deliveredWh>go({},a).deliveredWh);
});
