# ChargeScope v2

A responsive, offline-capable phone charging estimator that supports an extensible device catalog and fully editable custom phone profiles.

> **Estimates, not measured charge times.** The phone's charging wattage, cable, charging protocol, temperature, load, and battery charge level all affect actual results. Wattage limits are upper bounds, not a promise that a charger negotiates that power.

## Start

Open `index.html` in a modern browser. For offline/PWA support, serve the site over HTTPS (GitHub Pages) or localhost. No build dependencies are required.

## Deployment

A GitHub Actions workflow runs the JavaScript unit tests and publishes the site to GitHub Pages on updates to `main`, once GitHub Pages is enabled in repository settings with **GitHub Actions** as the build/deploy source.

If using `chargescope.io`, configure the DNS and GitHub Pages custom-domain setting *only after verifying you own the domain*. There is intentionally no `CNAME` file yet.

## Browser support

Mobile-first UI with responsive grids for narrow Android phones, iPhones, foldables, tablets, laptops, and desktops. Uses native controls, keyboard focus styles, reduced-motion support, and standard web APIs. Test coverage includes charging model inputs and edge cases; cross-browser device-lab testing remains advisable.

## Features

- Fast and detailed charge estimates with a visible charge taper curve
- Wired/wireless mode, charger and cable limits, heat and usage conditions
- Model presets with clearly labelled editable illustrative charging specifications
- Add, save, search, and delete custom phones using local browser storage
- Compare up to three devices under identical charger assumptions
- Copy results, share calculation links, export CSV
- Offline-capable installable PWA when served over HTTPS

## License

MIT — see LICENSE.
