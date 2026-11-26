// Builds the static "database" served from public/:
//   public/data/countries.json  { total, logos: [file...], countries: [[cc, name, codes, banks, [logoIdx...]]] }
//   public/data/c/{CC}.json     [[bic, bank, city, branch, logoIdx|-1], ...]
//   public/flags/{CC}.svg       country flags (flag-icons)
//   public/logos/*              official bank icons (see scripts/logos.mjs)
// Source: data-src/AllCountries/*.json
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { POPULAR } from '../src/lib/bic.js';
import { assignDomains, downloadIcons } from './logos.mjs';

const SRC = 'data-src/AllCountries';
const OUT = 'public/data';
const FLAGS_OUT = 'public/flags';
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const CORRECTIONS = existsSync('data-src/corrections.json') ? JSON.parse(readFileSync('data-src/corrections.json', 'utf8')) : {};

// 1. Read and clean every country.
const countries = [];
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
  const raw = JSON.parse(readFileSync(join(SRC, file), 'utf8'));
  const cc = raw.country_code.toUpperCase();
  const seen = new Set();
  const rows = [];
  for (const r of raw.list ?? []) {
    let bic = clean(r.swift_code).toUpperCase();
    if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(bic)) continue;
    if (bic.length === 11 && bic.endsWith('XXX')) bic = bic.slice(0, 8);
    if (seen.has(bic)) continue;
    seen.add(bic);
    rows.push([bic, clean(r.bank), clean(r.city), clean(r.branch).replace(/^\((.*)\)$/, '$1')]);
  }
  for (const a of CORRECTIONS.add?.[cc] ?? []) {
    if (!seen.has(a.bic)) rows.push([a.bic, a.bank, a.city ?? '', a.branch ?? '']);
    seen.add(a.bic);
  }
  for (const r of rows) {
    const fix = CORRECTIONS.rename?.[r[0]];
    if (fix?.bank) r[1] = fix.bank;
  }
  if (!rows.length) continue;
  rows.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
  countries.push({ cc, name: clean(raw.country), rows });
}

// 2. Logos.
const byBic = await assignDomains(Object.fromEntries(countries.map((c) => [c.cc, c.rows])));
const files = await downloadIcons(new Set(byBic.values()));
const logoList = [...new Set(files.values())].sort();
const logoIdx = new Map(logoList.map((f, i) => [f, i]));

// 3. Write.
rmSync(OUT, { recursive: true, force: true });
rmSync(FLAGS_OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'c'), { recursive: true });
mkdirSync(FLAGS_OUT, { recursive: true });

let total = 0;
let withLogo = 0;
const index = [];
for (const { cc, name, rows } of countries) {
  const usage = new Map();
  const outRows = rows.map((r) => {
    const f = files.get(byBic.get(r[0]));
    const i = f != null ? logoIdx.get(f) : -1;
    if (i >= 0) {
      withLogo++;
      usage.set(i, (usage.get(i) ?? 0) + 1);
    }
    return [...r, i];
  });
  writeFileSync(join(OUT, 'c', `${cc}.json`), JSON.stringify(outRows));
  const top = [...usage].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([i]) => i);
  index.push([cc, name, rows.length, new Set(rows.map((r) => r[1])).size, top]);
  total += rows.length;
  const flag = `node_modules/flag-icons/flags/4x3/${cc.toLowerCase()}.svg`;
  if (existsSync(flag)) copyFileSync(flag, join(FLAGS_OUT, `${cc}.svg`));
}

const featured = {};
for (const p of POPULAR) {
  const f = files.get(byBic.get(p.bic));
  if (f) featured[p.bic] = logoIdx.get(f);
}
writeFileSync(join(OUT, 'countries.json'), JSON.stringify({ total, logos: logoList, featured, countries: index }));
console.log(`Wrote ${index.length} countries, ${total} codes, ${withLogo} with an official logo (${logoList.length} logos)`);
