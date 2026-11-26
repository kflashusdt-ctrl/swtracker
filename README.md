# BIC Finder — SWIFT / BIC code checker

Plain React (Vite) + Tailwind CSS v4 + Motion. No PHP and no server.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | Check a code (live breakdown as you type) or find a code by bank name / city |
| `/swift-code/:bic` | Shareable result page: bank, branch, city, country, other codes for the same bank |
| `/countries` | All countries with code counts |
| `/countries/:cc` | Every code in a country, filterable (`?q=` is kept in the URL) |
| `/guide` | SWIFT vs IBAN, MT103 / UETR, how to trace a payment, how to spot fake tracking sites |

## How the SWIFT codes are stored (no PHP, no database)

The codes are **static JSON files** served next to the app:

```
public/data/countries.json      # [code, name, codeCount, bankCount] for each country (~6 KB)
public/data/c/GB.json           # [[bic, bank, city, branch], ...] for one country
```

The app downloads `countries.json` once, then only the one country file it needs (the country is
characters 5–6 of the code). That keeps lookups fast on phones and lets you host the whole site for
free on Vercel, Netlify, Cloudflare Pages or GitHub Pages. Data files are cached by the browser.

**Updating the data:** replace the files in `data-src/AllCountries/` (same JSON shape) and run
`npm run data`. Source: [PeterNotenboom/SwiftCodes](https://github.com/PeterNotenboom/SwiftCodes)
(MIT, see `data-src/LICENSE`). That snapshot is from 2019, so some codes will be out of date.

**Corrections:** `data-src/corrections.json` renames or adds codes on top of the 2019 data, each with its sources
(e.g. BancABC → Access Bank Botswana, Barclays Botswana → Absa, Capital Bank → First Capital Bank `FRCGBWGA`).

**If you need fresher data or an admin panel later**, move the same rows into a hosted database
such as Supabase (Postgres) or Cloudflare D1 and query it from the React app. Keep the per-country
JSON as a fast cache.

## Bank logos

`npm run data` also gives banks their official logos and saves them into `public/logos/`, so visitors never load
images from a third party. Each bank's official website comes from, in order:

1. `scripts/bank-domains.mjs` — a hand-checked list of ~370 major banks (keyed by the start of the SWIFT code) and
   name rules for shared code ranges (e.g. Sparkassen, Volksbanken, TSB inside Lloyds codes).
2. Wikidata — banks whose Wikidata SWIFT code matches *and* whose name matches the directory.

The icon is the one the bank's own site publishes (via Google's favicon service, or the site's apple-touch-icon).
If neither is usable, the bank's official logo file on Wikimedia Commons is used (`data-src/commons-logos.json`,
hand-checked). Banks with no logo show a monogram. Today that's 873 logos covering 42,859 of 112,886 codes —
most major banks (about 35 on the hand-checked list still have no usable icon, e.g. Bank of China); the long tail
of small institutions shows initials.

To add a bank: put its code prefix and website in `scripts/bank-domains.mjs` and run `npm run data`.
Sites that gave no usable icon are cached in `data-src/logo-misses.json`; delete an entry to retry it.

## Payment status page (PHP)

`/track` lets someone enter a UETR. `/track/<uetr>` calls `api/status.php`, which reads the
`payment_status_events` table. **No bank is connected**, so nothing writes to that table and every lookup shows
the "No status reported" page, with a ready-to-copy trace request for the user's bank.

```
api/status.php         GET ?uetr=…  → { uetr, events: [], partnersConnected: 0, checkedAt }   (30 requests/min per IP)
api/config.php         database settings (env vars or api/config.local.php)
api/schema.mysql.sql   tables for MySQL/MariaDB (SQLite creates them itself)
```

There is deliberately no admin form or endpoint for typing statuses in. When a bank partner is signed, its official
API becomes the only way statuses enter the table — add user login and consent first, so only the sender and
recipient can see their payment.

**Run locally:** `npm run api` (PHP on :8000) and `npm run dev` in another terminal — Vite forwards `/api` to PHP.
Uses SQLite in `api/storage/` by default (Apache blocks that folder; on nginx, point `STATUS_DB_DSN` at a file outside the web root); set `STATUS_DB_DSN` / `STATUS_DB_USER` / `STATUS_DB_PASS` for MySQL.

## Hosting

- PHP hosting (Apache/cPanel): upload the contents of `dist/` plus the `api/` folder; `public/.htaccess` (copied into
  `dist/`) routes pages to `index.html` and leaves `/api/*.php` alone. Vercel and Netlify don't run PHP, so the
  status page needs PHP hosting.
- Netlify: `public/_redirects` sends every route to `index.html`.
- Vercel: `vercel.json` does the same and sets long cache headers for assets.

## UI components

- **React Bits** (reactbits.dev, installed with the shadcn CLI from `https://reactbits.dev/r/<Name>-JS-TW.json`) in
  `src/components/reactbits/`: BlurText (page headlines), SplitFlapText (departure-board code display), DecryptedText
  (code reveal on the result page), CountUp (stats), LogoLoop (popular codes strip). LogoLoop and SplitFlapText are
  lazy-loaded so they don't slow the first screen.
- **shadcn/ui** in `src/components/ui/`: Accordion, Button (with `gold`, `navy`, `onNavy` variants and `pill` / `xl`
  sizes), Input. 21st.dev's registry needs a signed-in account to install, so these come from shadcn directly —
  they're the same components 21st.dev lists under shadcn. To add one from 21st.dev, sign in there and run
  `npx shadcn@latest add "<the component's 21st.dev install URL>"`.
- **Real flags** from flag-icons, copied to `public/flags/` by `npm run data` and lazy-loaded as images.
- **Fonts** are self-hosted with Fontsource (Inter for text, Archivo for headlines), so there are no external requests.
