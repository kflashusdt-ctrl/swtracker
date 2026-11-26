// UETR = Unique End-to-end Transaction Reference: a UUID version 4, e.g.
// eb6305c9-1f7f-49de-aed0-16487c27b42d (MT103 field 121).

export const UETR_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const LENS = [8, 4, 4, 4, 12];

export const UETR_PARTS = [
  { len: 8, color: 'var(--color-seg-bank)' },
  { len: 4, color: 'var(--color-seg-country)' },
  { len: 4, color: 'var(--color-seg-location)', note: 'Starts with 4' },
  { len: 4, color: 'var(--color-seg-branch)', note: '8, 9, a or b first' },
  { len: 12, color: 'var(--color-ink-2)' },
];

/** Lower-cases, strips anything that isn't hex, and re-inserts the dashes. */
export function normalizeUetr(input = '') {
  const hex = input.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 32);
  const parts = [];
  let i = 0;
  for (const len of LENS) {
    if (i >= hex.length) break;
    parts.push(hex.slice(i, i + len));
    i += len;
  }
  return parts.join('-');
}

export function splitUetr(uetr) {
  const parts = uetr.split('-');
  return LENS.map((_, i) => parts[i] ?? '');
}

export function parseUetr(input) {
  const uetr = normalizeUetr(input);
  const hexLen = uetr.replace(/-/g, '').length;
  let error = null;
  if (hexLen !== 32) error = `A UETR has 32 letters and numbers (36 with dashes) — this one has ${hexLen}.`;
  else if (!UETR_RE.test(uetr)) error = 'This isn’t a valid UETR. The 13th character must be 4 and the 17th must be 8, 9, a or b.';
  return { uetr, valid: !error, error };
}

// SWIFT gpi status (ISO 20022) → plain English.
export function describeStatus(status, reason) {
  if (status === 'ACCC') return { tone: 'ok', title: 'Credited to the recipient’s account', step: 3 };
  if (status === 'RJCT') return { tone: 'bad', title: 'Rejected — returned towards the sender’s bank', step: 3 };
  const reasons = {
    G000: 'Passed on to the next bank',
    G001: 'Passed to a bank that doesn’t report tracking updates',
    G002: 'Received — the credit to the recipient may not be immediate',
    G003: 'Waiting for documents the bank has asked the customer for',
    G004: 'Waiting for funds to arrive at the bank',
  };
  return { tone: reason === 'G003' || reason === 'G004' ? 'warn' : 'info', title: reasons[reason] ?? 'In progress', step: 2 };
}

export async function fetchStatus(uetr) {
  // Use Vercel's env variable, or local fallback
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${API_BASE}/api/status.php?uetr=${encodeURIComponent(uetr)}`, { 
    headers: { Accept: 'application/json' } 
  });
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('unavailable');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'unavailable');
  return body;
}

export function traceRequestText(uetr) {
  return [
    'Hello,',
    '',
    'Please trace my international SWIFT payment using SWIFT gpi.',
    `UETR: ${uetr}`,
    '',
    'Could you confirm its current status, which bank is holding it, and whether anything is needed from me?',
    '',
    'Thank you.',
  ].join('\n');
}
