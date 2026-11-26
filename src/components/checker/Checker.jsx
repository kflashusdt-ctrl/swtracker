import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BankAvatar, Flag, Skeleton } from '@/components/site/bits';
import { SEGMENTS, branchLabel, countryName, normalize, parseBic, prettyName, splitBic } from '@/lib/bic';
import { filterRows, getCountries, getCountry } from '@/lib/data';
import { useAsync } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/** The four parts of a code, colour-coded. */
export function CodeBreakdown({ bic, size = 'md' }) {
  const parts = splitBic(bic);
  const lg = size === 'lg';
  return (
    <div className="grid grid-cols-[4fr_2.4fr_2.4fr_3fr] gap-1.5 sm:gap-2.5">
      {SEGMENTS.map((s) => {
        const val = parts[s.key];
        const filled = val.length > 0;
        const note =
          s.key === 'country' && val.length === 2
            ? countryName(val)
            : s.key === 'branch' && bic.length >= 8 && (val === '' || val === 'XXX')
              ? 'Head office'
              : s.optional && !filled
                ? 'Optional'
                : null;
        return (
          <div key={s.key} className="min-w-0">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg border font-mono font-semibold transition-colors',
                lg ? 'h-14 text-xl tracking-[0.16em] sm:h-16 sm:text-[26px]' : 'h-11 text-[15px] tracking-[0.14em] sm:text-lg',
                filled ? 'bg-white' : 'border-dashed bg-paper text-sub/40',
              )}
              style={filled ? { color: s.color, borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)` } : undefined}
            >
              {val.padEnd(s.len, '·')}
            </div>
            <div className="mt-1.5 h-[3px] rounded-full" style={{ background: filled ? s.color : 'var(--color-line)' }} />
            <p className="mt-1.5 truncate text-xs font-semibold text-ink sm:text-[13px]">{s.short}</p>
            <p className="truncate text-[11px] text-sub sm:text-xs">{note ?? ' '}</p>
          </div>
        );
      })}
    </div>
  );
}

const EXAMPLES = ['DEUTDEFF', 'BARCGB22', 'CHASUS33', 'HSBCHKHH'];

function CodeForm() {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();
  const parsed = parseBic(value);
  const invalid = touched && !parsed.valid;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (parsed.valid) navigate(`/swift-code/${parsed.bic}`);
  };

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="bic" className="mb-2 block text-sm font-semibold text-ink">
        Enter a SWIFT / BIC code
      </label>
      <Input
        id="bic"
        value={value}
        onChange={(e) => {
          setValue(normalize(e.target.value));
          if (touched) setTouched(false);
        }}
        placeholder="e.g. AAAA BB CC 123"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        aria-describedby="bic-msg"
        className="h-14 rounded-xl border-input bg-white px-4 font-mono !text-xl font-semibold tracking-[0.14em] text-ink uppercase shadow-none placeholder:font-sans placeholder:!text-base placeholder:font-normal placeholder:tracking-normal placeholder:normal-case focus-visible:border-seg-bank focus-visible:ring-seg-bank/15"
      />
      <div id="bic-msg" aria-live="polite" className="min-h-6 pt-2 text-sm">
        <AnimatePresence mode="wait" initial={false}>
          {invalid ? (
            <motion.p key="e" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-bad">
              {parsed.errors[0]}
            </motion.p>
          ) : (
            <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sub">
              8 or 11 characters. Spaces and dashes are ignored.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3">
        <CodeBreakdown bic={parsed.bic} />
      </div>

      <Button type="submit" variant="gold" size="xl" className="mt-5 w-full">
        Check SWIFT code
        <ArrowRight />
      </Button>

      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-sm text-sub">
        <span>Try</span>
        {EXAMPLES.map((ex, i) => (
          <span key={ex}>
            <Link to={`/swift-code/${ex}`} className="font-mono font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-gold">
              {ex}
            </Link>
            {i < EXAMPLES.length - 1 && <span className="text-sub">,</span>}
          </span>
        ))}
      </p>
    </form>
  );
}

function guessCountry() {
  const m = ((typeof navigator !== 'undefined' && navigator.language) || '').match(/-([A-Z]{2})$/i);
  return m ? m[1].toUpperCase() : 'GB';
}

export function ResultRow({ r, compact }) {
  return (
    <li>
      <Link
        to={`/swift-code/${r.bic}`}
        className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-paper sm:gap-4 sm:px-4"
      >
        <BankAvatar name={r.bank} src={r.logo} size={compact ? 38 : 44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{prettyName(r.bank)}</p>
          <p className="truncate text-sm text-sub">{[prettyName(r.city), branchLabel(r)].filter(Boolean).join(' · ')}</p>
          <p className="mt-0.5 font-mono text-[13px] font-semibold tracking-[0.08em] text-ink min-[520px]:hidden">{r.bic}</p>
        </div>
        <span className="hidden shrink-0 font-mono text-sm font-semibold tracking-[0.08em] text-ink min-[520px]:inline">{r.bic}</span>
        <ChevronRight className="hidden size-4 shrink-0 text-sub transition group-hover:translate-x-0.5 group-hover:text-ink sm:block" />
      </Link>
    </li>
  );
}

function BankSearch() {
  const countries = useAsync(getCountries, []);
  const [cc, setCc] = useState('');
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query.trim());

  useEffect(() => {
    if (!countries.data || cc) return;
    const g = guessCountry();
    setCc(countries.data.byCode[g] ? g : 'GB');
  }, [countries.data, cc]);

  const rows = useAsync(() => (cc ? getCountry(cc) : new Promise(() => {})), [cc]);
  const results = useMemo(() => (rows.data && deferred ? filterRows(rows.data, deferred) : []), [rows.data, deferred]);
  const country = countries.data?.byCode[cc];

  return (
    <div>
      <label htmlFor="country" className="mb-2 block text-sm font-semibold text-ink">
        Country
      </label>
      <div className="relative">
        {cc && <Flag code={cc} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />}
        <select
          id="country"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
          className="h-14 w-full appearance-none rounded-xl border border-input bg-white pl-14 pr-10 text-base font-medium text-ink outline-none focus-visible:border-seg-bank focus-visible:ring-[3px] focus-visible:ring-seg-bank/15"
        >
          {!countries.data && <option>Loading countries…</option>}
          {countries.data?.list.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 rotate-90 text-sub" />
      </div>

      <label htmlFor="bank-q" className="mb-2 mt-4 block text-sm font-semibold text-ink">
        Bank name, city or branch
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-sub" />
        <Input
          id="bank-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={cc === 'GB' ? 'e.g. Barclays London' : 'e.g. bank name'}
          autoComplete="off"
          className="h-14 rounded-xl bg-white pl-12 !text-base shadow-none focus-visible:border-seg-bank focus-visible:ring-seg-bank/15"
        />
      </div>

      <div className="mt-4 min-h-28" aria-live="polite">
        {rows.loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : rows.error ? (
          <p className="text-sm text-bad">Couldn’t load the bank list. Check your connection and try again.</p>
        ) : !deferred ? (
          <p className="rounded-xl bg-paper px-4 py-4 text-sm text-sub">
            <span className="font-semibold text-ink">{rows.data?.length.toLocaleString('en-US')}</span> codes in {country?.name}. Start
            typing a bank name to search them.
          </p>
        ) : results.length === 0 ? (
          <p className="rounded-xl bg-paper px-4 py-4 text-sm text-sub">
            No banks in {country?.name} match “{deferred}”. Check the country, or try fewer words.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between pb-1 text-sm">
              <span className="text-sub">
                {results.length.toLocaleString('en-US')} result{results.length === 1 ? '' : 's'}
              </span>
              {results.length > 8 && (
                <Link className="font-semibold text-ink underline underline-offset-4" to={`/countries/${cc}?q=${encodeURIComponent(deferred)}`}>
                  See all
                </Link>
              )}
            </div>
            <ul className="-mx-3 sm:-mx-4">
              {results.slice(0, 8).map((r) => (
                <ResultRow key={r.bic} r={r} compact />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckerCard() {
  const [tab, setTab] = useState('code');
  return (
    <div
      id="check"
      className="mx-auto max-w-2xl scroll-mt-24 rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,58,0.06),0_30px_70px_-30px_rgba(11,31,58,0.45)] ring-1 ring-black/[0.04] sm:p-9"
    >
      <div className="text-center">
        <h2 className="heading text-2xl text-ink sm:text-[28px]">{tab === 'code' ? 'Check a SWIFT code' : 'Find a SWIFT code'}</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-sub sm:text-base">
          {tab === 'code'
            ? 'Enter a SWIFT/BIC to check it’s correct and find out which bank it belongs to.'
            : 'Search by bank name to find its SWIFT code and branches.'}
        </p>
      </div>

      <div role="tablist" className="mx-auto mt-6 grid max-w-sm grid-cols-2 rounded-full bg-paper p-1">
        {[
          ['code', 'I have a code'],
          ['bank', 'I need a code'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn('relative rounded-full py-2.5 text-sm font-semibold transition-colors', tab === id ? 'text-white' : 'text-sub hover:text-ink')}
          >
            {tab === id && (
              <motion.span layoutId="checker-tab" className="absolute inset-0 rounded-full bg-navy" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />
            )}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === 'code' ? <CodeForm /> : <BankSearch />}</div>
    </div>
  );
}
