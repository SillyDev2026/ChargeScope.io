// ChargeScope v3.3 — local-first phone discovery and user preferences.
// Never stores manufacturer data, credentials, or a browser-wide tracking ID.
export const WORKSPACE_KEY='chargescope-v3.3-workspace';
export const RECENT_KEY='chargescope-v3.3-recent-phones';
export const MAX_RECENTS=6;

export function normalizeRecents(value,knownIds,max=MAX_RECENTS){
  const allowed=new Set(knownIds);
  if(!Array.isArray(value))return [];
  const cleaned=[];
  for(const id of value){
    if(typeof id==='string'&&allowed.has(id)&&!cleaned.includes(id))cleaned.push(id);
    if(cleaned.length>=max)break;
  }
  return cleaned;
}

export function recordRecent(value,id,knownIds){
  if(typeof id!=='string'||!knownIds.includes(id))return normalizeRecents(value,knownIds);
  return normalizeRecents([id,...value],knownIds);
}

const enumOk=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
const validNumber=(v,min,max,fallback)=>{
  if(v===null||v===undefined||v==='')return fallback;
  const n=Number(v);
  return Number.isFinite(n)&&n>=min&&n<=max?n:fallback;
};

export function normalizeWorkspace(raw,knownIds){
  const value=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const previous=value.settings&&typeof value.settings==='object'?value.settings:{};
  const start=validNumber(previous.start,0,99,20);
  const end=validNumber(previous.end,start+1,100,Math.max(start+1,80));
  return {
    deviceId:knownIds.includes(value.deviceId)?value.deviceId:null,
    settings:{
      start,end,chargerW:validNumber(previous.chargerW,1,300,30),
      cableW:enumOk(String(previous.cableW??'60'),['18','30','60','100','240'],'60'),
      method:enumOk(previous.method,['wired','wireless'],'wired'),
      compatibility:enumOk(previous.compatibility,['matched','unknown'],'matched'),
      temperature:enumOk(previous.temperature,['cool','normal','warm','hot'],'normal'),
      activity:enumOk(previous.activity,['idle','screen','gaming'],'screen')
    }
  };
}

export function searchPhones(devices,query,{limit=36,favorites=[],recent=[]}={}){
  const q=String(query??'').trim().toLocaleLowerCase();
  const tokens=q.split(/\s+/).filter(Boolean);
  const fav=new Set(favorites),order=new Map(recent.map((id,i)=>[id,i]));
  const matches=devices.filter(d=>{
    const haystack=(d.brand+' '+d.model).toLocaleLowerCase();
    return tokens.every(token=>haystack.includes(token));
  });
  const rank=d=>{
    const full=(d.brand+' '+d.model).toLocaleLowerCase();
    const model=d.model.toLocaleLowerCase();
    let n=0;
    if(q){
      if(full===q||model===q)n+=1000;
      else if(model.startsWith(q))n+=600;
      else if(full.startsWith(q))n+=450;
      else if(model.includes(q))n+=250;
    }
    if(fav.has(d.id))n+=140;
    if(order.has(d.id))n+=120-order.get(d.id)*8;
    if(d.specStatus==='manufacturer')n+=40;
    else if(d.specStatus==='partial')n+=25;
    return n;
  };
  return matches.sort((a,b)=>rank(b)-rank(a)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model))
    .slice(0,Math.max(1,Math.min(100,Number(limit)||36)));
}

export function supportedShortcut(code){
  return code==='Slash'||code==='KeyK';
}
