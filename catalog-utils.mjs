export const CATALOG_PAGE_SIZE=24;
export const STATUS_LABELS={
  manufacturer:'Manufacturer specs',
  example:'Editable example',
  'needs-specs':'Specs needed'
};
export function hasChargeSpecs(d){
  return Number.isFinite(d?.batteryMah)&&d.batteryMah>=800 &&
    Number.isFinite(d?.wiredW)&&d.wiredW>0 && Number.isFinite(d?.wirelessW)&&d.wirelessW>=0;
}
export function catalogStatistics(devices){
  const years={2024:0,2025:0,2026:0};
  const brands=new Set();
  let ready=0,official=0;
  for(const d of devices){
    brands.add(d.brand);
    if(d.year in years)years[d.year]++;
    if(hasChargeSpecs(d))ready++;
    if(d.specStatus==='manufacturer')official++;
  }
  return {total:devices.length,brands:brands.size,ready,official,years};
}
export function queryCatalog(devices,{query='',year='all',brand='all',status='all',sort='newest',favoritesOnly=false,favorites=[]}={}){
  const search=String(query).trim().toLocaleLowerCase();
  const favs=new Set(favorites);
  const items=devices.filter(d=>{
    if(search && !(d.brand+' '+d.model).toLocaleLowerCase().includes(search))return false;
    if(year!=='all'&&String(d.year||'other')!==String(year))return false;
    if(brand!=='all'&&d.brand!==brand)return false;
    if(status!=='all'&&d.specStatus!==status)return false;
    if(favoritesOnly&&!favs.has(d.id))return false;
    return true;
  });
  const sorters={
    newest:(a,b)=>(b.year??0)-(a.year??0)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model),
    oldest:(a,b)=>(a.year??9999)-(b.year??9999)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model),
    brand:(a,b)=>a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model),
    wattage:(a,b)=>(Number(b.wiredW)||0)-(Number(a.wiredW)||0)||a.brand.localeCompare(b.brand)
  };
  return items.sort(sorters[sort]||sorters.newest);
}
