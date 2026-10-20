import {test, expect} from '@playwright/test';

test.beforeEach(async ({page})=>{
  await page.goto('/');
  await expect(page.locator('#timeRange')).not.toHaveText('—');
});

test('every viewport has usable navigation without horizontal page overflow',async({page})=>{
  await expect(page.getByRole('link',{name:'Compare'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  const offenders=overflow>2?await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className:'',right:Math.round(el.getBoundingClientRect().right)})).filter(x=>x.right>window.innerWidth+2).slice(0,12)):[];
  const diagnostics=await page.evaluate(()=>{
    const d=document.documentElement,b=document.body,header=document.querySelector('.site-header'),nav=document.querySelector('.nav');
    const measure=e=>e?{scroll:e.scrollWidth,client:e.clientWidth,rect:e.getBoundingClientRect().toJSON(),overflowX:getComputedStyle(e).overflowX}:null;
    return {innerWidth:window.innerWidth,visualWidth:window.visualViewport?.width,html:measure(d),body:measure(b),header:measure(header),nav:measure(nav)};
  });
  expect(overflow,JSON.stringify({offenders,diagnostics})).toBeLessThanOrEqual(2);
});

test('preset ranges update the numeric inputs and estimate',async({page})=>{
  await page.locator('[data-charge-range="0:100"]').click();
  await expect(page.locator('#fromNumber')).toHaveValue('0');
  await expect(page.locator('#toNumber')).toHaveValue('100');
  await expect(page.locator('#gainStat')).toHaveText('100%');
  await page.locator('[data-charge-range="20:80"]').click();
  await expect(page.locator('#gainStat')).toHaveText('60%');
});

test('changing charging conditions updates and validates the result',async({page})=>{
  const initial=await page.locator('#centralTime').textContent();
  await page.locator('#chargerW').fill('5');
  await expect(page.locator('#centralTime')).not.toHaveText(initial);
  await page.locator('#chargerW').fill('');
  await expect(page.locator('#formError')).toBeVisible();
  await expect(page.locator('#timeRange')).toHaveText('—');
  await page.locator('#chargerW').fill('30');
  await expect(page.locator('#formError')).toBeHidden();
  await expect(page.locator('#timeRange')).not.toHaveText('—');
});

test('wireless mode hides wired cable controls and rejects unsupported devices',async({page})=>{
  await page.locator('#chargeMethod').selectOption('wireless');
  await expect(page.locator('#cableField')).toBeHidden();
  await page.locator('#wirelessW').fill('0');
  await expect(page.locator('#formError')).toBeVisible();
  await page.locator('#wirelessW').fill('30');
  await expect(page.locator('#formError')).toBeHidden();
  await page.locator('#chargeMethod').selectOption('wired');
  await expect(page.locator('#cableField')).toBeVisible();
});

test('custom profile survives reload and is used in comparison',async({page})=>{
  await page.locator('#newDevice').click();
  await page.locator('#editBrand').fill('Acme Test');
  await page.locator('#editModel').fill('Thunder Pro');
  await page.locator('#batteryMah').fill('6200');
  await page.locator('#wiredW').fill('70');
  await page.locator('#saveDevice').click();
  await expect(page.locator('#brandSelect')).toHaveValue('Acme Test');
  await expect(page.locator('#compareA')).toHaveValue('__current__');
  await expect(page.locator('.compare-row').first()).toContainText('Thunder Pro');
  await page.reload();
  await page.locator('#brandSelect').selectOption('Acme Test');
  await expect(page.locator('#deviceSelect option:checked')).toContainText('Thunder Pro');
  await page.locator('#catalogSearch').fill('Thunder Pro');
  await expect(page.locator('.device-card')).toHaveCount(1);
  await page.locator('.remove-device').click();
  await expect(page.locator('.device-card')).toHaveCount(0);
});

test('theme toggle switches and persists',async({page})=>{
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('charging planner updates charger wattage and models milestones',async({page})=>{
  await expect(page.getByRole('link',{name:'Planner'})).toBeVisible();
  await expect(page.locator('#bestWattage')).not.toHaveText('—');
  await expect(page.locator('#plannerEta')).not.toHaveText('—');
  await expect(page.locator('#chargeMilestones li')).toHaveCount(4);
  await page.locator('[data-wattage="45"]').click();
  await expect(page.locator('#chargerW')).toHaveValue('45');
  await expect(page.locator('.charger-row.selected')).toHaveCount(1);
  await page.locator('[data-charge-range="0:100"]').click();
  await expect(page.locator('#chargeMilestones li')).toHaveCount(6);
});

test('electricity cost responds to tariff and sessions without invalid output',async({page})=>{
  const annual=page.locator('#annualCost');
  await expect(annual).not.toHaveText('—');
  const first=await annual.textContent();
  await page.locator('#electricityRate').fill('0.40');
  await expect(annual).not.toHaveText(first);
  await page.locator('#electricityRate').fill('');
  await expect(page.locator('#plannerError')).not.toBeEmpty();
  await expect(annual).toHaveText('—');
  await page.locator('#electricityRate').fill('0.20');
  await expect(page.locator('#plannerError')).toBeEmpty();
  await expect(annual).not.toHaveText('—');
});

test('invalid calculator inputs clear planner instead of displaying stale results',async({page})=>{
  await page.locator('#chargerW').fill('');
  await expect(page.locator('#bestWattage')).toHaveText('—');
  await expect(page.locator('#chargerBars')).toBeEmpty();
  await page.locator('#chargerW').fill('30');
  await expect(page.locator('#bestWattage')).not.toHaveText('—');
});

test('new dashboard and real test section appear without horizontal overflow',async({page})=>{
  await expect(page.getByRole('heading',{name:/Understand every/i})).toBeVisible();
  await expect(page.getByRole('link',{name:'Real tests'})).toBeVisible();
  await expect(page.locator('#logDeviceName')).toContainText('Motorola');
  await expect(page.locator('#batteryOrb')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});
test('quick phone selections update the calculator and personal log',async({page})=>{
  await page.locator('[data-quick-device="samsung-s25-ultra"]').click();
  await expect(page.locator('#editBrand')).toHaveValue('Samsung');
  await expect(page.locator('#logDeviceName')).toContainText('Samsung');
  await page.locator('[data-charge-range="0:100"]').click();
  await expect(page.locator('#orbEnd')).toHaveText('100%');
});
test('two real charge tests produce personal estimates and persist after reload',async({page})=>{
  const minutes=await page.locator('#centralTime').textContent();
  await page.locator('#observedMinutes').fill('70');
  await page.locator('#saveSession').click();
  await expect(page.locator('#sessionCount')).toHaveText('1');
  await expect(page.locator('#personalizedTime')).toHaveText('Not calibrated yet');
  await page.locator('#observedMinutes').fill('75');
  await page.locator('#saveSession').click();
  await expect(page.locator('#sessionCount')).toHaveText('2');
  await expect(page.locator('#personalizedTime')).not.toHaveText('Not calibrated yet');
  await page.reload();
  await expect(page.locator('#sessionCount')).toHaveText('2');
  await expect(page.locator('.session-row')).toHaveCount(2);
  await page.locator('.delete-session').first().click();
  await expect(page.locator('#sessionCount')).toHaveText('1');
});
test('invalid measured minutes never save or crash the page',async({page})=>{
  await page.locator('#observedMinutes').fill('0');
  await page.locator('#saveSession').click();
  await expect(page.locator('#sessionCount')).toHaveText('0');
  await expect(page.locator('#sessionMessage')).toContainText('1–1,440');
  await expect(page.locator('#timeRange')).not.toHaveText('—');
});
