import {WORKSPACE_KEY,RECENT_KEY,MAX_RECENTS,normalizeRecents,recordRecent,normalizeWorkspace,searchPhones} from './workspace.mjs';
import {STATUS_LABELS} from './catalog-utils.mjs';

const $=id=>document.getElementById(id);
let getDevices=()=>[],getFavorites=()=>[],onSelect=()=>{};
let recentIds=[];
let toast=()=>{};

function knownIds(){return getDevices().map(d=>d.id);}
function localRead(key,otherwise){
  try{
    const parsed=JSON.parse(localStorage.getItem(key)||'null');
    return parsed===null?otherwise:parsed;
  }catch(_){return otherwise;}
}
function persist(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true;}
  catch(_){toast('Could not save to this browser. Check storage/privacy settings.');return false;}
}
export function readWorkspace(ids){
  return normalizeWorkspace(localRead(WORKSPACE_KEY,{}),ids);
}
export function saveWorkspace(deviceId,settings){
  const ids=knownIds();
  const current=readWorkspace(ids);
  const data=normalizeWorkspace({
    deviceId:deviceId&&ids.includes(deviceId)?deviceId:current.deviceId,
    settings:settings||current.settings
  },ids);
  return persist(WORKSPACE_KEY,data);
}

export function updateRecent(deviceId){
  const ids=knownIds();
  recentIds=recordRecent(recentIds,deviceId,ids);
  if(persist(RECENT_KEY,recentIds))renderRecents();
}

function selectedCaption(d){
  const available=(d.wiredW??null)!==null||((d.wirelessW??null)!==null&&d.wirelessW>0);
  return [d.year||'Year unknown',STATUS_LABELS[d.specStatus]||'Custom',available?'Charging data':'Needs specs'].join(' · ');
}

function renderRecents(){
  const area=$('recentPhones'),actions=$('recentPhoneActions');
  if(!area)return;
  area.replaceChildren();
  recentIds=normalizeRecents(recentIds,knownIds());
  if(actions)actions.hidden=recentIds.length===0;
  $('recentClear').hidden=recentIds.length===0;
  if(!recentIds.length){
    const empty=document.createElement('p');empty.className='recent-empty';
    empty.textContent='Your recently viewed models will appear here.';area.append(empty);return;
  }
  for(const id of recentIds){
    const d=getDevices().find(x=>x.id===id);
    if(!d)continue;
    const button=document.createElement('button');button.type='button';
    button.className='recent-phone-chip';
    button.textContent=d.model;
    button.title=d.brand+' '+d.model;
    button.setAttribute('aria-label','Select recently used '+d.brand+' '+d.model);
    button.addEventListener('click',()=>onSelect(id));
    area.append(button);
  }
}

function renderSearch(){
  const results=$('phoneSearchResults');results.replaceChildren();
  const devices=searchPhones(getDevices(),$('phoneSearchInput').value,{
    limit:36,favorites:getFavorites(),recent:recentIds
  });
  const message=$('phoneSearchCount');
  message.textContent=devices.length+' matching model'+(devices.length===1?'':'s')+
    ($('phoneSearchInput').value.trim()?' (showing top matches)':' · browse suggested phones');
  if(!devices.length){
    const empty=document.createElement('p');empty.className='search-empty';
    empty.textContent='No matching phone. You can create a custom profile in the calculator.';
    results.append(empty);return;
  }
  for(const d of devices){
    const button=document.createElement('button');
    button.type='button';button.className='phone-search-result';
    button.dataset.phoneId=d.id;
    const top=document.createElement('span');top.className='phone-search-name';
    top.textContent=d.brand+' '+d.model;
    const meta=document.createElement('small');meta.textContent=selectedCaption(d);
    const chevron=document.createElement('span');chevron.className='phone-search-chevron';chevron.textContent='↗';
    button.append(top,meta,chevron);
    button.setAttribute('aria-label','Select '+d.brand+' '+d.model);
    button.addEventListener('click',()=>{
      onSelect(d.id);
      const dialog=$('phoneSearchDialog');
      if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
      $('openPhoneSearch').focus({preventScroll:true});
    });
    results.append(button);
  }
}

export function openPhoneSearch(){
  const dialog=$('phoneSearchDialog');
  if(!dialog.open){
    $('phoneSearchInput').value='';
    renderSearch();
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  }
  $('phoneSearchInput').focus();
}

export function setupPhoneFinder({devices,select,favorites,notify}){
  getDevices=devices;onSelect=select;getFavorites=favorites;toast=notify;
  recentIds=normalizeRecents(localRead(RECENT_KEY,[]),knownIds());
  $('openPhoneSearch').addEventListener('click',openPhoneSearch);
  $('phoneSearchClose').addEventListener('click',()=>{
    if(typeof $('phoneSearchDialog').close==='function')$('phoneSearchDialog').close();
    else $('phoneSearchDialog').removeAttribute('open');
  });
  $('phoneSearchInput').addEventListener('input',renderSearch);
  $('phoneSearchInput').addEventListener('keydown',event=>{
    if(event.key==='Enter'){
      const first=$('phoneSearchResults').querySelector('.phone-search-result');
      if(first){event.preventDefault();first.click();}
    }
  });
  $('phoneSearchDialog').addEventListener('click',event=>{
    if(event.target===$('phoneSearchDialog'))$('phoneSearchDialog').close?.();
  });
  $('recentClear').addEventListener('click',()=>{
    recentIds=[];
    if(persist(RECENT_KEY,[])){renderRecents();toast('Recent phones cleared');}
  });
  // Shortcut is intentionally disabled when focus is in an editor or typing field.
  window.addEventListener('keydown',event=>{
    const target=event.target;
    const editing=target?.matches?.('input, textarea, select, [contenteditable="true"]');
    const slash=event.key==='/'&&!event.ctrlKey&&!event.altKey&&!event.metaKey;
    const combo=(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k';
    if((slash&&!editing)||combo){
      event.preventDefault();openPhoneSearch();
    }
  });
  renderRecents();
}
