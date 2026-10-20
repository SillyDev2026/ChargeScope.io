// Built-in examples for getting started, not independently measured charge tests.
// Every field is editable in the UI; verify device and charger specifications.
import {DIRECTORY} from './catalog-directory.mjs';
import {OFFICIAL_BY_KEY,OFFICIAL_SPECS} from './official-specs.mjs';

const EXAMPLES = [
  {id:'moto-razr-ultra-2026',brand:'Motorola',model:'Razr Ultra 2026',batteryMah:5000,wiredW:68,wirelessW:30},
  {id:'moto-razr-2026',brand:'Motorola',model:'Razr 2026',batteryMah:4800,wiredW:30,wirelessW:15},
  {id:'moto-razr-ultra-2025',brand:'Motorola',model:'Razr Ultra 2025',batteryMah:4700,wiredW:68,wirelessW:30},
  {id:'moto-razr-2025',brand:'Motorola',model:'Razr 2025',batteryMah:4500,wiredW:30,wirelessW:15},
  {id:'moto-edge-60-pro',brand:'Motorola',model:'Edge 60 Pro',batteryMah:6000,wiredW:90,wirelessW:15},
  {id:'apple-iphone-16',brand:'Apple',model:'iPhone 16',batteryMah:3561,wiredW:27,wirelessW:25},
  {id:'apple-iphone-16-pro-max',brand:'Apple',model:'iPhone 16 Pro Max',batteryMah:4685,wiredW:30,wirelessW:25},
  {id:'apple-iphone-15',brand:'Apple',model:'iPhone 15',batteryMah:3349,wiredW:20,wirelessW:15},
  {id:'samsung-s25-ultra',brand:'Samsung',model:'Galaxy S25 Ultra',batteryMah:5000,wiredW:45,wirelessW:15},
  {id:'samsung-s25',brand:'Samsung',model:'Galaxy S25',batteryMah:4000,wiredW:25,wirelessW:15},
  {id:'samsung-z-flip7',brand:'Samsung',model:'Galaxy Z Flip7',batteryMah:4300,wiredW:25,wirelessW:15},
  {id:'samsung-z-fold7',brand:'Samsung',model:'Galaxy Z Fold7',batteryMah:4400,wiredW:25,wirelessW:15},
  {id:'pixel-10-pro-xl',brand:'Google',model:'Pixel 10 Pro XL',batteryMah:5200,wiredW:45,wirelessW:25},
  {id:'pixel-9-pro',brand:'Google',model:'Pixel 9 Pro',batteryMah:4700,wiredW:27,wirelessW:21},
  {id:'oneplus-13',brand:'OnePlus',model:'OnePlus 13',batteryMah:6000,wiredW:100,wirelessW:50},
  {id:'oneplus-12',brand:'OnePlus',model:'OnePlus 12',batteryMah:5400,wiredW:100,wirelessW:50},
  {id:'xiaomi-15-ultra',brand:'Xiaomi',model:'Xiaomi 15 Ultra',batteryMah:5410,wiredW:90,wirelessW:80},
  {id:'xiaomi-14',brand:'Xiaomi',model:'Xiaomi 14',batteryMah:4610,wiredW:90,wirelessW:50},
  {id:'poco-x7-pro',brand:'POCO',model:'POCO X7 Pro',batteryMah:6000,wiredW:90,wirelessW:0},
  {id:'redmi-note-14-pro-plus',brand:'Redmi',model:'Redmi Note 14 Pro+',batteryMah:5110,wiredW:120,wirelessW:0},
  {id:'nothing-phone-3',brand:'Nothing',model:'Phone (3)',batteryMah:5150,wiredW:65,wirelessW:15},
  {id:'nothing-phone-2',brand:'Nothing',model:'Phone (2)',batteryMah:4700,wiredW:45,wirelessW:15},
  {id:'asus-rog-phone-9',brand:'ASUS',model:'ROG Phone 9',batteryMah:5800,wiredW:65,wirelessW:15},
  {id:'sony-xperia-1-vii',brand:'Sony',model:'Xperia 1 VII',batteryMah:5000,wiredW:30,wirelessW:15},
  {id:'oppo-find-x8-pro',brand:'OPPO',model:'Find X8 Pro',batteryMah:5910,wiredW:80,wirelessW:50},
  {id:'vivo-x200-pro',brand:'vivo',model:'X200 Pro',batteryMah:6000,wiredW:90,wirelessW:30},
  {id:'honor-magic7-pro',brand:'HONOR',model:'Magic7 Pro',batteryMah:5270,wiredW:100,wirelessW:80},
  {id:'realme-gt-7-pro',brand:'realme',model:'GT 7 Pro',batteryMah:6500,wiredW:120,wirelessW:0},
  {id:'huawei-pura-70-ultra',brand:'HUAWEI',model:'Pura 70 Ultra',batteryMah:5200,wiredW:100,wirelessW:80},
  {id:'fairphone-6',brand:'Fairphone',model:'Fairphone 6',batteryMah:4415,wiredW:30,wirelessW:0},
  {id:'hmd-skyline',brand:'HMD',model:'Skyline',batteryMah:4600,wiredW:33,wirelessW:15},
  {id:'tecno-camon-40-pro',brand:'TECNO',model:'Camon 40 Pro',batteryMah:5200,wiredW:45,wirelessW:0},
  {id:'infinix-note-50-pro',brand:'Infinix',model:'Note 50 Pro',batteryMah:5200,wiredW:90,wirelessW:30}
].map(d=>({...d,batteryV:3.85,source:'Editable example; specifications and regional versions may vary'}));


// Preserve old public IDs, bookmarks, saved links and custom profile behavior.
// The legacy EXAMPLES had unsourced wattages. Never display those as official facts.
// We intentionally null out unverified values rather than perpetuate guesses.
// The manufacturer-backed overlay replaces the placeholder with sourced values.
const key=d=>(d.brand+'|'+d.model).toLocaleLowerCase();
const known=new Map(DIRECTORY.map(d=>[key(d),d]));
const legacy=EXAMPLES.map(d=>({
  ...d,
  year:known.get(key(d))?.year??null,
  batteryMah:null,wiredW:null,wirelessW:null,
  specStatus:'needs-specs',
  source:'Legacy example removed pending a reliable product specification',
  sourceUrl:'',
  protocol:'Not confirmed',
  verifiedAt:null,region:'Varies',chargerRecommendationW:null,advertisedChargeClaim:''
}));
const taken=new Set(legacy.map(key));
const directory=DIRECTORY.filter(d=>!taken.has(key(d)));
const base=[...legacy,...directory];

function mergeOfficial(d) {
  const info=OFFICIAL_BY_KEY.get(key(d));
  const fallback={
    region:'Varies',verifiedAt:null,chargerRecommendationW:null,
    advertisedChargeClaim:'',protocol:'Not confirmed',notes:''
  };
  if(!info){
    if(Number.isFinite(d.batteryMah)&&d.sourceUrl)
      return {...fallback,...d,specStatus:'partial',
        source:'Manufacturer page lists battery capacity. Other charging specifications still need verification.',
        verifiedAt:'2026-10-20'};
    return {...fallback,...d};
  }
  const complete=Number.isFinite(info.batteryMah)&&Number.isFinite(info.wiredW)&&info.wiredW>0
    && Number.isFinite(info.wirelessW)&&info.wirelessW>=0;
  return {
    ...d,
    batteryMah:info.batteryMah,wiredW:info.wiredW,wirelessW:info.wirelessW,
    batteryV:3.85,
    batteryWh:info.batteryWh??null,
    region:info.region,protocol:info.protocol,
    sourceUrl:info.sourceUrl,verifiedAt:info.asOf,
    chargerRecommendationW:info.chargerRecommendationW,
    advertisedChargeClaim:info.advertisedChargeClaim,
    notes:info.notes,
    specStatus:complete?'manufacturer':'partial',
    source:complete?'Manufacturer-confirmed charging specifications':'Manufacturer-confirmed fields; missing fields are not inferred'
  };
}
const present=new Set(base.map(key));
const extras=OFFICIAL_SPECS.filter(d=>!present.has(key(d))).map(d=>({
  id:('official-'+d.brand+'-'+d.model.replaceAll('+','-plus')).toLocaleLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
  brand:d.brand,model:d.model,year:null,batteryMah:null,batteryV:3.85,wiredW:null,wirelessW:null,
  specStatus:'needs-specs',source:'',sourceUrl:''
}));
export const DEVICES=[...base,...extras].map(mergeOfficial).sort((a,b)=>
  (b.year??0)-(a.year??0)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model)
);
