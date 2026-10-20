// 2024–2026 phone directory. A listed model does NOT imply its charge specs
// have been verified. Entries without charge specs deliberately have null power
// limits; visitors may fill in official regional values to calculate.
// Catalog maintenance: update released model names as manufacturers announce them.
// Model year means first worldwide release year, not every market's launch date.
const ROWS = [
  ['Apple',2024,'iPhone 16|iPhone 16 Plus|iPhone 16 Pro|iPhone 16 Pro Max'],
  ['Apple',2025,'iPhone 16e|iPhone 17|iPhone 17 Pro|iPhone 17 Pro Max|iPhone Air'],
  ['Apple',2026,'iPhone 17e|iPhone 18 Pro|iPhone 18 Pro Max|iPhone Duo'],
  ['Samsung',2024,'Galaxy S24|Galaxy S24+|Galaxy S24 Ultra|Galaxy S24 FE|Galaxy Z Flip6|Galaxy Z Fold6|Galaxy A15 5G|Galaxy A25 5G|Galaxy A35 5G|Galaxy A55 5G|Galaxy A16 5G'],
  ['Samsung',2025,'Galaxy S25|Galaxy S25+|Galaxy S25 Ultra|Galaxy S25 Edge|Galaxy S25 FE|Galaxy Z Flip7|Galaxy Z Fold7|Galaxy A26 5G|Galaxy A36 5G|Galaxy A56 5G'],
  ['Samsung',2026,'Galaxy S26|Galaxy S26+|Galaxy S26 Ultra|Galaxy S26 FE|Galaxy Z Flip8|Galaxy Z Fold8'],
  ['Google',2024,'Pixel 8a|Pixel 9|Pixel 9 Pro|Pixel 9 Pro XL|Pixel 9 Pro Fold'],
  ['Google',2025,'Pixel 9a|Pixel 10|Pixel 10 Pro|Pixel 10 Pro XL|Pixel 10 Pro Fold'],
  ['Google',2026,'Pixel 10a|Pixel 11|Pixel 11 Pro|Pixel 11 Pro XL|Pixel 11 Pro Fold'],
  ['Motorola',2024,'Razr 2024|Razr+ 2024|Edge 50 Pro|Edge 50 Ultra|Edge 50 Fusion|Moto G Power 5G 2024|Moto G Stylus 5G 2024|Moto G 5G 2024'],
  ['Motorola',2025,'Razr 2025|Razr+ 2025|Razr Ultra 2025|Edge 60 Fusion|Edge 60 Pro|Moto G Power 2025|Moto G Stylus 2025|Moto G 2025'],
  ['Motorola',2026,'Razr 2026|Razr Ultra 2026|Razr Fold 2026|Moto G Power 2026'],
  ['OnePlus',2024,'OnePlus 12|OnePlus 12R|OnePlus Nord 4|OnePlus Nord CE4'],
  ['OnePlus',2025,'OnePlus 13|OnePlus 13R|OnePlus 15|OnePlus Nord 5|OnePlus Nord CE5'],
  ['OnePlus',2026,'OnePlus 15R'],
  ['Xiaomi',2024,'Xiaomi 14|Xiaomi 14 Ultra|Xiaomi 14T|Xiaomi 14T Pro'],
  ['Xiaomi',2025,'Xiaomi 15|Xiaomi 15 Ultra|Xiaomi 15T|Xiaomi 15T Pro|Xiaomi 17'],
  ['POCO',2024,'POCO F6|POCO F6 Pro|POCO X6 Pro'],
  ['POCO',2025,'POCO F7|POCO F7 Pro|POCO F7 Ultra|POCO X7 Pro'],
  ['Redmi',2024,'Redmi Note 13 Pro 5G|Redmi Note 13 Pro+ 5G|Redmi Note 14 Pro+'],
  ['Redmi',2025,'Redmi Note 14 Pro 5G|Redmi Note 14 5G|Redmi Note 15 Pro+'],
  ['Nothing',2024,'Phone (2a)|Phone (2a) Plus|CMF Phone 1'],
  ['Nothing',2025,'Phone (3)|Phone (3a)|Phone (3a) Pro|CMF Phone 2 Pro'],
  ['ASUS',2024,'Zenfone 11 Ultra|ROG Phone 8|ROG Phone 8 Pro|ROG Phone 9|ROG Phone 9 Pro'],
  ['ASUS',2025,'Zenfone 12 Ultra'],
  ['Sony',2024,'Xperia 1 VI|Xperia 10 VI'],
  ['Sony',2025,'Xperia 1 VII|Xperia 10 VII'],
  ['OPPO',2024,'Find X8|Find X8 Pro|Reno 12 Pro'],
  ['OPPO',2025,'Find X8 Ultra|Find N5|Reno 13 Pro|Reno 14 Pro|Find X9|Find X9 Pro'],
  ['vivo',2024,'X100 Ultra|X200|X200 Pro|V40 Pro'],
  ['vivo',2025,'X200 Ultra|X300|X300 Pro|V50|V60'],
  ['HONOR',2024,'Magic6 Pro|Magic V3|200 Pro'],
  ['HONOR',2025,'Magic7 Pro|Magic V5|Magic8 Pro|400 Pro'],
  ['realme',2024,'GT 6|GT 7 Pro|13 Pro+'],
  ['realme',2025,'GT 7|GT 8 Pro|14 Pro+'],
  ['HUAWEI',2024,'Pura 70 Ultra|Pura 70 Pro|Mate 70 Pro|Mate X6'],
  ['HUAWEI',2025,'Pura 80 Ultra|Pura 80 Pro|Mate X7'],
  ['Fairphone',2025,'Fairphone 6'],
  ['HMD',2024,'Skyline|Fusion'],
  ['TECNO',2024,'Camon 30 Pro 5G|Phantom V Fold2|Phantom V Flip2'],
  ['TECNO',2025,'Camon 40 Pro|Camon 40 Premier|Pova 7 Pro'],
  ['Infinix',2024,'Note 40 Pro|GT 20 Pro'],
  ['Infinix',2025,'Note 50 Pro|GT 30 Pro|Zero 40 5G'],
  ['nubia',2024,'Z70 Ultra|RedMagic 9S Pro|RedMagic 10 Pro'],
  ['nubia',2025,'Z80 Ultra|RedMagic 11 Pro'],
  ['iQOO',2024,'iQOO 13|iQOO Z9 Turbo'],
  ['iQOO',2025,'iQOO 15|iQOO Neo 10']
];

const urls={
  'Motorola|Razr Ultra 2026':'https://www.motorola.com/us/en/p/phones/razr/razr-ultra-2026/pmipmjk44m3',
  'Samsung|Galaxy S26':'https://www.samsung.com/us/smartphones/galaxy-s26/',
  'Samsung|Galaxy S26+':'https://www.samsung.com/us/smartphones/galaxy-s26/',
  'Samsung|Galaxy S26 Ultra':'https://news.samsung.com/us/samsung-unveils-galaxy-s26-series-most-intuitive-galaxy-ai-phone-yet/',
  'Samsung|Galaxy Z Fold8':'https://www.samsung.com/us/support/answer/ANS10013201/',
  'Google|Pixel 11':'https://blog.google/products-and-platforms/devices/pixel/google-pixel-11-pro-xl/',
  'Google|Pixel 11 Pro':'https://store.google.com/us/product/pixel_11_pro_specs',
  'Google|Pixel 11 Pro XL':'https://store.google.com/us/product/pixel_11_pro_specs',
  'Apple|iPhone 18 Pro':'https://www.apple.com/iphone-18-pro/specs/',
  'Apple|iPhone 18 Pro Max':'https://www.apple.com/iphone-18-pro/specs/',
  'Apple|iPhone Duo':'https://www.apple.com/newsroom/2026/09/apple-unveils-iphone-duo/'
};

const releaseId=(brand,model)=>('directory-'+brand+'-'+model).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const DIRECTORY = ROWS.flatMap(([brand,year,names])=>
  names.split('|').map(model=>({
    id:releaseId(brand,model),brand,model,year,
    batteryMah:null,batteryV:3.85,wiredW:null,wirelessW:null,
    specStatus:'needs-specs',
    source:'Device directory only — battery size and charge limits need confirmation for your region',
    sourceUrl:urls[brand+'|'+model]||''
  }))
);
export const VERIFIED_2026 = [
  {brand:'Motorola',model:'Razr Ultra 2026',year:2026,batteryMah:5000,wiredW:68,wirelessW:30,
   sourceUrl:urls['Motorola|Razr Ultra 2026'],specStatus:'manufacturer',
   source:'Motorola US: 5,000mAh, 68W TurboPower wired, 30W compatible wireless'},
];
export const YEAR_RANGE=[2024,2025,2026];
