import {estimateCharge, formatMinutes} from './core.mjs';

export const CHARGER_PRESETS = Object.freeze([10, 15, 20, 30, 45, 65, 100, 140]);

export function chargerScenarios(device, options, watts = CHARGER_PRESETS) {
  if (!Array.isArray(watts) || watts.length === 0) return [];
  const unique = [...new Set(watts.map(Number))].filter(w => Number.isFinite(w) && w > 0 && w <= 300).sort((a,b)=>a-b);
  return unique.map(watts => {
    try {
      const result = estimateCharge(device, {...options, chargerW:watts});
      return {watts, minutes:result.minutes, minMinutes:result.minMinutes,
        maxMinutes:result.maxMinutes, adapterLimitW:result.adapterLimitW, supported:true};
    } catch(e) {
      return {watts, supported:false, reason:String(e.message||'Unavailable')};
    }
  });
}

export function chargerSweetSpot(scenarios, tolerance = 0.10) {
  const valid = scenarios.filter(s=>s.supported && Number.isFinite(s.minutes));
  if (!valid.length) return null;
  const fastest = Math.min(...valid.map(s=>s.minutes));
  return valid.find(s=>s.minutes <= fastest * (1 + Math.max(0,Math.min(1,tolerance)))) || valid[valid.length - 1];
}

export function chargingMilestones(device, options, percentages = [25, 50, 75, 80, 90, 100]) {
  const start = Number(options.start), end = Number(options.end);
  if (!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>100||start>=end) return [];
  const marks=[...new Set([...percentages.map(Number),end])]
    .filter(p=>Number.isFinite(p)&&p>start&&p<=end).sort((a,b)=>a-b);
  return marks.map(percent=>{
    const r=estimateCharge(device,{...options,end:percent});
    return {percent, minutes:r.minutes, minMinutes:r.minMinutes, maxMinutes:r.maxMinutes};
  });
}

export function electricityCost(result, rate = 0.20, sessionsPerWeek = 7) {
  const tariff = Number(rate), sessions = Number(sessionsPerWeek);
  if (!result || !Number.isFinite(result.deliveredWh) || result.deliveredWh<0)
    throw new RangeError('A valid charge estimate is required');
  if (!Number.isFinite(tariff) || tariff<0 || tariff>10)
    throw new RangeError('Electricity rate must be between $0 and $10 per kWh');
  if (!Number.isFinite(sessions) || sessions<0 || sessions>100)
    throw new RangeError('Charges per week must be between 0 and 100');
  // Example efficiency, not a wall-meter measurement or real charger efficiency.
  const assumedEfficiency = result.options.method === 'wireless' ? .70 : .85;
  const wallKwh = result.deliveredWh / 1000 / assumedEfficiency;
  return {
    wallKwh:Number(wallKwh.toFixed(5)),
    each:Number((wallKwh*tariff).toFixed(4)),
    monthly:Number((wallKwh*tariff*sessions*52/12).toFixed(2)),
    yearly:Number((wallKwh*tariff*sessions*52).toFixed(2)),
    assumedEfficiency
  };
}

const $=id=>document.getElementById(id);
const text=(id,value)=>{const el=$(id);if(el)el.textContent=value;};
const money=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(n);
let current=null, wiredWattageSetter=null;

export function setupPlanner({setChargerW}) {
  wiredWattageSetter=setChargerW;
  for (const chip of document.querySelectorAll('[data-wattage]')) {
    chip.addEventListener('click',()=>wiredWattageSetter(Number(chip.dataset.wattage)));
  }
  for (const id of ['electricityRate','chargesPerWeek']) {
    $(id)?.addEventListener('input',()=>renderPlanner(current));
  }
}

function setEmpty() {
  text('plannerStatus','Enter valid device and charging details to see your plan.');
  text('bestWattage','—');text('plannerEta','—');
  text('sessionCost','—');text('annualCost','—');
  for(const id of ['chargerBars','chargeMilestones']) $(id)?.replaceChildren();
}

export function renderPlanner(result) {
  current=result||null;
  if(!current){setEmpty();return;}
  const device=result.device,opts=result.options;
  const recommendations=chargerScenarios(device,opts);
  const best=chargerSweetSpot(recommendations);
  text('plannerStatus',device.brand+' '+device.model+' · '+opts.start+'–'+opts.end+'% · '+(opts.method==='wired'?'wired':'wireless'));
  text('bestWattage',best ? best.watts+'W' : 'Unavailable');
  text('sweetSpotNote',best
    ? 'Smallest example charger within 10% of this model’s fastest estimate, under the selected conditions. Protocol compatibility must be checked separately.'
    : 'No charging comparison available for these settings.');
  const arrival=new Date(Date.now()+result.minutes*60000);
  text('plannerEta',arrival.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
  text('plannerEtaDetail','Approximate finish clock time if charging starts now, using the midpoint prediction.');
  const bars=$('chargerBars');bars.replaceChildren();
  const valid=recommendations.filter(r=>r.supported);
  const slowest=Math.max(1,...valid.map(r=>r.minutes));
  for(const row of recommendations){
    const button=document.createElement('button');
    button.type='button';button.className='charger-row';
    button.disabled=!row.supported;
    const label=document.createElement('span');label.className='charger-row-label';label.textContent=row.watts+'W';
    const track=document.createElement('span');track.className='charger-track';
    const fill=document.createElement('span');fill.className='charger-fill';
    fill.style.width=row.supported ? Math.max(3,(slowest/Math.max(row.minutes,.001) * 100 / (slowest / Math.max(...valid.map(r=>r.minutes))) ) )+'%' : '0%';
    // Better visibility: fixed maximum width corresponds to fastest time; slowest gets a shorter bar.
    if(row.supported)fill.style.width=(100 * Math.min(...valid.map(r=>r.minutes))/row.minutes).toFixed(2)+'%';
    track.append(fill);
    const duration=document.createElement('span');duration.className='charger-duration';
    duration.textContent=row.supported?formatMinutes(row.minutes):'N/A';
    if(best&&best.watts===row.watts)button.classList.add('recommended');
    if(row.watts===opts.chargerW)button.classList.add('selected');
    button.append(label,track,duration);
    button.setAttribute('aria-label',row.watts+' watt charger: '+duration.textContent+' modeled duration. Select this wattage.');
    button.addEventListener('click',()=>wiredWattageSetter(row.watts));
    bars.append(button);
  }
  const marks=$('chargeMilestones');marks.replaceChildren();
  try {
    for(const mark of chargingMilestones(device,opts)){
      const li=document.createElement('li');
      const pct=document.createElement('span');pct.className='milestone-percent';pct.textContent=mark.percent+'%';
      const t=document.createElement('span');t.className='milestone-time';t.textContent='~'+formatMinutes(mark.minutes);
      const when=document.createElement('span');when.className='milestone-clock';
      when.textContent=new Date(Date.now()+mark.minutes*60000).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      li.append(pct,t,when);marks.append(li);
    }
  }catch(_){marks.replaceChildren();}
  const rate=$('electricityRate')?.value||'',sessions=$('chargesPerWeek')?.value||'';
  try{
    const costs=electricityCost(result,rate===''?NaN:rate,sessions===''?NaN:sessions);
    text('sessionCost',money(costs.each));
    text('annualCost',money(costs.yearly));
    text('wallEnergy',costs.wallKwh.toFixed(3)+' kWh estimated per session');
    text('plannerError','');
  }catch(e){
    text('sessionCost','—');text('annualCost','—');text('wallEnergy','—');text('plannerError',e.message);
  }
}
