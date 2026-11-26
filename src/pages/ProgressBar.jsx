import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// 12 hours from the moment the payment reached the FINAL bank = 100%
// Starts at 45% so the bar has visible space to move.
const START_PCT = 10;
const TOTAL_MS = 14 * 60 * 60 * 1000; // 14 hours

export function computeProgress(events, nowMs = Date.now()) {
  if (!events?.length) return { percent: 0, phase: 'Waiting', tone: 'info' };

  const last = events[events.length - 1];

  // Terminal states
  if (last.status === 'ACCC') return { percent: 100, phase: 'Completed', tone: 'ok' };
  if (last.status === 'RJCT') return { percent: 100, phase: 'Rejected', tone: 'bad' };

  // The 12-hour clock starts when the payment reached the FINAL bank
  // (the last ACSP with reason G002 or G003).
  const reachedFinalBank = [...events]
    .reverse()
    .find((e) => e.status === 'ACSP' && (e.reason === 'G002' || e.reason === 'G003'));

  const anchor = reachedFinalBank?.occurredAt || events[events.length - 1].occurredAt;
  const anchorMs = Date.parse(anchor);
  const elapsed = Math.max(0, nowMs - anchorMs);

  // 0h -> 45%,  12h -> 100%
  const ratio = Math.min(1, elapsed / TOTAL_MS);
  const percent = Math.min(100, Math.round(START_PCT + ratio * (100 - START_PCT)));

  // Phase
  let phase = 'With the banks';
  let tone = 'info';
  if (percent >= 80) { phase = 'Finalizing'; tone = 'warn'; }
  if (percent >= 100) { phase = 'Completed'; tone = 'ok'; }

  return { percent, phase, tone };
}

export default function ProgressBar({ events }) {
  const [, setTick] = useState(0);

  // Re-render every 30s so the bar visibly moves while the page is open
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const { percent, phase, tone } = computeProgress(events);

  const fillColor =
    tone === 'ok' ? 'bg-ok' :
    tone === 'warn' ? 'bg-warn' :
    tone === 'bad' ? 'bg-bad' :
    'bg-seg-bank';

  return (
    <div className="mt-6 mb-8">
      <div className="flex items-end justify-between mb-2">
        <span className={cn('font-semibold text-sm',
          tone === 'ok' ? 'text-ok' :
          tone === 'warn' ? 'text-warn' :
          tone === 'bad' ? 'text-bad' :
          'text-ink'
        )}>
          {phase}
        </span>
        <span className="font-mono text-sm font-bold text-ink">{percent}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', fillColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {percent >= 80 && percent < 100 && (
        <p className="mt-2 text-xs text-warn">
          Finalizing… the banks are confirming the final credit to the recipient.
        </p>
      )}
    </div>
  );
}