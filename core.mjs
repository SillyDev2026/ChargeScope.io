// ChargeScope v2 — transparent, approximate charging model.
// This is not a device benchmark or USB-PD negotiation simulator.
export const VERSION = '3.2.0';
const finite = (n) => {
  if (n === '' || n === null || typeof n === 'boolean' || (typeof n === 'string' && !n.trim())) return NaN;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : NaN;
};
const between = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function normalizeDevice(raw) {
  if (!raw || typeof raw !== 'object') throw new TypeError('Device is required');
  const device = {
    id: String(raw.id || 'custom').slice(0, 80),
    brand: String(raw.brand ?? 'Custom').trim().slice(0, 60),
    model: String(raw.model ?? 'Unnamed device').trim().slice(0, 100),
    batteryMah: finite(raw.batteryMah),
    batteryV: finite(raw.batteryV ?? 3.85),
    wiredW: raw.wiredW === null || raw.wiredW === '' ? null : finite(raw.wiredW),
    wirelessW: raw.wirelessW === null || raw.wirelessW === '' ? null : finite(raw.wirelessW ?? 0)
  };
  if (!device.brand || !device.model) throw new RangeError('Enter a brand and model');
  if (!(device.batteryMah >= 800 && device.batteryMah <= 30000)) throw new RangeError('Battery must be 800–30,000 mAh');
  if (!(device.batteryV >= 3 && device.batteryV <= 4.5)) throw new RangeError('Battery voltage must be 3–4.5 V');
  if (device.wiredW !== null && !(device.wiredW >= 1 && device.wiredW <= 300)) throw new RangeError('Wired limit must be 1–300 W');
  if (device.wirelessW !== null && !(device.wirelessW >= 0 && device.wirelessW <= 100)) throw new RangeError('Wireless limit must be 0–100 W');
  return device;
}

export function taperAt(percent) {
  const p = between(percent, 0, 100);
  if (p < 15) return 0.66 + 0.34 * p / 15;
  if (p < 55) return 1;
  if (p < 75) return 1 - 0.30 * (p - 55) / 20;
  if (p < 90) return 0.70 - 0.34 * (p - 75) / 15;
  return Math.max(0.10, 0.36 - 0.25 * (p - 90) / 10);
}

export function estimateCharge(rawDevice, rawOptions = {}) {
  const device = normalizeDevice(rawDevice);
  const opts = {
    start: finite(rawOptions.start ?? 20),
    end: finite(rawOptions.end ?? 80),
    chargerW: finite(rawOptions.chargerW ?? 30),
    cableW: finite(rawOptions.cableW ?? 60),
    method: rawOptions.method ?? 'wired',
    temperature: rawOptions.temperature ?? 'normal',
    activity: rawOptions.activity ?? 'idle',
    compatibility: rawOptions.compatibility ?? 'matched'
  };
  if (!(opts.start >= 0 && opts.start < opts.end && opts.end <= 100)) throw new RangeError('Choose a valid range from 0 to 100%');
  if (!(opts.chargerW > 0 && opts.chargerW <= 300)) throw new RangeError('Charger must be between 1 and 300 W');
  if (!(opts.cableW > 0 && opts.cableW <= 300)) throw new RangeError('Cable limit must be between 1 and 300 W');
  if (!['wired','wireless'].includes(opts.method)) throw new RangeError('Invalid charging method');
  const tempFactors = {cool: 1, normal: 0.94, warm: 0.76, hot: 0.52};
  const activityFactors = {idle: 1, screen: 0.85, gaming: 0.58};
  if (!(opts.temperature in tempFactors) || !(opts.activity in activityFactors)) throw new RangeError('Invalid charging conditions');
  if (!['matched','unknown'].includes(opts.compatibility)) throw new RangeError('Invalid compatibility choice');
  const deviceLimit = opts.method === 'wired' ? device.wiredW : device.wirelessW;
  if (deviceLimit === null) throw new RangeError('Maximum '+opts.method+' charging wattage not confirmed. Enter a supported power limit or choose the other charging method.');
  if (deviceLimit <= 0) throw new RangeError('This device does not support wireless charging or its rated wattage is zero');
  const adapterLimitW = Math.min(deviceLimit, opts.chargerW, opts.method === 'wired' ? opts.cableW : Infinity);
  const protocolFactor = opts.compatibility === 'matched' ? 1 : 0.66;
  const conditionFactor = tempFactors[opts.temperature] * activityFactors[opts.activity] * protocolFactor;
  const transferEfficiency = opts.method === 'wired' ? 0.87 : 0.71;
  const batterySidePeakW = adapterLimitW * conditionFactor * transferEfficiency;
  const capacityWh = device.batteryMah / 1000 * device.batteryV;
  let minutes = 0, deliveredWh = 0;
  const points = [{percent:opts.start, minutes:0}];
  let p = opts.start;
  while (p < opts.end - 1e-8) {
    const step = Math.min(0.5, opts.end - p);
    const midway = p + step / 2;
    const watts = Math.max(0.001, batterySidePeakW * taperAt(midway));
    const wh = capacityWh * step / 100;
    deliveredWh += wh;
    minutes += wh / watts * 60;
    p = Math.min(opts.end, p + step);
    if (points.length === 1 || Math.round(p * 2) % 10 === 0 || p === opts.end) {
      points.push({percent:Number(p.toFixed(2)), minutes:Number(minutes.toFixed(2))});
    }
  }
  // Broad model uncertainty: real charge curves vary substantially by device.
  const spread = opts.compatibility === 'unknown' ? 1.65 : 1.42;
  const minMinutes = Math.max(1, Math.floor(minutes * 0.80));
  const maxMinutes = Math.max(minMinutes + 1, Math.ceil(minutes * spread));
  const warnings = [];
  if (opts.compatibility === 'unknown') warnings.push('Unknown charger protocol: advertised wattages may not negotiate.');
  if (opts.method === 'wired' && adapterLimitW < Math.min(deviceLimit, opts.chargerW)) warnings.push('Cable power rating limits the estimated wired charging speed.');
  if (opts.temperature === 'hot') warnings.push('Hot-device estimate is uncertain. Unplug and cool the device if it becomes excessively hot.');
  if (opts.activity === 'gaming') warnings.push('Charging while gaming adds heat and may reduce or interrupt charging.');
  if (opts.method === 'wireless') warnings.push('Wireless placement, case thickness, and temperature can change charge speed.');
  return {
    device, options:opts, minutes:Number(minutes.toFixed(1)), minMinutes, maxMinutes,
    deliveredWh:Number(deliveredWh.toFixed(2)), capacityWh:Number(capacityWh.toFixed(2)),
    adapterLimitW:Number(adapterLimitW.toFixed(1)), batterySidePeakW:Number(batterySidePeakW.toFixed(1)),
    points, warnings
  };
}

export function formatMinutes(value) {
  if (!Number.isFinite(value) || value < 0) return '—';
  const mins = Math.round(value);
  const hrs = Math.floor(mins / 60);
  const rest = mins % 60;
  return hrs ? (hrs + 'h ' + String(rest).padStart(2,'0') + 'm') : (mins + ' min');
}
