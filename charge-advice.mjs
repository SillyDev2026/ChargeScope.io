// Clear user-facing interpretation of simulated charger limits.
export function explainPowerLimit(result){
  if(!result)return {
    title:'Charging power explanation',
    detail:'Select a valid phone, charging method and adapter.'
  };
  const {device,options,adapterLimitW}=result;
  const method=options.method;
  const limits=method==='wired'?
    [{name:'phone',watts:device.wiredW},{name:'adapter',watts:options.chargerW},{name:'cable',watts:options.cableW}]:
    [{name:'phone',watts:device.wirelessW},{name:'pad',watts:options.chargerW}];
  const minimum=Math.min(...limits.map(v=>v.watts));
  const bottlenecks=limits.filter(x=>Math.abs(x.watts-minimum)<0.01).map(x=>x.name);
  let title;
  if(bottlenecks.length>1)title='Multiple power limits match';
  else if(bottlenecks[0]==='phone')title='Your phone sets the upper limit';
  else if(bottlenecks[0]==='cable')title='Your cable is the limit';
  else if(bottlenecks[0]==='pad')title='Your wireless pad is the limit';
  else title='Your charger is the limit';

  const parts=[
    'The selected '+(method==='wired'?'wired':'wireless')+' settings cap the adapter-side input at '+adapterLimitW+'W.',
    method==='wired'
      ? 'Phone rating: '+device.wiredW+'W; charger: '+options.chargerW+'W; cable rating: '+options.cableW+'W.'
      : 'Phone wireless rating: '+device.wirelessW+'W; pad: '+options.chargerW+'W.',
    'This is not sustained battery charging power.'
  ];
  if(options.compatibility==='unknown'){
    parts.push('Fast-charge protocol compatibility is unknown, so real power could be lower.');
  }else{
    parts.push('Assumes the selected charger supports the required phone charging protocol.');
  }
  if(options.temperature==='hot'||options.activity==='gaming'){
    parts.push('Heat and phone activity may substantially reduce charging speed.');
  }
  if(options.end>90)parts.push('The final 10% usually charges more slowly.');
  return {title,detail:parts.join(' '),bottlenecks};
}

export function rangeSummary(result){
  if(!result)return '';
  return result.device.brand+' '+result.device.model+' · '+result.options.start+'–'+result.options.end+
    '% · '+result.options.chargerW+'W '+result.options.method;
}
