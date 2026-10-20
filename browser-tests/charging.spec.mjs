import {test, expect} from '@playwright/test';

test.beforeEach(async ({page})=>{
  await page.goto('/');
  await expect(page.locator('#timeRange')).not.toHaveText('—');
});

test('every viewport has usable navigation without horizontal page overflow',async({page})=>{
  await expect(page.getByRole('link',{name:'Compare'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
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
