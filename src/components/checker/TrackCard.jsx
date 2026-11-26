import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UETR_PARTS, normalizeUetr, parseUetr, splitUetr } from '@/lib/uetr';
import { cn } from '@/lib/utils';

/** Five-part breakdown of a UETR, styled like the SWIFT code breakdown. */
export function UetrBreakdown({ uetr }) {
  const parts = splitUetr(uetr);
  return (
    <div className="grid grid-cols-[8fr_4fr_4fr_4fr_12fr] gap-1 sm:gap-2">
      {UETR_PARTS.map((p, i) => {
        const val = parts[i];
        const filled = val.length > 0;
        const done = val.length === p.len;
        return (
          <div key={i} className="min-w-0">
            <div
              className={cn(
                'flex h-11 items-center justify-center overflow-hidden rounded-lg border px-1 font-mono text-[11px] font-semibold sm:text-sm',
                filled ? 'bg-white' : 'border-dashed bg-paper text-sub/40',
              )}
              style={filled ? { color: p.color, borderColor: `color-mix(in srgb, ${p.color} 35%, transparent)` } : undefined}
            >
              <span className="truncate">{filled ? val : '·'.repeat(Math.min(p.len, 4))}</span>
            </div>
            <div className="mt-1.5 h-[3px] rounded-full" style={{ background: done ? p.color : 'var(--color-line)' }} />
            <p className="mt-1.5 truncate text-[11px] font-semibold text-ink sm:text-xs">
              {val.length}/{p.len}
            </p>
            <p className="hidden truncate text-[11px] text-sub sm:block sm:text-xs">{p.note ?? ' '}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackCard() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();
  const parsed = parseUetr(value);
  const invalid = touched && !parsed.valid;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (parsed.valid) navigate(`/track/${parsed.uetr}`);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.06),0_30px_70px_-30px_rgba(11,31,58,0.45)] ring-1 ring-black/[0.04] sm:p-9">
      <div className="text-center">
        <h2 className="heading text-2xl text-ink sm:text-[28px]">Check a payment status</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-sub sm:text-base">
          Enter the UETR from your bank’s payment confirmation to see any status your bank has reported.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="mt-7">
        <label htmlFor="uetr" className="mb-2 block text-sm font-semibold text-ink">
          Enter a UETR
        </label>
        <Input
          id="uetr"
          value={value}
          onChange={(e) => {
            setValue(normalizeUetr(e.target.value));
            if (touched) setTouched(false);
          }}
          placeholder="e.g. eb6305c9-1f7f-49de-aed0-16487c27b42d"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby="uetr-msg"
          className="h-14 rounded-xl border-input bg-white px-4 font-mono !text-[15px] font-semibold tracking-[0.02em] text-ink shadow-none placeholder:font-sans placeholder:!text-base placeholder:font-normal focus-visible:border-seg-bank focus-visible:ring-seg-bank/15 sm:!text-lg"
        />
        <div id="uetr-msg" aria-live="polite" className="min-h-6 pt-2 text-sm">
          <AnimatePresence mode="wait" initial={false}>
            {invalid ? (
              <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-bad">
                {parsed.error}
              </motion.p>
            ) : (
              <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sub">
                36 characters. It’s field 121 on your MT103 — ask your bank if you don’t have it.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3">
          <UetrBreakdown uetr={parsed.uetr} />
        </div>

        <Button type="submit" variant="gold" size="xl" className="mt-5 w-full">
          Check status
          <ArrowRight />
        </Button>
      </form>
    </div>
  );
}
