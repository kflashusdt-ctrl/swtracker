// Static JSON "database": public/data/countries.json + public/data/c/{CC}.json.
// Files are fetched on demand and cached in memory for the session.

let countriesPromise = null;
const countryCache = new Map();

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

export function getCountries() {
  if (!countriesPromise) {
    countriesPromise = getJson('/data/countries.json')
      .then(({ total, logos = [], featured = {}, countries }) => {
        const logoUrl = (i) => (i >= 0 && logos[i] ? `/logos/${logos[i]}` : null);
        const list = countries.map(([code, name, codes, banks, top = []]) => ({
          code,
          name,
          codes,
          banks,
          topLogos: top.map(logoUrl).filter(Boolean),
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        const featuredLogo = (bic) => logoUrl(featured[bic] ?? -1);
        return { total, logoUrl, featuredLogo, list, byCode: Object.fromEntries(list.map((c) => [c.code, c])) };
      })
      .catch((err) => {
        countriesPromise = null;
        throw err;
      });
  }
  return countriesPromise;
}

export function getCountry(cc) {
  if (!countryCache.has(cc)) {
    const p = Promise.all([getCountries(), getJson(`/data/c/${cc}.json`)])
      .then(([{ logoUrl }, rows]) =>
        rows.map(([bic, bank, city, branch, logo = -1]) => ({
          bic,
          bank,
          city,
          branch,
          logo: logoUrl(logo),
          haystack: `${bic} ${bank} ${city} ${branch}`.toLowerCase(),
        })),
      )
      .catch((err) => {
        countryCache.delete(cc);
        throw err;
      });
    countryCache.set(cc, p);
  }
  return countryCache.get(cc);
}

export function filterRows(rows, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return rows;
  return rows.filter((r) => terms.every((t) => r.haystack.includes(t)));
}

export async function lookupBic(bic) {
  const { byCode } = await getCountries();
  const cc = bic.slice(4, 6);
  const country = byCode[cc] ?? null;
  if (!country) return { country: null, match: null, head: null, related: [], relatedTotal: 0 };

  const rows = await getCountry(cc);
  const key = bic.length === 11 && bic.endsWith('XXX') ? bic.slice(0, 8) : bic;
  const match = rows.find((r) => r.bic === key) ?? null;
  const head = key.length === 11 ? rows.find((r) => r.bic === key.slice(0, 8)) ?? null : null;
  const relatedAll = rows.filter((r) => r.bic.slice(0, 6) === key.slice(0, 6) && r.bic !== key);
  return { country, match, head, related: relatedAll.slice(0, 8), relatedTotal: relatedAll.length };
}
