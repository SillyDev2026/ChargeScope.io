import {formatMinutes} from './core.mjs';
import {SESSION_LIMIT,normalizeSession,sessionForResult,parseSessions,calibrationFor,summarizeSessions} from './lab.mjs';

const KEY='chargescope-v3-real-sessions';
const $=id=>document.getElementById(id);
let sessions=[];
let currentResult=null;
let notify=()=>{};

function load(){
  try {sessions=parseSessions(JSON.parse(localStorage.getItem(KEY)||'[]'));}
  catch(_){sessions=[];}
}
function store(next){
  const normalized=parseSessions(next).slice(0,SESSION_LIMIT);
  try {localStorage.setItem(KEY,JSON.stringify(normalized));sessions=normalized;return true;}
  catch(_){notify('Browser storage is unavailable. Use Export before leaving this page.');return false;}
}
function empty(node){if(node)node.replaceChildren();}
function el(tag,className,content){
  const item=document.createElement(tag);
  if(className)item.className=className;
  if(content!==undefined)item.textContent=content;
  return item;
}
function banner(message,isError=false){
  const n=$('sessionMessage');
  n.textContent=message;
  n.classList.toggle('error',isError);
}
function update(){
  const info=summarizeSessions(sessions);
  $('sessionCount').textContent=String(info.count);
  $('sessionAccuracy').textContent=info.meanAbsPercentError===null?'—':info.meanAbsPercentError+'%';
  const calibration=calibrationFor(currentResult,sessions);
  if(calibration){
    $('personalizedTime').textContent=formatMinutes(calibration.minMinutes)+' – '+formatMinutes(calibration.maxMinutes);
    $('personalizedNote').textContent='Personal estimate based on '+calibration.count+' matching charge sessions. Comparison is specific to the same device, adapter, activity, and temperature.';
    $('personalizedBadge').textContent='Personalized · '+calibration.count+' sessions';
    $('personalizedBadge').hidden=false;
  }else{
    $('personalizedTime').textContent='Not calibrated yet';
    $('personalizedNote').textContent='Record at least two tests on the same phone using matching charging conditions and charger wattage. Estimates remain approximate.';
    $('personalizedBadge').hidden=true;
  }
  const wrap=$('sessionHistory');empty(wrap);
  if(!sessions.length){
    wrap.append(el('p','empty-note','No charging tests recorded yet. Complete a real charging session, then save the measured duration here.'));
    return;
  }
  for(const s of sessions){
    const card=el('article','session-row');
    const heading=el('div','session-info');
    heading.append(el('strong','',s.brand+' '+s.model));
    heading.append(el('span','',new Date(s.timestamp).toLocaleDateString()+' · '+s.start+'–'+s.end+'% · '+s.chargerW+'W '+s.method));
    const times=el('div','session-times');
    times.append(el('strong','',formatMinutes(s.observedMinutes)));
    times.append(el('small','','Model: '+formatMinutes(s.modelMinutes)));
    const del=el('button','text-button delete-session','Delete');
    del.type='button';del.setAttribute('aria-label','Delete test for '+s.brand+' '+s.model);
    del.addEventListener('click',()=>{
      if(store(sessions.filter(a=>a.id!==s.id))){banner('Test removed.');update();}
    });
    card.append(heading,times,del);wrap.append(card);
  }
}

function save(){
  if(!currentResult){banner('Select valid charging specifications before recording a test.',true);return;}
  const duration=$('observedMinutes').value;
  try{
    const next=sessionForResult(currentResult,duration);
    if(!store([next,...sessions]))return;
    $('observedMinutes').value='';
    banner('Real charge test saved on this device.');
    update();
  }catch(e){banner(e.message,true);}
}
function exportJSON(){
  const blob=new Blob([JSON.stringify({schema:'chargescope-v3-sessions',exportedAt:new Date().toISOString(),sessions},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='chargescope-charging-history.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  banner('Your test history was exported.');
}
async function importJSON(file){
  if(!file)return;
  try{
    if(file.size>1024*1024)throw new Error('File exceeds the 1MB import limit');
    const source=JSON.parse(await file.text());
    if(!source||source.schema!=='chargescope-v3-sessions'||!Array.isArray(source.sessions))throw new Error('This is not a ChargeScope history export');
    const imported=parseSessions(source.sessions);
    if(!imported.length)throw new Error('No valid charge sessions were found');
    if(store([...sessions,...imported])){banner('Imported '+imported.length+' validated charging tests.');update();}
  }catch(e){banner(e.message||'Could not import the file',true);}
  $('historyImport').value='';
}
export function setupLab({getResult,toast}){
  notify=toast;load();
  $('saveSession').addEventListener('click',save);
  $('exportHistory').addEventListener('click',exportJSON);
  $('importHistory').addEventListener('click',()=>$('historyImport').click());
  $('historyImport').addEventListener('change',event=>importJSON(event.target.files?.[0]));
  $('clearHistory').addEventListener('click',()=>{
    if(!sessions.length)return;
    if(!window.confirm('Delete all saved charging tests on this browser? Export first if you need a backup.'))return;
    if(store([])){banner('History cleared.');update();}
  });
  $('observedMinutes').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save();}});
  currentResult=getResult();
  update();
}
export function renderLab(result){
  currentResult=result;
  $('logDeviceName').textContent=result?result.device.brand+' '+result.device.model:'Choose a device above';
  $('logConditions').textContent=result
    ?result.options.start+'–'+result.options.end+'% · '+result.options.chargerW+'W · '+result.options.method
    :'Enter valid battery and charger settings';
  update();
}
