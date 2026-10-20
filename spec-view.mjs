import {STATUS_LABELS,specCompleteness,supportedModes} from './catalog-utils.mjs';

const $=id=>document.getElementById(id);
const known=value=>Number.isFinite(value);
const format=(value,unit)=>known(value)?Number(value).toLocaleString()+' '+unit:'Not confirmed';
const sourceSafe=url=>typeof url==='string'&&/^https:\/\//i.test(url)&&!url.includes('\\');

export function evidenceSummary(d) {
  if(!d)return 'Select a model to inspect source evidence.';
  const knownCount=specCompleteness(d).known;
  const completeness=knownCount+'/3 charging fields published';
  if(d.specStatus==='manufacturer')return completeness+' · '+(d.region||'US')+' · '+(d.protocol||'Manufacturer charging specification');
  if(d.specStatus==='partial')return completeness+' · '+(d.chargerRecommendationW
    ? d.chargerRecommendationW+'W adapter used in charging claim (not maximum phone input)'
    : 'Unpublished fields remain blank');
  if(d.specStatus==='needs-specs')return 'Specifications not confirmed. Enter your regional battery and rated charging limits.';
  return 'Local or illustrative profile. Values entered here are not certified manufacturer specifications.';
}
export function isProfileEdited(source,fields) {
  if(!source || !['manufacturer','partial'].includes(source.specStatus))return false;
  return ['batteryMah','wiredW','wirelessW'].some(field=>{
    const raw=fields[field];
    const input=raw===''||raw==null?null:Number(raw);
    const baseline=source[field]??null;
    return input!==baseline;
  });
}
export function renderSpecEvidence(d,edited=false) {
  const badge=$('deviceEvidenceBadge');
  badge.textContent=edited?'Locally edited · unverified':STATUS_LABELS[d?.specStatus]||'Custom profile';
  badge.className='micro-tag source-'+(edited?'edited':d?.specStatus||'custom');
  $('deviceEvidenceSummary').textContent=(edited
    ?'You changed a published value. The link refers to the original manufacturer model, not these local edits. '
    :'')+evidenceSummary(d);
  $('deviceEvidenceDate').textContent=d?.verifiedAt?'Checked '+d.verifiedAt:'';
  const a=$('deviceEvidenceLink');
  const url=d?.specStatus!=='needs-specs'&&sourceSafe(d?.sourceUrl)?d.sourceUrl:'';
  a.hidden=!url;
  if(url)a.href=url;else a.removeAttribute('href');
}

function fact(label,value) {
  const element=document.createElement('div');element.className='spec-fact';element.setAttribute('role','listitem');
  const name=document.createElement('span');name.textContent=label;
  const strong=document.createElement('strong');strong.textContent=value;
  element.append(name,strong);
  return element;
}

let useSelected=()=>{};
let lastDevice=null;
export function openSpecDetails(d) {
  if(!d)return;
  lastDevice=d;
  $('specDialogBrand').textContent=d.brand+' • '+(d.year||'Release year unlisted');
  $('specDialogTitle').textContent=d.model;
  $('specDialogSubtitle').textContent=(d.region||'Region may vary')+
    (d.verifiedAt?' · Source reviewed '+d.verifiedAt:' · Charging specifications not independently confirmed');
  const label=$('specDialogStatus');label.textContent=STATUS_LABELS[d.specStatus]||'Custom profile';
  label.className='micro-tag source-'+(d.specStatus||'custom');
  const wrap=$('specDialogFacts');wrap.replaceChildren();
  for(const [name,value] of [
    ['Battery capacity',format(d.batteryMah,'mAh')],
    ['Rated wired maximum',format(d.wiredW,'W')],
    ['Rated wireless maximum',d.wirelessW===0?'Not supported (0W)':format(d.wirelessW,'W')],
    ['Published adapter for test',format(d.chargerRecommendationW,'W')],
    ['Battery energy',format(d.batteryWh,'Wh')],
    ['Specification coverage',specCompleteness(d).known+' of 3 fields'],
    ['Mode available',Object.entries(supportedModes(d)).filter(([,v])=>v).map(([k])=>k).join(' / ')||'Needs specifications']
  ])wrap.append(fact(name,value));
  $('specDialogEvidence').textContent=d.advertisedChargeClaim
    ? 'Manufacturer fast-charge claim: '+d.advertisedChargeClaim+'. This is not a measurement taken by ChargeScope.'
    : 'No manufacturer charge-time claim entered for this model.';
  $('specDialogProtocol').textContent='Charging protocol: '+(d.protocol||'Not confirmed');
  $('specDialogNotes').textContent=d.notes||d.source||'Please confirm this model and its country-specific specifications.';
  const link=$('specDialogSource');
  const url=sourceSafe(d.sourceUrl)?d.sourceUrl:'';
  link.hidden=!url;
  if(url)link.href=url;else link.removeAttribute('href');
  const dialog=$('specDialog');
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
}
export function setupSpecView({getSelected,onUse}) {
  useSelected=onUse;
  $('deviceDetailsButton').addEventListener('click',()=>openSpecDetails(getSelected()));
  $('specDialogUse').addEventListener('click',()=>{
    const d=lastDevice;
    $('specDialog').close?.();$('specDialog').removeAttribute('open');
    if(d)useSelected(d);
  });
  $('specDialogClose').addEventListener('click',()=>{
    $('specDialog').close?.();$('specDialog').removeAttribute('open');
  });
  $('specDialog').addEventListener('click',event=>{
    if(event.target===$('specDialog'))$('specDialog').close?.();
  });
}
