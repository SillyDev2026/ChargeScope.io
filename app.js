import {estimateCharge, normalizeDevice, formatMinutes, VERSION} from './core.mjs';
import {DEVICES} from './devices.mjs';

const $ = id => document.getElementById(id);
const LIST_KEY = 'chargescope-v2-devices';
const THEME_KEY = 'chargescope-v2-theme';
const defaultId = 'moto-razr-ultra-2026';
const fieldIds = ['editBrand','editModel','batteryMah','batteryV','wiredW','wirelessW','chargeMethod','chargerW','cableW','compatibility','temperature','activity'];
const form = $('calcForm');
let savedDevices = readSaved();
let selectedId = defaultId;
let latest = null;
let toastTimer;

function readSaved() {
  try {
    const values = JSON.parse(localStorage.getItem(LIST_KEY) || '[]');
    if (!Array.isArray(values)) return [];
    return values.slice(0,100).map(normalizeDevice).filter(d=>d.id.startsWith('custom-'));
  } catch (_) { return []; }
}
function persistSaved() {
  try {localStorage.setItem(LIST_KEY, JSON.stringify(savedDevices));return true;}
  catch (_) {notify('Browser storage is unavailable; your profile was not saved.');return false;}
}
function allDevices(){return [...DEVICES,...savedDevices];}
function getDevice(id){return allDevices().find(d=>d.id===id);}
function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o;}
function showError(message){$('formError').textContent=message;$('formError').hidden=!message;}
function notify(message) {
  const toast=$('toast');toast.textContent=message;toast.hidden=false;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},3200);
}

function setDeviceFields(d) {
  $('editBrand').value=d.brand;$('editModel').value=d.model;
  for (const field of ['batteryMah','batteryV','wiredW','wirelessW']) $(field).value=d[field];
}
function populateBrands(preferred) {
  const current=preferred||$('brandSelect').value||'Motorola';
  const brands=[...new Set([...allDevices().map(d=>d.brand),'Custom'])].sort((a,b)=>a.localeCompare(b));
  $('brandSelect').replaceChildren(...brands.map(b=>option(b,b)));
  $('brandSelect').value=brands.includes(current)?current:'Custom';
  populateModels(selectedId);
}
function populateModels(preferred) {
  const brand=$('brandSelect').value;
  const list=allDevices().filter(d=>d.brand===brand).sort((a,b)=>a.model.localeCompare(b.model));
  const opts=list.map(d=>option(d.id,d.model));
  opts.push(option('__custom__','+ Enter custom model'));
  $('deviceSelect').replaceChildren(...opts);
  $('deviceSelect').value=preferred && list.some(d=>d.id===preferred)?preferred:'__custom__';
}
function selectDevice(id) {
  const d=getDevice(id);
  if(!d){newDevice();return;}
  selectedId=id;
  $('brandSelect').value=d.brand;
  populateModels(id);
  setDeviceFields(d);
  update();
}
function newDevice(){
  selectedId=null;
  $('brandSelect').value='Custom';
  populateModels(null);
  setDeviceFields({brand:'Custom',model:'My phone',batteryMah:5000,batteryV:3.85,wiredW:30,wirelessW:0});
  $('editBrand').focus();update();
}
function readCurrentDevice(){
  return normalizeDevice({
    id:selectedId||'custom-draft',brand:$('editBrand').value,model:$('editModel').value,
    batteryMah:$('batteryMah').value,batteryV:$('batteryV').value,
    wiredW:$('wiredW').value,wirelessW:$('wirelessW').value
  });
}
function readOptions() {
  return {
    start:Number($('fromNumber').value),end:Number($('toNumber').value),
    method:$('chargeMethod').value,chargerW:Number($('chargerW').value),
    cableW:Number($('cableW').value),compatibility:$('compatibility').value,
    temperature:$('temperature').value,activity:$('activity').value
  };
}
function setPair(which,value) {
  const n=Number(value);
  if(!Number.isFinite(n))return;
  const start=which==='from';
  const number=$(start?'fromNumber':'toNumber');
  const slider=$(start?'fromSlider':'toSlider');
  const v=Math.max(start?0:1,Math.min(start?99:100,Math.round(n)));
  number.value=v;slider.value=v;
  if(start && v>=Number($('toNumber').value)){
    const next=Math.min(100,v+1);$('toNumber').value=next;$('toSlider').value=next;
  }
  if(!start && v<=Number($('fromNumber').value)){
    const next=Math.max(0,v-1);$('fromNumber').value=next;$('fromSlider').value=next;
  }
  update();
}
function update() {
  $('cableField').hidden=$('chargeMethod').value==='wireless';
  try {
    const result=estimateCharge(readCurrentDevice(),readOptions());
    latest=result;showError('');
    renderResult(result);renderComparison();
  } catch(e) {
    latest=null;showError(e.message||'Check your inputs');
    $('timeRange').textContent='—';$('centralTime').textContent='Enter valid specifications to calculate.';
    for(const id of ['gainStat','powerStat','energyStat'])$(id).textContent='—';
    $('curve').replaceChildren();$('warnings').replaceChildren();renderComparison();
  }
}
function renderResult(r){
  $('timeRange').textContent=formatMinutes(r.minMinutes)+' – '+formatMinutes(r.maxMinutes);
  $('centralTime').textContent='Model midpoint: '+formatMinutes(r.minutes)+' · '+r.device.brand+' '+r.device.model;
  $('gainStat').textContent=(r.options.end-r.options.start)+'%';
  $('powerStat').textContent=r.adapterLimitW+'W';
  $('energyStat').textContent=r.deliveredWh+'Wh';
  $('chartStart').textContent=r.options.start+'%';$('chartEnd').textContent=r.options.end+'%';
  drawCurve(r);
  const warning=$('warnings');warning.replaceChildren();
  const notes=['Charging speed is an estimate, not a measured result or a protocol compatibility guarantee.',...r.warnings];
  for(const line of notes){const item=document.createElement('div');item.className='warning-item';item.textContent='ⓘ '+line;warning.append(item);}
}
const svgNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs={},text='') {
  const node=document.createElementNS(svgNS,tag);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
  if(text!==undefined && text!=='')node.textContent=text;
  return node;
}
function drawCurve(r) {
  const svg=$('curve');svg.replaceChildren();
  const w=640,h=265,left=50,right=618,top=18,bottom=224;
  const x=p=>left+(p.minutes/Math.max(r.minutes,0.1))*(right-left);
  const y=p=>bottom-((p-r.options.start)/Math.max(1,r.options.end-r.options.start))*(bottom-top);
  for(let i=0;i<=4;i++){
    const level=r.options.start+(r.options.end-r.options.start)*i/4;
    const yy=y(level);
    svg.append(svgEl('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'currentColor','stroke-opacity':'.11','stroke-dasharray':'4 5'}));
    svg.append(svgEl('text',{x:left-11,y:yy+4,'text-anchor':'end',fill:'currentColor','fill-opacity':'.65','font-size':'12'},Math.round(level)+'%'));
  }
  for(let i=0;i<=4;i++){
    const xx=left+(right-left)*i/4;
    svg.append(svgEl('text',{x:xx,y:bottom+25,'text-anchor':'middle',fill:'currentColor','fill-opacity':'.65','font-size':'12'},formatMinutes(r.minutes*i/4)));
  }
  const pts=r.points.map(p=>[x(p),y(p.percent)]);
  const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
  const defs=svgEl('defs');const grad=svgEl('linearGradient',{id:'curveGradient',x1:'0%',x2:'0%',y1:'0%',y2:'100%'});
  grad.append(svgEl('stop',{offset:'0%','stop-color':'#73dff3','stop-opacity':'.32'}),svgEl('stop',{offset:'100%','stop-color':'#73dff3','stop-opacity':'.015'}));
  defs.append(grad);svg.append(defs);
  if(pts.length){
    const area=line+' L '+pts[pts.length-1][0].toFixed(2)+' '+bottom+' L '+left+' '+bottom+' Z';
    svg.append(svgEl('path',{d:area,fill:'url(#curveGradient)'}));
    svg.append(svgEl('path',{d:line,stroke:'#78d6ff','stroke-width':'4',fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
    for(const p of [pts[0],pts[pts.length-1]])svg.append(svgEl('circle',{cx:p[0],cy:p[1],r:5,fill:'#78d6ff',stroke:'#091729','stroke-width':2}));
  }
}
function populateComparison(){
  const devices=allDevices();
  const presets=[defaultId,'samsung-s25-ultra','apple-iphone-16-pro-max'];
  for(const [i,id] of ['compareA','compareB','compareC'].entries()){
    const select=$(id),old=select.value||presets[i];
    select.replaceChildren(...devices.map(d=>option(d.id,d.brand+' '+d.model)));
    select.value=devices.some(d=>d.id===old)?old:devices[i%devices.length].id;
  }
}
function renderComparison(){
  const wrap=$('compareResults');wrap.replaceChildren();
  let selected;
  try{selected=[$('compareA'),$('compareB'),$('compareC')].map(s=>getDevice(s.value)).filter(Boolean);}
  catch(_){return;}
  const opts=readOptions();
  const rows=selected.map(d=>{
    try{return {d,r:estimateCharge(d,opts)};}catch(e){return {d,error:e.message};}
  });
  const max=Math.max(1,...rows.filter(row=>row.r).map(row=>row.r.minutes));
  rows.forEach(({d,r,error})=>{
    const row=document.createElement('div');row.className='compare-row';
    const title=document.createElement('div');title.className='compare-label';title.textContent=d.model;
    const sub=document.createElement('span');sub.textContent=d.brand+' · '+d.batteryMah+'mAh';title.append(sub);
    const track=document.createElement('div');track.className='compare-bar-track';const bar=document.createElement('div');
    bar.className='compare-bar';bar.style.width=r?Math.max(1,100*r.minutes/max)+'%':'0%';track.append(bar);
    const label=document.createElement('strong');label.textContent=r?formatMinutes(r.minMinutes)+'–'+formatMinutes(r.maxMinutes):(error||'N/A');
    row.append(title,track,label);wrap.append(row);
  });
}

function renderCatalog() {
  const query=$('catalogSearch').value.trim().toLocaleLowerCase();
  const devices=allDevices().filter(d=>(d.brand+' '+d.model).toLocaleLowerCase().includes(query));
  $('catalogCount').textContent=devices.length+' device'+(devices.length!==1?'s':'');
  const grid=$('catalogGrid');grid.replaceChildren();
  if(!devices.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent='No matching devices. Add your own using “New custom device” above.';grid.append(empty);return;}
  for(const d of devices){
    const card=document.createElement('article');card.className='device-card';
    const top=document.createElement('div');top.className='device-card-top';
    const names=document.createElement('div');const brand=document.createElement('span');brand.className='device-brand';brand.textContent=d.brand;
    const title=document.createElement('h3');title.textContent=d.model;names.append(brand,title);
    const icon=document.createElement('span');icon.className='device-icon';icon.textContent='▥';icon.setAttribute('aria-hidden','true');top.append(names,icon);
    const data=document.createElement('div');data.className='device-data';
    for(const s of [d.batteryMah+' mAh',d.wiredW+'W wired',d.wirelessW+'W wireless']){
      const el=document.createElement('span');el.textContent=s;data.append(el);
    }
    const actions=document.createElement('div');actions.className='device-actions';
    const use=document.createElement('button');use.type='button';use.className='load-device';use.textContent='Use this profile ↗';
    use.addEventListener('click',()=>{populateBrands(d.brand);selectDevice(d.id);$('calculator').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
    actions.append(use);
    if(d.id.startsWith('custom-')){
      const remove=document.createElement('button');remove.type='button';remove.className='remove-device';remove.textContent='Delete';
      remove.setAttribute('aria-label','Delete '+d.model);
      remove.addEventListener('click',()=>{savedDevices=savedDevices.filter(x=>x.id!==d.id);if(!persistSaved())return;if(selectedId===d.id)selectedId=null;populateBrands('Motorola');selectDevice(defaultId);populateComparison();renderCatalog();notify('Custom device removed');});
      actions.append(remove);
    }
    card.append(top,data,actions);grid.append(card);
  }
}
function saveCurrentDevice(){
  try{
    const d=readCurrentDevice();
    if(savedDevices.length>=100 && !savedDevices.some(x=>x.id===selectedId))throw new Error('Maximum 100 custom profiles');
    d.id=selectedId && selectedId.startsWith('custom-')?selectedId:'custom-'+Date.now().toString(36);
    const index=savedDevices.findIndex(x=>x.id===d.id);
    if(index>=0)savedDevices[index]=d;else savedDevices.push(d);
    if(!persistSaved())return;
    selectedId=d.id;populateBrands(d.brand);$('deviceSelect').value=d.id;
    populateComparison();renderCatalog();update();notify('Saved to this browser');
  }catch(e){showError(e.message);}
}
function getShareUrl(){
  const d=readCurrentDevice(),o=readOptions();
  const p=new URLSearchParams({b:d.brand,m:d.model,mah:d.batteryMah,v:d.batteryV,w:d.wiredW,ww:d.wirelessW,
    from:o.start,to:o.end,charger:o.chargerW,cable:o.cableW,method:o.method,heat:o.temperature,use:o.activity,protocol:o.compatibility});
  const base=location.origin+location.pathname;
  return base+'?'+p.toString()+'#calculator';
}
function loadQuery(){
  const q=new URLSearchParams(location.search);
  if(!q.has('mah'))return;
  try{
    const d=normalizeDevice({brand:q.get('b'),model:q.get('m'),batteryMah:q.get('mah'),batteryV:q.get('v'),wiredW:q.get('w'),wirelessW:q.get('ww')});
    selectedId=null;populateBrands('Custom');populateModels(null);setDeviceFields(d);
    const fields={from:'fromNumber',to:'toNumber',charger:'chargerW',cable:'cableW',method:'chargeMethod',heat:'temperature',use:'activity',protocol:'compatibility'};
    for(const [query,id] of Object.entries(fields)){if(q.has(query))$(id).value=q.get(query);}
    for(const pair of [['fromNumber','fromSlider'],['toNumber','toSlider']])$(pair[1]).value=$(pair[0]).value;
    notify('Shared calculation loaded');
  } catch (_) { notify('Shared link contained invalid device details'); }
}
async function copyText(text){
  try{
    if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);notify('Copied to clipboard');
  }catch(_){notify('Clipboard blocked — try selecting and copying the page URL');}
}
function exportCSV(){
  if(!latest)return notify('Calculate a result first');
  const r=latest,rows=[
    ['ChargeScope v2 estimate','Value'],['Brand',r.device.brand],['Device',r.device.model],
    ['Battery (mAh)',r.device.batteryMah],['Voltage (V)',r.device.batteryV],
    ['Start (%)',r.options.start],['Target (%)',r.options.end],['Mode',r.options.method],
    ['Charger (W)',r.options.chargerW],['Cable limit (W)',r.options.cableW],
    ['Adapter power limit (W)',r.adapterLimitW],['Temperature',r.options.temperature],
    ['Activity',r.options.activity],['Compatibility',r.options.compatibility],
    ['Estimate low (min)',r.minMinutes],['Estimate midpoint (min)',r.minutes],
    ['Estimate high (min)',r.maxMinutes],['Estimated energy delivered (Wh)',r.deliveredWh],
    ['Disclaimer','Illustrative model only; not a device benchmark']
  ];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='chargescope-estimate.csv';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);notify('CSV downloaded');
}
function setTheme(mode){
  document.documentElement.dataset.theme=mode;
  $('themeToggle').textContent=mode==='dark'?'☼':'☾';
  $('themeToggle').setAttribute('aria-label','Switch to '+(mode==='dark'?'light':'dark')+' mode');
  try{localStorage.setItem(THEME_KEY,mode);}catch(_){}
}

function init(){
  let mode='dark';try{mode=localStorage.getItem(THEME_KEY)||'dark';}catch(_){}
  setTheme(mode==='light'?'light':'dark');
  $('themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  populateBrands('Motorola');selectDevice(defaultId);
  $('brandSelect').addEventListener('change',()=>{
    const brand=$('brandSelect').value;
    const first=allDevices().find(d=>d.brand===brand);
    if(first)selectDevice(first.id);else{selectedId=null;populateModels(null);$('editBrand').value=brand;$('editModel').value='My device';update();}
  });
  $('deviceSelect').addEventListener('change',()=>{
    if($('deviceSelect').value==='__custom__'){selectedId=null;$('editBrand').value=$('brandSelect').value;$('editModel').value='My device';update();}
    else selectDevice($('deviceSelect').value);
  });
  $('newDevice').addEventListener('click',newDevice);
  $('saveDevice').addEventListener('click',saveCurrentDevice);
  for(const id of fieldIds)$(id).addEventListener('input',update);
  for(const [n,r] of [['fromNumber','fromSlider'],['toNumber','toSlider']]){
    const which=n.startsWith('from')?'from':'to';
    $(n).addEventListener('input',e=>setPair(which,e.target.value));
    $(r).addEventListener('input',e=>setPair(which,e.target.value));
  }
  form.addEventListener('submit',event=>{event.preventDefault();update();if(latest)notify('Estimate updated');});
  $('resetButton').addEventListener('click',()=>{selectedId=defaultId;populateBrands('Motorola');selectDevice(defaultId);
    for(const [id,value] of Object.entries({chargerW:30,cableW:60,chargeMethod:'wired',compatibility:'matched',temperature:'normal',activity:'screen'}))$(id).value=value;
    setPair('from',20);setPair('to',80);update();notify('Calculator reset');});
  populateComparison();
  for(const id of ['compareA','compareB','compareC'])$(id).addEventListener('change',renderComparison);
  $('catalogSearch').addEventListener('input',renderCatalog);
  $('copyResult').addEventListener('click',()=>{if(!latest)return notify('Calculate first');copyText(latest.device.brand+' '+latest.device.model+': '+latest.options.start+'–'+latest.options.end+'% in approx. '+formatMinutes(latest.minMinutes)+' to '+formatMinutes(latest.maxMinutes)+' ('+latest.options.chargerW+'W charger). Estimate only.');});
  $('shareLink').addEventListener('click',()=>{try{copyText(getShareUrl());}catch(e){showError(e.message);}});
  $('exportCSV').addEventListener('click',exportCSV);
  loadQuery();update();renderCatalog();
  if('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}),{once:true});
  }
}
init();
