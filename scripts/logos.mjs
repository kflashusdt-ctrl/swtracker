// Bank logo pipeline used by build-data.mjs.
// 1. Work out each bank's official website: hand-checked list (bank-domains.mjs),
//    name rules, then Wikidata (only when the bank name matches).
// 2. Download each site's official icon once into public/logos/ so visitors never
//    hit a third party. Misses are cached in data-src/logo-misses.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import CODE_DOMAINS, { NAME_RULES } from './bank-domains.mjs';

const UA = 'bic-directory-build/1.0 (static site build script)';
const LOGO_DIR = 'public/logos';
const WD_CACHE = 'data-src/wikidata-banks.json';
const MISS_CACHE = 'data-src/logo-misses.json';
const COMMONS = 'data-src/commons-logos.json';
// Banks whose only official icon is small (24–31px); still better than initials.
const SMALL_OK = new Set(['fnbbotswana.co.bw', 'fnb.co.za']);

const STOP = new Set(
  'THE BANK BANCO BANCA BANQUE BANKA BANKASI BANKA OF AND DE DU DES DEL DI LA LE ET LIMITED LTD PLC SA S A AG NV N V SPA INC CO CORP CORPORATION COMPANY GROUP PJSC JSC PSC BHD BERHAD TBK PT AS ASA AB EG GMBH'.split(' '),
);
const tokens = (s) =>
  new Set(
    s
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^A-Z0-9]+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
function similar(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return false;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / Math.min(A.size, B.size) >= 0.5;
}

function hostOf(url) {
  try {
    const u = new URL(url.replace(/^https?:\/\/(https?:\/\/)/, '$1'));
    return u.hostname.replace(/^www\d?\./, '').toLowerCase();
  } catch {
    return null;
  }
}

async function wikidata() {
  if (existsSync(WD_CACHE)) return JSON.parse(readFileSync(WD_CACHE, 'utf8'));
  const query = `SELECT ?item ?itemLabel ?bic ?website WHERE {
    ?item wdt:P2627 ?bic . ?item wdt:P856 ?website .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,de,es,it". } }`;
  const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const rows = (await res.json()).results.bindings.map((b) => ({
    bic: b.bic.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    label: b.itemLabel?.value ?? '',
    host: hostOf(b.website.value),
  }));
  writeFileSync(WD_CACHE, JSON.stringify(rows));
  return rows;
}

/** rowsByCountry: { CC: [[bic, bank, city, branch], ...] } → Map(bic → domain) */
export async function assignDomains(rowsByCountry) {
  const wd = new Map();
  for (const w of await wikidata()) {
    if (w.host && /^[A-Z0-9]{4}[A-Z]{2}[A-Z0-9]{2}/.test(w.bic) && !wd.has(w.bic.slice(0, 8))) wd.set(w.bic.slice(0, 8), w);
  }
  const byBic = new Map();
  const stats = { rules: 0, codes: 0, wikidata: 0 };
  for (const [cc, rows] of Object.entries(rowsByCountry)) {
    for (const [bic, bank] of rows) {
      let domain = null;
      for (const [re, d, only] of NAME_RULES) {
        if ((!only || only === cc) && re.test(bank)) {
          domain = d;
          stats.rules++;
          break;
        }
      }
      if (!domain) {
        for (const k of [bic.slice(0, 8), bic.slice(0, 6), bic.slice(0, 4)]) {
          const v = CODE_DOMAINS[k];
          if (!v) continue;
          if (typeof v === 'string') domain = v;
          else if (!v.only || v.only.test(bank)) domain = v.domain;
          if (domain) {
            stats.codes++;
            break;
          }
        }
      }
      if (!domain) {
        const w = wd.get(bic.slice(0, 8));
        if (w && similar(w.label, bank)) {
          domain = w.host;
          stats.wikidata++;
        }
      }
      if (domain) byBic.set(bic, domain);
    }
  }
  console.log(`Logo sources: ${stats.rules} by name rule, ${stats.codes} by code list, ${stats.wikidata} via Wikidata`);
  return byBic;
}

const fileFor = (domain) => domain.replace(/[^a-z0-9]+/g, '-');

function pngSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return buf.readUInt32BE(16);
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) return 0;
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) return buf.readUInt16BE(i + 7);
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return 0;
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function get(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA }, redirect: 'follow', signal: ctrl.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Fallback: the bank's own site — the icons its homepage declares, then the usual apple-touch-icon paths.
async function fetchSiteIcon(domain) {
  for (const origin of [`https://www.${domain}`, `https://${domain}`]) {
    const page = await get(origin + '/');
    const candidates = [];
    if (page && (page.headers.get('content-type') || '').includes('html')) {
      const html = (await page.text()).slice(0, 300000);
      for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
        const rel = /rel=["']?([^"'>]+)/i.exec(tag)?.[1]?.toLowerCase() ?? '';
        const href = /href=["']?([^"' >]+)/i.exec(tag)?.[1];
        if (!href || !/icon/.test(rel) || /mask-icon/.test(rel)) continue;
        const sizes = Number(/sizes=["']?(\d+)/i.exec(tag)?.[1] ?? (/apple-touch/.test(rel) ? 180 : 0));
        try {
          candidates.push({ url: new URL(href, page.url).href, sizes });
        } catch {
          /* bad href */
        }
      }
      candidates.sort((a, b) => b.sizes - a.sizes);
    }
    candidates.push({ url: `${origin}/apple-touch-icon.png`, sizes: 180 }, { url: `${origin}/apple-touch-icon-precomposed.png`, sizes: 180 });
    for (const c of candidates.slice(0, 6)) {
      const res = await get(c.url);
      if (!res) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const size = pngSize(buf);
      if (size >= 48) return { buf, ext: buf[0] === 0xff ? 'jpg' : 'png', size };
      const text = buf.subarray(0, 400).toString('utf8');
      if (/<svg[\s>]/i.test(text) && buf.length < 200000) return { buf, ext: 'svg', size: 999 };
    }
    if (page) break;
  }
  return null;
}

async function fetchIcon(domain) {
  const fromGoogle = await fetchGoogleIcon(domain);
  if (fromGoogle && fromGoogle.size >= 64) return fromGoogle;
  return (await fetchSiteIcon(domain)) ?? fromGoogle;
}

async function fetchGoogleIcon(domain) {
  const min = SMALL_OK.has(domain) ? 24 : 32;
  for (const host of [domain, `www.${domain}`]) {
    try {
      const res = await fetch(`https://www.google.com/s2/favicons?domain=${host}&sz=128`, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const size = pngSize(buf);
      if (size >= min) return { buf, ext: buf[0] === 0xff ? 'jpg' : 'png', size };
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Downloads missing icons. Returns Map(domain → "/logos/file.ext"). */
export async function downloadIcons(domains) {
  mkdirSync(LOGO_DIR, { recursive: true });
  const misses = new Set(existsSync(MISS_CACHE) ? JSON.parse(readFileSync(MISS_CACHE, 'utf8')) : []);
  const out = new Map();
  const todo = [];
  for (const d of domains) {
    const f = fileFor(d);
    const have = ['png', 'jpg', 'svg', 'gif'].find((e) => existsSync(join(LOGO_DIR, `${f}.${e}`)));
    if (have) out.set(d, `${f}.${have}`);
    else if (!misses.has(d)) todo.push(d);
  }
  let done = 0;
  const worker = async () => {
    while (todo.length) {
      const d = todo.shift();
      const icon = await fetchIcon(d);
      if (icon) {
        const name = `${fileFor(d)}.${icon.ext}`;
        writeFileSync(join(LOGO_DIR, name), icon.buf);
        out.set(d, name);
      } else misses.add(d);
      if (++done % 50 === 0) console.log(`  icons ${done}…`);
      await new Promise((r) => setTimeout(r, 120));
    }
  };
  if (todo.length) console.log(`Downloading ${todo.length} icons…`);
  await Promise.all(Array.from({ length: 6 }, worker));

  // Last resort for banks whose site gives no usable icon: their official logo file on
  // Wikimedia Commons (hand-checked list in data-src/commons-logos.json).
  const commons = existsSync(COMMONS) ? JSON.parse(readFileSync(COMMONS, 'utf8')) : {};
  for (const d of domains) {
    if (out.has(d) || !commons[d]) continue;
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons[d])}?width=256`;
    try {
      await new Promise((r) => setTimeout(r, 400));
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = buf[0] === 0xff ? 'jpg' : buf.readUInt32BE(0) === 0x89504e47 ? 'png' : buf.subarray(0, 3).toString() === 'GIF' ? 'gif' : null;
      if (!ext) continue;
      const name = `${fileFor(d)}.${ext}`;
      writeFileSync(join(LOGO_DIR, name), buf);
      out.set(d, name);
      misses.delete(d);
    } catch {
      /* keep monogram */
    }
  }
  writeFileSync(MISS_CACHE, JSON.stringify([...misses].sort(), null, 0));
  console.log(`Icons: ${out.size} available, ${misses.size} sites without a usable icon`);
  return out;
}
