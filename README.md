# ChargeScope v3.1

A responsive, offline-capable phone charging estimator that supports an extensible device catalog and fully editable custom phone profiles.

> **Estimates, not measured charge times.** The phone's charging wattage, cable, charging protocol, temperature, load, and battery charge level all affect actual results. Wattage limits are upper bounds, not a promise that a charger negotiates that power.

## Start

Open `index.html` in a modern browser. For offline/PWA support, serve the site over HTTPS (GitHub Pages) or localhost. No build dependencies are required.

## Deployment

A GitHub Actions workflow runs the JavaScript unit tests and publishes the site to GitHub Pages on updates to `main`, once GitHub Pages is enabled in repository settings with **GitHub Actions** as the build/deploy source.

If using `chargescope.io`, configure the DNS and GitHub Pages custom-domain setting *only after verifying you own the domain*. There is intentionally no `CNAME` file yet.

## Browser support

Mobile-first UI with responsive grids for narrow Android phones, iPhones, foldables, tablets, laptops, and desktops. Uses native controls, keyboard focus styles, reduced-motion support, and standard web APIs. Test coverage includes charging model inputs and edge cases; cross-browser device-lab testing remains advisable.

## Version 3.1 — 2024–2026 phone discovery

- A curated multi-brand directory of phones launched between 2024 and October 2026 (not every regional SKU or announced future model).
- Browse/filter by model name, brand, release year, and specification confidence, with 24-model pagination and local favorites.
- Three confidence labels: manufacturer-backed (linked primary source), editable illustrative example, and specifications needed.
- Models with unconfirmed wired/wireless limits **do not produce fabricated charge-time estimates**. Users can enter specs for their variant and save their profile.
- Built-in phone specs are maintained manually, not automatically synchronized from manufacturers. Add new releases by updating `catalog-directory.mjs` and attach primary source URLs.
- Motorola Razr Ultra 2026 battery/wattages are sourced from Motorola US; partial battery specs for selected Samsung/Google phones are not misrepresented as maximum charging wattages.
- Source references:
  - https://www.motorola.com/us/en/p/phones/razr/razr-ultra-2026/pmipmjk44m3
  - https://www.samsung.com/us/smartphones/galaxy-s26/
  - https://www.samsung.com/us/support/answer/ANS10013201/
  - https://store.google.com/us/product/pixel_11_pro_specs
  - https://www.apple.com/iphone-18-pro/specs/

## Version 3.0 — Real charging lab\n\n- A redesigned mobile-first dashboard and quick phone profiles\n- Record *real, user-measured* charging sessions locally (no server or account)\n- After **two matching tests**, show a bounded calibration to the simulated estimate; never claim measured benchmarks from model presets\n- Export/import a validated JSON measurement history; entries never automatically leave the browser\n- Keep existing charger comparison, estimated milestones, per-session electricity cost, custom devices, dark/light modes and offline PWA\n\n## Features

- Fast and detailed charge estimates with a visible charge taper curve
- Wired/wireless mode, charger and cable limits, heat and usage conditions
- Model presets with clearly labelled editable illustrative charging specifications
- Add, save, search, and delete custom phones using local browser storage
- Compare up to three devices under identical charger assumptions
- Copy results, share calculation links, export CSV
- Charging Planner with wattage sweet spot, charging milestones, estimated finish clock and editable energy tariff\n- Offline-capable installable PWA when served over HTTPS

## Model limitations\n\nPersonal calibration is device-, method-, wattage-, activity-, temperature- and protocol-specific and requires at least two matching sessions. Real-world results vary; a two-point calibration is illustrative, not evidence of accuracy in other conditions. Each user is responsible for recording genuine sessions. The history export contains the entered device and session metadata.\n\n\nCharge times and electricity cost are simulated, not USB-PD measurements or a real power meter. The charger sweet spot assumes compatible charging protocols and the selected cable rating. Battery health or long-term degradation are not predicted.\n\n## License

MIT — see LICENSE.
