import {estimateCharge} from './core.mjs';

export const SESSION_LIMIT=200;
const finite=value=>value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value))?Number(value):NaN;

export function normalizeSession(raw) {
  if(!raw || typeof raw!=='object') throw new TypeError('A charge session is required');
  const session={
    id:String(raw.id || '').slice(0,90),
    timestamp:String(raw.timestamp||new Date().toISOString()),
    brand:String(raw.brand??'').trim().slice(0,60),
    model:String(raw.model??'').trim().slice(0,100),
    batteryMah:finite(raw.batteryMah),
    batteryV:finite(raw.batteryV??3.85),
    wiredW:finite(raw.wiredW),
    wirelessW:finite(raw.wirelessW??0),
    start:finite(raw.start),end:finite(raw.end),
    chargerW:finite(raw.chargerW),cableW:finite(raw.cableW??60),
    method:raw.method??'wired',
    temperature:raw.temperature??'normal',
    activity:raw.activity??'idle',
    compatibility:raw.compatibility??'unknown',
    observedMinutes:finite(raw.observedMinutes)
  };
  const device={id:'logged',brand:session.brand,model:session.model,batteryMah:session.batteryMah,batteryV:session.batteryV,wiredW:session.wiredW,wirelessW:session.wirelessW};
  const options={start:session.start,end:session.end,chargerW:session.chargerW,cableW:session.cableW,
    method:session.method,temperature:session.temperature,activity:session.activity,compatibility:session.compatibility};
  const estimate=estimateCharge(device,options);
  if(!(session.observedMinutes>=1&&session.observedMinutes<=1440))throw new RangeError('Measured duration must be 1–1,440 minutes');
  if(!Number.isFinite(Date.parse(session.timestamp)))throw new RangeError('Invalid session date');
  session.modelMinutes=estimate.minutes;
  session.ratio=Number((session.observedMinutes/estimate.minutes).toFixed(5));
  return session;
}

export function sessionForResult(result, observedMinutes, date=new Date()) {
  if(!result)throw new TypeError('Calculate a charging estimate first');
  const d=result.device,o=result.options;
  const id=typeof crypto!=='undefined' && crypto.randomUUID?crypto.randomUUID():
    String(Date.now())+'-'+Math.random().toString(36).slice(2);
  return normalizeSession({
    id:'session-'+id,timestamp:new Date(date).toISOString(),brand:d.brand,model:d.model,
    batteryMah:d.batteryMah,batteryV:d.batteryV,wiredW:d.wiredW,wirelessW:d.wirelessW,
    ...o,observedMinutes
  });
}

export function parseSessions(raw) {
  if(!Array.isArray(raw))return [];
  const good=new Map();
  for(const candidate of raw.slice(-SESSION_LIMIT*2)){
    try {const normalized=normalizeSession(candidate);if(normalized.id)good.set(normalized.id,normalized);}
    catch(_) { /* A corrupted record must not destroy valid measurements. */ }
  }
  return [...good.values()].slice(-SESSION_LIMIT).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
}

export function calibrationFor(result,records) {
  if(!result)return null;
  const d=result.device,o=result.options;
  const matching=parseSessions(records).filter(s=>
    s.brand.toLocaleLowerCase()===d.brand.toLocaleLowerCase() &&
    s.model.toLocaleLowerCase()===d.model.toLocaleLowerCase() &&
    s.method===o.method &&
    Math.abs(s.chargerW-o.chargerW)<=Math.max(1,o.chargerW*0.08) &&
    s.compatibility===o.compatibility &&
    s.temperature===o.temperature &&
    s.activity===o.activity &&
    s.ratio>=0.40&&s.ratio<=2.50
  );
  // Two observations are required, and calibration is bounded to avoid spurious predictions.
  if(matching.length<2)return null;
  const ratios=matching.map(s=>s.ratio).sort((a,b)=>a-b);
  const middle=Math.floor(ratios.length/2);
  const median=ratios.length%2?ratios[middle]:(ratios[middle-1]+ratios[middle])/2;
  const factor=Math.max(.65,Math.min(1.60,median));
  return {
    count:matching.length,factor:Number(factor.toFixed(3)),
    minutes:Math.round(result.minutes*factor),
    minMinutes:Math.max(1,Math.round(result.minMinutes*factor)),
    maxMinutes:Math.round(result.maxMinutes*factor)
  };
}

export function summarizeSessions(records) {
  const all=parseSessions(records);
  if(!all.length)return {count:0,averageObserved:0,averagePredicted:0,meanAbsPercentError:null};
  let absError=0;
  for(const s of all)absError+=Math.abs(s.modelMinutes-s.observedMinutes)/s.observedMinutes;
  return {
    count:all.length,
    averageObserved:Math.round(all.reduce((n,s)=>n+s.observedMinutes,0)/all.length),
    averagePredicted:Math.round(all.reduce((n,s)=>n+s.modelMinutes,0)/all.length),
    meanAbsPercentError:Math.round(absError/all.length*100)
  };
}
