export const CATALOG_PAGE_SIZE=24;
export const STATUS_LABELS={
  manufacturer:'Official • complete',
  partial:'Official • partial',
  example:'Illustrative • review',
  'needs-specs':'Specs needed'
};
export const TRUST_ORDER={manufacturer:0,partial:1,example:2,'needs-specs':3};

export function hasChargeSpecs(d,method='wired'){
  if(!Number.isFinite(d?.batteryMah)||d.batteryMah<800)return false;
  return method==='wireless'
    ?Number.isFinite(d?.wirelessW)&&d.wirelessW>0
    :Number.isFinite(d?.wiredW)&&d.wiredW>0;
}
export function supportedModes(d){
  return {wired:hasChargeSpecs(d,'wired'),wireless:hasChargeSpecs(d,'wireless')};
}
export function specCompleteness(d){
  const values=['batteryMah','wiredW','wirelessW'].filter(k=>Number.isFinite(d?.[k]));
  return {known:values.length,total:3,percent:Math.round(100*values.length/3)};
}
export function catalogStatistics(devices){
  const years={2024:0,2025:0,2026:0};
  const brands=new Set();
  let ready=0,official=0,partial=0,sourced=0,unknown=0;
  for(const d of devices){
    brands.add(d.brand);
    if(d.year in years)years[d.year]++;
    if(hasChargeSpecs(d,'wired')||hasChargeSpecs(d,'wireless'))ready++;
    if(d.specStatus==='manufacturer')official++;
    if(d.specStatus==='partial')partial++;
    if(d.specStatus==='manufacturer'||d.specStatus==='partial')sourced++;
    if(d.specStatus==='needs-specs')unknown++;
  }
  return {total:devices.length,brands:brands.size,ready,official,partial,sourced,unknown,years};
}
export function queryCatalog(devices,{query='',year='all',brand='all',status='all',sort='newest',favoritesOnly=false,favorites=[]}={}){
  const search=String(query).trim().toLocaleLowerCase();
  const favs=new Set(favorites);
  const items=devices.filter(d=>{
    if(search && !(d.brand+' '+d.model+' '+(d.protocol||'')).toLocaleLowerCase().includes(search))return false;
    if(year!=='all'&&String(d.year||'other')!==String(year))return false;
    if(brand!=='all'&&d.brand!==brand)return false;
    if(status!=='all'&&d.specStatus!==status)return false;
    if(favoritesOnly&&!favs.has(d.id))return false;
    return true;
  });
  const byName=(a,b)=>a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model);
  const sorters={
    newest:(a,b)=>(b.year??0)-(a.year??0)||byName(a,b),
    oldest:(a,b)=>(a.year??9999)-(b.year??9999)||byName(a,b),
    brand:(a,b)=>byName(a,b),
    wattage:(a,b)=>(Number(b.wiredW)||0)-(Number(a.wiredW)||0)||byName(a,b),
    sourced:(a,b)=>(TRUST_ORDER[a.specStatus]??5)-(TRUST_ORDER[b.specStatus]??5)||byName(a,b),
    battery:(a,b)=>(Number(b.batteryMah)||0)-(Number(a.batteryMah)||0)||byName(a,b)
  };
  return items.sort(sorters[sort]||sorters.newest);
}
