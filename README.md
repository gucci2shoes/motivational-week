# Trip Surprises · 5 Days (Static)

A single-page, dependency-free site that reveals five daily surprises (Nov 11–15, 2025) plus a bonus route. Everything runs client-side via one HTML/CSS/JS bundle, so you can double-click `index.html` in any modern browser and test immediately—no build or npm install required.

## Features
- Password gate that hashes the input with the Web Crypto API (SHA-256) and compares it to the stored hex hash.
- Hash routes (`/#`, `/#day1…/#day5`, `/#bonus`) with state persisted in `localStorage` (auth flag, viewed days, revealed treat codes).
- Date-based unlocking for each day using built-in `Intl` timezone data for `America/New_York`; countdown timers refresh automatically.
- Bonus route unlocks after Day 5 is viewed or once New York time reaches Nov 15, 2025.
- DEV mode toggle and cache version string in `script.js` control unlock behavior and asset cache busting.

## Usage
1. Drop your real media into `assets/day*.mp4` and `assets/montage.mp4` (placeholders are empty zero-byte files right now).
2. Open `index.html` in Chrome (or any Chromium/WebKit browser) to run the experience locally with no tooling.
3. When you’re ready to publish, upload the whole folder to any static host (GitHub Pages, Netlify, S3, etc.).

### Config tweaks (in `script.js`)
- `devMode`: set `false` for real unlock timings; keep `true` while editing to bypass the clock and show the DEV badge.
- `cacheVersion`: bump to a new string to break browser caches on the media URLs (the string is appended as `?v=CACHE_VERSION`).
- `passwordHashHex`: replace with the SHA-256 hex of your real password.

### Generate a password hash in the browser console
Paste the helper into DevTools and replace `YOUR_PASSWORD` with the real secret:

```
(async () => {
  const enc = new TextEncoder().encode('YOUR_PASSWORD');
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hex = [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  console.log(hex);
})();
```

### macOS Deploy One-Liner (optional workflow)
Use this when you want to flip DEV mode off, bump the cache version to a timestamp, zip up the folder, and push to your remote:

```
VER=$(date +%Y%m%d%H%M%S) && \
  sed -i '' -E "s/(devMode:\s*)true/\1false/" script.js && \
  sed -i '' -E "s/(cacheVersion:\s*)'[^']*'/\1'$VER'/" script.js && \
  open index.html
```

(Replace the last line with your actual deployment command—`open index.html` is just a placeholder if you want to smoke-test manually.)
