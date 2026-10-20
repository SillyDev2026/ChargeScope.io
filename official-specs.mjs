// ChargeScope manufacturer-sourced phone data.
// Values come from the URL named on each entry, checked 2026-10-20.
// Null means NOT PUBLISHED / NOT CONFIRMED. Never replace it with a guess.
// Battery mAh are typical/equivalent where specified. Wattages are peak-rated,
// not sustained battery-side power nor guarantees for every charger.
// chargerRecommendationW is the MINIMUM ADAPTER USED for a fast-charge claim,
// NOT the device's maximum wired charging input.
const AS_OF='2026-10-20';
const S='https://www.samsung.com/us/support/';
const G='https://store.google.com/';
const M='https://www.motorola.com/';
const O='https://www.oneplus.com/';
const X='https://www.mi.com/';
const N='https://nothing.tech/';

function row(brand,model,batteryMah,wiredW,wirelessW,sourceUrl,protocol,notes='',extras={}) {
  if(!sourceUrl.startsWith('https://'))throw new Error('Official source URL required: '+model);
  return Object.freeze({
    brand,model,batteryMah,wiredW,wirelessW,
    sourceUrl,protocol,notes,
    region:extras.region||'US',
    chargerRecommendationW:extras.chargerRecommendationW??null,
    advertisedChargeClaim:extras.advertisedChargeClaim||'',
    batteryWh:extras.batteryWh??null,
    asOf:AS_OF,
    sourceType:'manufacturer',
    ...extras
  });
}

export const OFFICIAL_SPECS=[
  row('Motorola','Razr Ultra 2026',5000,68,30,M+'us/en/p/phones/razr/razr-ultra-2026/pmipmjk44m3','Motorola TurboPower / compatible wireless','68W requires matching Motorola TurboPower charger; 30W requires compatible Motorola wireless charger.'),
  row('Motorola','Razr 2026',4800,30,15,M+'us/en/p/phones/razr/razr-2026/pmipmjl44m7','Motorola TurboPower / Qi wireless','30W TurboPower; Motorola specifies a 15W wireless charger.'),
  row('Motorola','Razr Ultra 2025',4700,68,30,'https://en-us.support.motorola.com/app/answers/detail/a_id/187404/~/specifications---motorola-razr-ultra-2025','Motorola TurboPower / compatible wireless','US support specifications: 68W wired; 30W wireless.'),
  row('Motorola','Razr 2025',4500,30,15,'https://en-us.support.motorola.com/app/answers/detail/a_id/187124/~/specifications---motorola-razr-2025','Motorola TurboPower / Qi wireless','US support specifications: 30W wired; 15W wireless.'),
  row('Samsung','Galaxy S26',4300,25,15,S+'answer/ANS10010342/','USB PD PPS / Samsung Super Fast Charging','Samsung US comparison: battery capacity and wired/wireless limits.'),
  row('Samsung','Galaxy S26+',4900,45,20,S+'answer/ANS10010342/','USB PD PPS / Super Fast Charging 2.0','Samsung US comparison: battery capacity and wired/wireless limits.'),
  row('Samsung','Galaxy S26 Ultra',5000,60,25,S+'answer/ANS10010342/','USB PD PPS / Super Fast Charging 3.0','Samsung US comparison: battery capacity and wired/wireless limits.'),
  row('Samsung','Galaxy S26 FE',4900,45,15,S+'answer/ANS10010342/','USB PD PPS / Super Fast Charging 2.0','Samsung US comparison: battery capacity and wired/wireless limits.'),
  row('Samsung','Galaxy S25',4000,25,null,S+'answer/ANS10004600/','USB PD PPS / Samsung Super Fast Charging','Fast Wireless Charging 2.0 supported; peak wireless wattage not stated on the cited comparison.'),
  row('Samsung','Galaxy S25+',4900,45,null,S+'answer/ANS10004600/','USB PD PPS / Samsung Super Fast Charging 2.0','Fast Wireless Charging 2.0 supported; peak wireless wattage not stated on the cited comparison.'),
  row('Samsung','Galaxy S25 Ultra',5000,45,null,S+'answer/ANS10004600/','USB PD PPS / Samsung Super Fast Charging 2.0','Fast Wireless Charging 2.0 supported; peak wireless wattage not stated on the cited comparison.'),
  row('Samsung','Galaxy S25 Edge',3900,25,null,S+'answer/ANS10004600/','USB PD PPS / Samsung Super Fast Charging','Wireless charging available but exact peak not confirmed from this page.'),
  row('Samsung','Galaxy S25 FE',4900,45,null,S+'answer/ANS10004600/','USB PD PPS / Samsung Super Fast Charging 2.0','Wireless charging available but exact peak not confirmed from this page.'),
  row('Samsung','Galaxy S24',4000,25,null,'https://news.samsung.com/us/enter-new-era-of-mobile-ai-samsung-galaxy-s24-series/','USB PD PPS / Samsung Super Fast Charging','Fast Wireless Charging 2.0 supported; peak wireless input not confirmed.'),
  row('Samsung','Galaxy S24+',4900,45,null,'https://news.samsung.com/us/enter-new-era-of-mobile-ai-samsung-galaxy-s24-series/','USB PD PPS / Samsung Super Fast Charging 2.0','Fast Wireless Charging 2.0 supported; peak wireless input not confirmed.'),
  row('Samsung','Galaxy S24 Ultra',5000,45,null,'https://news.samsung.com/us/enter-new-era-of-mobile-ai-samsung-galaxy-s24-series/','USB PD PPS / Samsung Super Fast Charging 2.0','Fast Wireless Charging 2.0 supported; peak wireless input not confirmed.'),
  row('Samsung','Galaxy Z Flip7',4300,25,null,'https://www.samsung.com/us/support/answer/ANS10003233/','USB PD PPS / Qi','Samsung recommends compatible 25W or 45W chargers; 25W charging is the supported class for Flip7. Wireless supported; exact peak not confirmed.'),
  row('Samsung','Galaxy Z Fold7',4400,25,null,'https://www.samsung.com/us/support/answer/ANS10003233/','USB PD PPS / Qi','Wired charging support inferred from Samsung foldable charging guidance; conservative 25W class. Wireless supported; peak not confirmed.'),
  row('Google','Pixel 11',4985,null,25,'https://store.google.com/product/pixel_11_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2.2','Google specifies a 30W PPS charger for its 30-minute fast-charge claim; that is NOT a published max wired wattage.',
    {chargerRecommendationW:30,advertisedChargeClaim:'Up to 55% in about 30 minutes (30W PPS charger or higher)'}),
  row('Google','Pixel 11 Pro',4850,null,25,'https://store.google.com/us/product/pixel_11_pro_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2.2','30W USB-C PPS adapter recommended for fast-charge claim; phone maximum wired input unspecified.',
    {chargerRecommendationW:30,advertisedChargeClaim:'Up to 55% in about 30 minutes (30W PPS charger or higher)'}),
  row('Google','Pixel 11 Pro XL',5115,null,25,'https://store.google.com/us/product/pixel_11_pro_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2.2','45W USB-C PPS adapter used for fast-charge claim; NOT evidence of 45W peak draw.',
    {chargerRecommendationW:45,advertisedChargeClaim:'Up to 75% in about 30 minutes (45W PPS charger or higher)'}),
  row('Google','Pixel 10',4970,null,15,'https://store.google.com/product/pixel_10_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2','30W USB-C PPS adapter for the stated fast-charge claim; not a measured peak input.',
    {chargerRecommendationW:30,advertisedChargeClaim:'Up to 55% in about 30 minutes (30W PPS charger or higher)'}),
  row('Google','Pixel 10 Pro',4870,null,15,'https://store.google.com/product/pixel_10_pro_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2','30W USB-C PPS adapter for stated fast-charge claim; not maximum input.',
    {chargerRecommendationW:30,advertisedChargeClaim:'Up to 55% in about 30 minutes (30W PPS charger or higher)'}),
  row('Google','Pixel 10 Pro XL',5200,null,25,'https://store.google.com/product/pixel_10_pro_specs?hl=en-US','USB PD PPS / Pixelsnap Qi2','45W USB-C PPS adapter for stated fast-charge claim; not maximum input.',
    {chargerRecommendationW:45,advertisedChargeClaim:'Up to 70% in about 30 minutes (45W PPS charger or higher)'}),
  row('Google','Pixel 10 Pro Fold',5015,null,15,'https://store.google.com/us/magazine/compare_pixel?hl=en-US','USB PD PPS / Pixelsnap Qi2','Google recommends a 30W PPS charger for its fast-charge claim, but does not give peak wired input.',
    {chargerRecommendationW:30,advertisedChargeClaim:'Up to 50% in about 30 minutes (30W PPS charger or higher)'}),
  row('Google','Pixel 9',4700,null,null,'https://store.google.com/us/magazine/compare_pixel?hl=en-US','USB PD / Qi wireless','Google quotes 55% in around 30 minutes with Google 45W adapter; this is NOT the phone maximum.',
    {chargerRecommendationW:45,advertisedChargeClaim:'Up to 55% in about 30 minutes with Google 45W charger'}),
  row('Google','Pixel 9a',5100,null,null,'https://store.google.com/us/magazine/compare_pixel?hl=en-US','USB PD / Qi wireless','Battery typical size listed by Google; maximum charge input not provided on this comparison.'),
  row('Google','Pixel 8a',4492,null,null,'https://store.google.com/us/magazine/compare_pixel?hl=en-US','USB PD / Qi wireless','Battery typical size listed by Google; maximum charge input not provided on this comparison.'),
  row('OnePlus','OnePlus 13',6000,80,50,O+'us/13/specs','OnePlus SUPERVOOC / AIRVOOC','US specification is 80W SUPERVOOC; up to 100W only with specified OnePlus 100W adapter.',
    {batteryWh:22.92,region:'US',advertisedChargeClaim:'80W standard; up to 100W with OnePlus SUPERVOOC 100W Dual Ports adapter'}),
  row('OnePlus','OnePlus 12',5400,80,50,O+'us/12','OnePlus SUPERVOOC / AIRVOOC','US model: 80W SUPERVOOC and 50W AIRVOOC; some global markets differ.'),
  row('OnePlus','OnePlus 13R',6000,55,null,O+'us/13r/specs','OnePlus SUPERVOOC','US model: 55W SUPERVOOC standard; up to 80W with specified OnePlus Dual Ports GaN adapter.',
    {advertisedChargeClaim:'Up to 80W with specified OnePlus adapter; 55W standard'}),
  row('OnePlus','OnePlus 12R',5500,80,null,O+'us/launch/12','OnePlus SUPERVOOC','US launch identifies 5,500mAh and 80W charging. Wireless peak not listed.'),
  row('Xiaomi','Xiaomi 15 Ultra',5410,90,80,X+'global/product/xiaomi-15-ultra/specs/','Xiaomi HyperCharge / wireless HyperCharge','Global model: matching Xiaomi HyperCharge adapter/pad needed; regional battery or included charger can differ.',
    {region:'Global'}),
  row('Xiaomi','Xiaomi 14',4610,90,50,X+'global/support/faq/details/KA-566224/','Xiaomi HyperCharge / wireless HyperCharge','Global support FAQ explicitly states 90W wired and 50W wireless with matching Xiaomi charger.',
    {region:'Global'}),
  row('Nothing','Phone (3a)',5000,50,null,'https://my.nothing.tech/pages/phone-3a','USB-C fast charging','50W wired charging. Page does not document wireless input maximum.',{region:'Malaysia'}),
  row('Nothing','Phone (3a) Pro',5000,50,null,'https://my.nothing.tech/pages/phone-3a','USB-C fast charging','50W wired charging. Page does not document wireless input maximum.',{region:'Malaysia'}),
  row('Nothing','Phone (3)',null,null,15,N+'products/phone-3','USB-C / Qi wireless','Nothing confirms 15W wireless charging and 1–50% in under 20 minutes; full wired wattage/battery capacity not confirmed by this cited source.',
    {advertisedChargeClaim:'1–50% in under 20 minutes'}),
  row('Fairphone','Fairphone 6',4415,null,null,'https://www.fairphone.com/the-new-fairphone','USB-C charging','50% in 25 min with 30W charger (adapter recommendation, not verified input ceiling).',
    {region:'Global',chargerRecommendationW:30,advertisedChargeClaim:'50% in 25 minutes with 30W charger'}),
  row('Apple','iPhone 18 Pro',null,null,null,'https://www.apple.com/iphone-18-pro/specs/','USB-C AVS / MagSafe','Apple specifies a 60W-capable AVS adapter for the rapid-charge claim, not a maximum phone input wattage.',
    {chargerRecommendationW:60,advertisedChargeClaim:'Up to 50% in about 15 minutes with 60W-capable AVS adapter'}),
  row('Apple','iPhone 18 Pro Max',null,null,null,'https://www.apple.com/iphone-18-pro/specs/','USB-C AVS / MagSafe','Apple specifies a 60W-capable AVS adapter for the rapid-charge claim, not a maximum phone input wattage.',
    {chargerRecommendationW:60,advertisedChargeClaim:'Up to 50% in about 15 minutes with 60W-capable AVS adapter'})
];

export const OFFICIAL_BY_KEY = new Map(OFFICIAL_SPECS.map(d=>[(d.brand+'|'+d.model).toLocaleLowerCase(),d]));
