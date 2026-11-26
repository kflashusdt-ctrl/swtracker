import { cn } from '@/lib/utils';

// An annotated, clearly-marked SAMPLE MT103 showing where the SWIFT codes sit.
// Placeholder people and the standard example IBANs only.
const LINES = [
  { t: '{1:F01BARCGB22AXXX0000000000}{2:I103DEUTDEFFXXXXN}' },
  { t: '{3:{121:eb6305c9-1f7f-49de-aed0-16487c27b42d}}', tag: 'UETR', color: 'var(--color-seg-branch)' },
  { t: '{4:' },
  { t: ':20:REF2611260001', tag: 'Reference', color: 'var(--color-ink-2)' },
  { t: ':23B:CRED' },
  { t: ':32A:261126EUR1250,00', tag: 'Date · currency · amount', color: 'var(--color-seg-location)' },
  { t: ':50K:/GB29NWBK60161331926819' },
  { t: 'JOHN SMITH', tag: 'Sender', color: 'var(--color-ink-2)' },
  { t: ':52A:BARCGB22', tag: 'Sender’s bank SWIFT', color: 'var(--color-seg-bank)', strong: true },
  { t: ':57A:DEUTDEFF', tag: 'Recipient’s bank SWIFT', color: 'var(--color-seg-country)', strong: true },
  { t: ':59:/DE89370400440532013000' },
  { t: 'MAX MUSTERMANN', tag: 'Recipient', color: 'var(--color-ink-2)' },
  { t: ':71A:SHA', tag: 'Who pays fees', color: 'var(--color-sub)' },
  { t: '-}' },
];

export default function Mt103Sample({ className }) {
  return (
    <figure className={cn('relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-34px_rgba(11,31,58,0.4)]', className)}>
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold text-ink">MT103 · single customer transfer</span>
        <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] text-white">SAMPLE</span>
      </div>
      <div className="relative px-2 py-3 sm:px-3 sm:py-4">
        <span
          aria-hidden="true"
          className="display pointer-events-none absolute inset-0 grid place-items-center text-[64px] text-ink/[0.035] sm:text-[96px]"
          style={{ transform: 'rotate(-18deg)' }}
        >
          Sample
        </span>
        <ol className="relative font-mono text-[12.5px] leading-6 text-ink-2 sm:text-[13.5px]">
          {LINES.map((l, i) => (
            <li
              key={i}
              className={cn('flex flex-wrap items-center justify-between gap-x-3 rounded-md px-2.5', l.tag && 'py-0.5')}
              style={l.tag ? { background: `color-mix(in srgb, ${l.color} ${l.strong ? 11 : 6}%, transparent)` } : undefined}
            >
              <span className={cn('break-all', l.strong && 'font-bold')} style={l.strong ? { color: l.color } : undefined}>
                {l.t}
              </span>
              {l.tag && (
                <span className="font-sans text-[11px] font-semibold uppercase tracking-wide sm:text-xs" style={{ color: l.color }}>
                  {l.tag}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
      s
    </figure>
  );
}
