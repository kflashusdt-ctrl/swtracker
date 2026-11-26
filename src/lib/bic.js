// SWIFT / BIC (ISO 9362) parsing and validation.
// Format: BBBB CC LL [bbb]  — institution, country, location, optional branch.

export const SEGMENTS = [
  { key: 'bank', label: 'Bank code', short: 'Bank', len: 4, chars: 'A–Z', color: 'var(--color-seg-bank)',
    desc: 'Four letters for the bank, usually a short form of its name. DEUT is Deutsche Bank.' },
  { key: 'country', label: 'Country code', short: 'Country', len: 2, chars: 'A–Z', color: 'var(--color-seg-country)',
    desc: 'The two-letter ISO code of the country the bank is in. DE is Germany.' },
  { key: 'location', label: 'Location code', short: 'Location', len: 2, chars: '0–9 A–Z', color: 'var(--color-seg-location)',
    desc: 'Two letters or numbers for the city of the bank’s head office. FF is Frankfurt.' },
  { key: 'branch', label: 'Branch code', short: 'Branch', len: 3, chars: '0–9 A–Z', optional: true, color: 'var(--color-seg-branch)',
    desc: 'Three characters for a specific branch. Left out, or XXX, means the head office.' },
];

export const POPULAR = [
  ['CHASUS33', 'JPMorgan Chase', 'New York'],
  ['BOFAUS3N', 'Bank of America', 'New York'],
  ['CITIUS33', 'Citibank', 'New York'],
  ['BARCGB22', 'Barclays', 'London'],
  ['HSBCGB2L', 'HSBC', 'London'],
  ['LOYDGB2L', 'Lloyds Bank', 'London'],
  ['DEUTDEFF', 'Deutsche Bank', 'Frankfurt'],
  ['COBADEFF', 'Commerzbank', 'Frankfurt'],
  ['BNPAFRPP', 'BNP Paribas', 'Paris'],
  ['SOGEFRPP', 'Société Générale', 'Paris'],
  ['UBSWCHZH', 'UBS', 'Zurich'],
  ['INGBNL2A', 'ING', 'Amsterdam'],
  ['BBVAESMM', 'BBVA', 'Madrid'],
  ['UNCRITMM', 'UniCredit', 'Milan'],
  ['DBSSSGSG', 'DBS Bank', 'Singapore'],
  ['HSBCHKHH', 'HSBC', 'Hong Kong'],
  ['MHCBJPJT', 'Mizuho Bank', 'Tokyo'],
  ['ICBKCNBJ', 'ICBC', 'Beijing'],
  ['SBININBB', 'State Bank of India', 'Mumbai'],
  ['EBILAEAD', 'Emirates NBD', 'Dubai'],
  ['RJHISARI', 'Al Rajhi Bank', 'Riyadh'],
  ['NEDSZAJJ', 'Nedbank', 'Johannesburg'],
  ['CTBAAU2S', 'Commonwealth Bank', 'Sydney'],
  ['ROYCCAT2', 'Royal Bank of Canada', 'Toronto'],
].map(([bic, bank, city]) => ({ bic, bank, city, cc: bic.slice(4, 6) }));

export const normalize = (s = '') => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);

export function splitBic(bic) {
  return {
    bank: bic.slice(0, 4),
    country: bic.slice(4, 6),
    location: bic.slice(6, 8),
    branch: bic.slice(8, 11),
  };
}

export function parseBic(input) {
  const bic = normalize(input);
  const parts = splitBic(bic);
  const errors = [];

  if (bic.length !== 8 && bic.length !== 11) {
    errors.push(`A SWIFT/BIC code has 8 or 11 characters — this one has ${bic.length}.`);
  }
  if (parts.bank && !/^[A-Z0-9]{4}$/.test(parts.bank)) errors.push('Characters 1–4 are the bank code.');
  if (parts.country && !/^[A-Z]{2}$/.test(parts.country)) errors.push('Characters 5–6 must be letters (an ISO country code).');
  if (parts.location && !/^[A-Z0-9]{2}$/.test(parts.location)) errors.push('Characters 7–8 are the location code.');

  const loc2 = parts.location[1];
  return {
    bic,
    parts,
    valid: errors.length === 0,
    errors,
    primary: bic.length === 8 || parts.branch === 'XXX',
    isTest: loc2 === '0',
    isPassive: loc2 === '1',
  };
}

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

export function countryName(code) {
  if (!regionNames || !/^[A-Z]{2}$/.test(code)) return null;
  try {
    const name = regionNames.of(code);
    return name && name !== code && name !== 'Unknown Region' ? name : null;
  } catch {
    return null;
  }
}

export function branchLabel(r) {
  if (r.branch) return prettyName(r.branch);
  return r.bic.length === 11 ? `Branch ${r.bic.slice(8)}` : 'Head office';
}

const titleSmall = new Set(['of', 'and', 'the', 'de', 'du', 'des', 'la', 'le', 'van', 'der', 'y', 'e', 'di', 'da', 'del', 'für', 'und']);
const keepUpper = /^(AG|SA|SPA|NV|BV|PLC|LTD|LLC|UK|USA|US|UAE|GMBH|KG|AB|AS|ASA|OYJ|PJSC|JSC|OJSC|CJSC|PT|TBK|SAL|SAE|SAS|SRL|BHD|NA|NV|CO|HSBC|BNP|UBS|ING|ABN|AMRO|DBS|OCBC|UOB|ICBC|RBC|TD|BMO|CIBC|KBC|DNB|SEB|BBVA|CIC|LCL|BPCE|MUFG|SMBC|ANZ|NAB|CBA|BPI|BDO|RCBC|IBL|MCB|HBL|UBL|NBP|BOC|CCB|ABC|PNB|SBI|ICICI|HDFC|IDBI|IDFC|RBL|EFG|BCP|BCV|BCEE|BIL|BGL|II|III|IV|NBD|FAB|QNB|NBK|CBD|RAK|KCB|GTB|UBA|BBK|TSB|SBI|BMCE|OTP|PKO|BPER|BNL|CGD|TEB|NMB|CRDB|BDO|BRI|BNI|BCA|KEB|BOC|DIB|ADIB|SAB|ANB|BNP|PSK|CIMB|RBS|TD|BMO|RBC|ANZ|ASB|BNZ|NAB|DNB|OP|KBC|BCR|UCO|IDBI|YES|PNB|BPI|RCBC|DZ|GLS|PSD|VR)$/;

// Dataset names are upper case; make them easier to read.
export function prettyName(s = '') {
  if (!s) return s;
  return s
    .replace(/,?\s*THE\s*$/i, "")
    .toLowerCase()
    .split(' ')
    .map((w, i) => {
      const up = w.toUpperCase();
      if (keepUpper.test(up.replace(/[.,()]/g, ''))) return up;
      if (i > 0 && titleSmall.has(w)) return w;
      return w.replace(/(^|[-(/.',])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
    })
    .join(' ');
}
